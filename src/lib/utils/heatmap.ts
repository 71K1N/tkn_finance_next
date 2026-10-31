import { toDateInputValue } from "./date";

/** Number of intensity levels above "no movement". */
export const HEATMAP_LEVELS = 4;

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export type HeatmapWeek = (string | null)[];

/**
 * The year as week columns of 7 days (Sunday first), each cell a `YYYY-MM-DD` key.
 * Cells before Jan 1 and after Dec 31 are `null` so the grid stays aligned. Built from
 * local-date parts only — never `new Date("YYYY-MM-DD")`, which parses as UTC.
 */
export function buildYearWeeks(year: number): HeatmapWeek[] {
    const weeks: HeatmapWeek[] = [];
    let week: HeatmapWeek = new Array(new Date(year, 0, 1).getDay()).fill(null);

    for (let date = new Date(year, 0, 1); date.getFullYear() === year; date.setDate(date.getDate() + 1)) {
        week.push(toDateInputValue(date));
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    }
    if (week.length > 0) {
        weeks.push([...week, ...new Array(7 - week.length).fill(null)]);
    }
    return weeks;
}

/** Month name for the week column that contains the 1st of a month, otherwise `""`. */
export function monthLabelForWeek(week: HeatmapWeek): string {
    const first = week.find((day) => day?.endsWith("-01"));
    return first ? MONTH_LABELS[Number(first.split("-")[1]) - 1] : "";
}

/** Index of the week column holding `day` (`YYYY-MM-DD`), or -1. */
export function weekIndexOf(weeks: HeatmapWeek[], day: string): number {
    return weeks.findIndex((week) => week.includes(day));
}

/**
 * Upper-exclusive cut points between levels, taken as quantiles of the days that had
 * movement. A linear scale would let one huge day flatten every other cell to level 1.
 */
export function quantileThresholds(values: number[]): number[] {
    const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
    if (sorted.length === 0) return [];
    return Array.from({ length: HEATMAP_LEVELS - 1 }, (_, i) =>
        sorted[Math.floor(((i + 1) / HEATMAP_LEVELS) * (sorted.length - 1))],
    );
}

/** 0 for "no movement", otherwise 1..HEATMAP_LEVELS. */
export function levelFor(value: number, thresholds: number[]): number {
    if (!(value > 0)) return 0;
    return 1 + thresholds.filter((threshold) => value > threshold).length;
}
