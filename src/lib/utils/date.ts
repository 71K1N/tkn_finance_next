/**
 * Date helpers that stay in the user's local timezone.
 *
 * `toISOString()` converts to UTC, so in Brazil (UTC-3) anything derived from it between
 * 21:00 and midnight belongs to the *next* day — which shifted the dashboard's reference
 * month and made the app persist tomorrow's date on transactions created in the evening.
 * Everything here goes through the local getters instead.
 */

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * Timezone used to render an instant (a date value with a time component) for display.
 * Fixed rather than left to the browser/runtime's ambient timezone, so the same instant
 * renders as the same day regardless of the viewer's machine or where the app is served
 * from. Mirrors the backend's APP_TIMEZONE default.
 */
const DISPLAY_TIMEZONE = process.env.NEXT_PUBLIC_APP_TIMEZONE || "America/Sao_Paulo";

/** `YYYY-MM-DD` for a Date, in the browser's timezone. */
export function toDateInputValue(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `YYYY-MM-DD` for today, in the browser's timezone. */
export function todayLocalISO(): string {
    return toDateInputValue(new Date());
}

/** `YYYY-MM` for the current month, in the browser's timezone. */
export function currentMonthLocal(): string {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

/** First and last day of the current month as `YYYY-MM-DD`. */
export function currentMonthRange(): { from: string; to: string } {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: toDateInputValue(start), to: toDateInputValue(end) };
}

/**
 * Formats an API date for display in pt-BR.
 *
 * A bare `YYYY-MM-DD` is a calendar date, not an instant — `new Date("2026-07-31")`
 * parses it as UTC midnight, which renders as the 30th in Brazil. Those are split
 * manually. Strings carrying a time component are real instants and are converted
 * normally.
 */
export function formatDateBR(
    value: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" },
    fallback = "N/A",
): string {
    if (!value) return fallback;

    if (value instanceof Date) {
        return value.toLocaleDateString("pt-BR", { ...options, timeZone: DISPLAY_TIMEZONE });
    }

    const [datePart, timePart] = value.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    if (!year || !month || !day) return fallback;

    if (!timePart) {
        const date = new Date(year, month - 1, day);
        if (Number.isNaN(date.getTime())) return fallback;
        return date.toLocaleDateString("pt-BR", options);
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;

    return date.toLocaleDateString("pt-BR", { ...options, timeZone: DISPLAY_TIMEZONE });
}
