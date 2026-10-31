/** One statement row, normalized so the rest of the import flow doesn't depend on the bank's layout. */
export type StatementLine = {
    /** 1-based line of the row in the file (the header is line 1). */
    rowIndex: number;
    /** `YYYY-MM-DD`, kept as a string to avoid the UTC shift of `new Date(string)`. */
    date: string;
    /** `HH:mm`. */
    time: string;
    /** The bank's own label, e.g. "Pix enviado". */
    type: string;
    /** Who the money went to or came from. */
    counterpart: string;
    /** In reais; negative is an expense, positive is income. */
    amount: number;
    method: string;
};

export type StatementRowError = {
    rowIndex: number;
    message: string;
};

export type StatementParseResult = {
    lines: StatementLine[];
    errors: StatementRowError[];
};

/** The file as a whole can't be read (not a CSV, wrong header): nothing is parsed. */
export class StatementFormatError extends Error {}

export type StatementAdapter = {
    id: string;
    label: string;
    parse: (text: string) => StatementParseResult;
};
