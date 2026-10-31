import type { StatementLine } from "./types";

/** Text the API's `search` is run with to find every transaction that came from an import. */
export const IMPORT_MARKER_PREFIX = "[import:";

const MARKER_PATTERN = /\[import:([0-9a-z]+)\]/g;

export type KeyedStatementLine = StatementLine & {
    /** Stable id of the line, written on the saved transaction as `[import:<key>]`. */
    key: string;
    imported: boolean;
};

// cyrb53: fast 53-bit string hash. Not cryptographic, only needs to make accidental collisions
// between a few thousand statement lines negligible.
function hash(text: string): string {
    let h1 = 0xdeadbeef;
    let h2 = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        h1 = Math.imul(h1 ^ code, 2654435761);
        h2 = Math.imul(h2 ^ code, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

function identity(line: StatementLine): string {
    const counterpart = line.counterpart.trim().replace(/\s+/g, " ").toLowerCase();
    const cents = Math.round(line.amount * 100);
    return [line.date, line.time, line.type.toLowerCase(), counterpart, cents].join("|");
}

/**
 * One key per line, in the same order. Lines that are identical (same minute, same
 * counterpart, same amount) are told apart by their order of appearance in the file, so two
 * real purchases of R$ 30,00 at the same shop in the same minute stay two different lines.
 */
export function buildImportKeys(lines: StatementLine[]): string[] {
    const seen = new Map<string, number>();
    return lines.map((line) => {
        const base = identity(line);
        const occurrence = seen.get(base) ?? 0;
        seen.set(base, occurrence + 1);
        return hash(`${base}|${occurrence}`);
    });
}

export function keyStatementLines(lines: StatementLine[], importedKeys: ReadonlySet<string>): KeyedStatementLine[] {
    const keys = buildImportKeys(lines);
    return lines.map((line, index) => ({
        ...line,
        key: keys[index],
        imported: importedKeys.has(keys[index]),
    }));
}

export function formatImportMarker(key: string): string {
    return `${IMPORT_MARKER_PREFIX}${key}]`;
}

/** Every import key written in a transaction description. */
export function readImportKeys(description: string | null | undefined): string[] {
    if (!description) return [];
    return Array.from(description.matchAll(MARKER_PATTERN), (match) => match[1]);
}

/** The description with the marker at the end, unless it already carries that key. */
export function appendImportMarker(description: string | null | undefined, key: string): string {
    const current = (description ?? "").trim();
    if (readImportKeys(current).includes(key)) return current;
    return current ? `${current} ${formatImportMarker(key)}` : formatImportMarker(key);
}
