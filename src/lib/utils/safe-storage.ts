/**
 * `localStorage` access that never throws: private mode, blocked site data and SSR all
 * make the accessor unavailable or throw, and callers treat that as "nothing stored".
 */

export function safeStorageGet(key: string): string | null {
    try {
        if (typeof window === "undefined") return null;
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function safeStorageSet(key: string, value: string): void {
    try {
        if (typeof window === "undefined") return;
        window.localStorage.setItem(key, value);
    } catch {
        // Storage is only a convenience; ignore failures.
    }
}
