export type CsvRecord = {
    /** 1-based line where the record starts. */
    line: number;
    fields: string[];
};

/**
 * Minimal RFC 4180 reader: fields may be quoted or not within the same row, quotes inside a
 * quoted field are doubled, and a quoted field may span lines. Blank lines are skipped.
 */
export function readCsv(text: string): CsvRecord[] {
    const source = text.replace(/^﻿/, "");
    const records: CsvRecord[] = [];

    let fields: string[] = [];
    let field = "";
    let inQuotes = false;
    let line = 1;
    let recordLine = 1;

    const endField = () => {
        fields.push(field);
        field = "";
    };
    const endRecord = () => {
        endField();
        if (fields.length > 1 || fields[0].trim() !== "") {
            records.push({ line: recordLine, fields });
        }
        fields = [];
    };

    for (let i = 0; i < source.length; i++) {
        const char = source[i];

        if (inQuotes) {
            if (char === '"') {
                if (source[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                if (char === "\n") line++;
                field += char;
            }
        } else if (char === '"' && field === "") {
            inQuotes = true;
        } else if (char === ",") {
            endField();
        } else if (char === "\r" || char === "\n") {
            if (char === "\r" && source[i + 1] === "\n") i++;
            endRecord();
            line++;
            recordLine = line;
        } else {
            field += char;
        }
    }

    if (field !== "" || fields.length > 0) endRecord();

    return records;
}
