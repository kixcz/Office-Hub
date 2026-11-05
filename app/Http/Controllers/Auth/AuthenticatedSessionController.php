<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\PortalContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();
        if ($user) {
            $user->forceFill(['last_login_at' => now()])->saveQuietly();
        }

        if ($user && ($user->hasRole('Display Screen') || $user->hasRole('tv_display') || $user->email === 'tv@cids.edu.ph')) {
            return redirect()->intended(route('tv-display', absolute: false));
        }

        $portalService = app(PortalContextService::class);
        $available = $portalService->getUserAvailableAssignments($user);

        // If user has an explicit default portal set, activate it and open directly
        if ($user->default_role_assignment_id) {
            $default = $available->firstWhere('id', $user->default_role_assignment_id);
            if ($default) {
                $portalService->switchContext($user, $default['id'], $request);

                return redirect()->intended($default['landing_url']);
            }
        }

        // If user has multiple roles and no designated default, direct to Choose Workspace
        if ($available->count() > 1 && ! $user->default_role_assignment_id) {
            return redirect()->route('context.choose-workspace');
        }

        $active = $portalService->getActiveAssignment($user, $request);

        return redirect()->intended($active['landing_url']);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
