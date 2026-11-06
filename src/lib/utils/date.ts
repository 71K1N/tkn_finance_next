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

/** Whether `value` is an existing calendar day written as `YYYY-MM-DD`. */
function isCalendarDay(value: string | null | undefined): value is string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * Period carried by `from`/`to` query params, or `null` when either is missing, isn't a
 * real `YYYY-MM-DD` day, or the range is reversed (ISO days compare correctly as strings).
 */
export function periodFromSearchParams(params: { get(name: string): string | null }): { from: string; to: string } | null {
    const from = params.get("from");
    const to = params.get("to");
    if (!isCalendarDay(from) || !isCalendarDay(to) || from > to) return null;
    return { from, to };
}

/**
 * Same day-of-month as `dueDate` (`YYYY-MM-DD`, any time part ignored), in the current
 * month of the browser's timezone. Clamped to the month's last day, so the 31st becomes
 * the 28th/29th/30th in shorter months. Returns "" when `dueDate` isn't a valid date.
 */
export function projectDueDateToCurrentMonth(dueDate: string | null | undefined): string {
    if (!dueDate) return "";
    const day = Number(dueDate.split("T")[0].split("-")[2]);
    if (!day) return "";

    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), Math.min(day, lastDay)));
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

/** `YYYY-MM-DD` of the day `days` after (or before, if negative) `day`, in local time. */
export function addDaysISO(day: string, days: number): string {
    const [year, month, date] = day.split("-").map(Number);
    return toDateInputValue(new Date(year, month - 1, date + days));
}

/**
 * Due status of a `YYYY-MM-DD` due date against `today`, with the short date:
 * "Venceu há 6 dias · 31/10", "Venceu ontem · 05/11", "Vence hoje · 06/11",
 * "Vence amanhã · 07/11", "Vence em 9 dias · 15/11".
 * Splits the strings manually, never `new Date(string)`.
 */
export function dueStatusLabel(dueDate: string, today: string = todayLocalISO()): string {
    const [dy, dm, dd] = dueDate.split("-").map(Number);
    const [ty, tm, td] = today.split("-").map(Number);
    // Math.round absorbs the 23h/25h days around DST changes.
    const diff = Math.round((new Date(dy, dm - 1, dd).getTime() - new Date(ty, tm - 1, td).getTime()) / 86_400_000);
    const relative =
        diff === 0 ? "Vence hoje"
            : diff === 1 ? "Vence amanhã"
                : diff === -1 ? "Venceu ontem"
                    : diff > 0 ? `Vence em ${diff} dias` : `Venceu há ${-diff} dias`;
    return `${relative} · ${formatDateBR(dueDate, { day: "2-digit", month: "2-digit" })}`;
}
