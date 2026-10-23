import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Returns the given date (default: now) as a local `YYYY-MM-DD` string.
 * Avoids `toISOString()`, which shifts to UTC and can return the previous day.
 */
export function localDateString(date: Date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Returns a long, human-readable form of today's date, e.g. "Thursday, October 22, 2026".
 */
export function longTodayLabel(date: Date = new Date()): string {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
