import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { initializeTheme } from './hooks/use-appearance';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'OfficeHub';

/**
 * Global Inertia Resilience & Auto-Recovery Manager
 * Ensures transient network errors, 502/503/504 gateway timeouts, or 419 CSRF expirations
 * never leave pages frozen or require manual browser refresh (Ctrl+R / F5), while preventing
 * retry storms or automatic retries of non-idempotent mutations.
 */
let lastRetriedGetUrl: string | null = null;
let lastRetriedAt = 0;
let lastVisitedMethod = 'get';
let lastVisitedUrl: string | null = null;
const activeMutationKeys = new Set<string>();

function showRecoveryToast(message: string, retryAction?: () => void) {
    if (typeof document === 'undefined') return;

    const existing = document.getElementById('officehub-recovery-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'officehub-recovery-banner';
    banner.className =
        'fixed bottom-4 right-4 z-[9999] flex items-center gap-3 rounded-xl border border-amber-500/40 bg-zinc-900/95 px-4 py-3 text-xs font-semibold text-white shadow-xl backdrop-blur-md transition-all';

    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    banner.appendChild(textSpan);

    if (retryAction) {
        const retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.textContent = 'Retry Now';
        retryBtn.className =
            'rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-400 transition-colors cursor-pointer';
        retryBtn.onclick = () => {
            banner.remove();
            retryAction();
        };
        banner.appendChild(retryBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '✕';
    closeBtn.className = 'ml-1 text-zinc-400 hover:text-white cursor-pointer';
    closeBtn.onclick = () => banner.remove();
    banner.appendChild(closeBtn);

    document.body.appendChild(banner);
    window.setTimeout(() => {
        if (banner.parentNode) banner.remove();
    }, 8000);
}

// Prevent duplicate non-GET submissions while an identical mutation is in-flight
router.on('before', (event) => {
    const visit = event.detail.visit;
    const method = (visit.method || 'get').toLowerCase();
    lastVisitedMethod = method;
    lastVisitedUrl = visit.url.toString();

    if (method !== 'get') {
        const key = `${method}:${visit.url.toString()}`;
        if (activeMutationKeys.has(key)) {
            event.preventDefault();
            return false;
        }
        activeMutationKeys.add(key);
    }
});

router.on('finish', (event) => {
    const visit = event.detail.visit;
    const method = (visit.method || 'get').toLowerCase();
    if (method !== 'get') {
        activeMutationKeys.delete(`${method}:${visit.url.toString()}`);
    }
});

// Intercept non-Inertia responses (e.g., 419 CSRF expired, 429 Rate Limit, 502/503/504 Gateway Timeouts)
router.on('invalid', (event) => {
    const status = event.detail.response?.status;
    const isSafeGet = lastVisitedMethod === 'get';
    const targetUrl = lastVisitedUrl || window.location.pathname + window.location.search;

    if (status === 419) {
        event.preventDefault();
        if (isSafeGet) {
            showRecoveryToast('Session refreshed automatically.', () => {
                router.reload({ preserveState: true, preserveScroll: true });
            });
            router.reload({ preserveState: true, preserveScroll: true });
        } else {
            showRecoveryToast('Your session token was refreshed. Please submit your action again.', () => {
                router.reload({ preserveState: true, preserveScroll: true });
            });
        }
        return;
    }

    if (status === 429) {
        event.preventDefault();
        showRecoveryToast('Too many requests right now. Please wait a few seconds before retrying.', () => {
            if (isSafeGet) {
                router.visit(targetUrl, { preserveState: true, preserveScroll: true });
            }
        });
        return;
    }

    // Transient gateway/timeout statuses only (never auto-retry 500 application errors or non-GET mutations)
    if (status === 502 || status === 503 || status === 504 || status === 408) {
        event.preventDefault();
        const now = Date.now();

        if (isSafeGet && (lastRetriedGetUrl !== targetUrl || now - lastRetriedAt > 30000)) {
            lastRetriedGetUrl = targetUrl;
            lastRetriedAt = now;
            showRecoveryToast('Temporary gateway delay. Retrying once...', () => {
                router.visit(targetUrl, { preserveState: true, preserveScroll: true });
            });
            window.setTimeout(() => {
                router.visit(targetUrl, { preserveState: true, preserveScroll: true });
            }, 1500);
        } else {
            showRecoveryToast('The server took too long to respond. Your current view is preserved.', () => {
                if (isSafeGet) {
                    router.visit(targetUrl, { preserveState: true, preserveScroll: true });
                } else {
                    router.reload({ preserveState: true, preserveScroll: true });
                }
            });
        }
        return;
    }

    if (status && status >= 500) {
        event.preventDefault();
        showRecoveryToast('Unable to complete the request right now. Your current page state is preserved.', () => {
            if (isSafeGet) {
                router.visit(targetUrl, { preserveState: true, preserveScroll: true });
            } else {
                router.reload({ preserveState: true, preserveScroll: true });
            }
        });
    }
});

// Intercept network exceptions (offline / DNS / connection reset)
router.on('exception', (event) => {
    event.preventDefault();
    const isSafeGet = lastVisitedMethod === 'get';
    const targetUrl = lastVisitedUrl || window.location.pathname + window.location.search;
    showRecoveryToast('Network connection interrupted. Click Retry when ready.', () => {
        if (isSafeGet) {
            router.visit(targetUrl, { preserveState: true, preserveScroll: true });
        } else {
            router.reload({ preserveState: true, preserveScroll: true });
        }
    });
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#eab308',
        showSpinner: false,
        delay: 120,
    },
});

// This will set light / dark mode on load...
initializeTheme();
