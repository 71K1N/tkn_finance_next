// Banks print the minus as U+2212 ("−") or an en dash, not the keyboard's hyphen.
const AMOUNT_PATTERN = /^([+\-−–]?)\s*R\$\s*(\d{1,3}(?:\.\d{3})*|\d+),(\d{2})$/;

/**
 * Reads an amount written as `−R$ 5.485,00`, `+R$ 5.343,73` or `R$ 10,00` into reais.
 * Returns `null` when the text isn't one of those shapes. Built from integer cents so
 * thousands separators and decimals never go through float parsing.
 */
export function parseStatementAmount(text: string): number | null {
    const match = AMOUNT_PATTERN.exec(text.trim());
    if (!match) return null;

    const [, sign, whole, cents] = match;
    const value = (Number(whole.replace(/\./g, "")) * 100 + Number(cents)) / 100;
    return sign && sign !== "+" ? -value : value;
}
