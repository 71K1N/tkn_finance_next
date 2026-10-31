/** Lowercase, no accents, single spaces: names compare equal however the bank cased or accented them. */
export function normalizeText(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}
