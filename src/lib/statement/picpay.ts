import { parseStatementAmount } from "./amount";
import { readCsv } from "./csv";
import {
    StatementFormatError,
    type StatementAdapter,
    type StatementLine,
    type StatementParseResult,
    type StatementRowError,
} from "./types";

const EXPECTED_HEADER = ["data", "hora", "tipo", "origem / destino", "valor", "forma de pagamento"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}(?::\d{2})?$/;

function isRealDate(value: string): boolean {
    if (!DATE_PATTERN.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function parsePicPay(text: string): StatementParseResult {
    const [header, ...rows] = readCsv(text);

    const columns = header?.fields.map((column) => column.trim().toLowerCase());
    if (!columns || EXPECTED_HEADER.some((name, index) => columns[index] !== name)) {
        throw new StatementFormatError(
            `Arquivo fora do formato do extrato PicPay. Colunas esperadas: ${EXPECTED_HEADER.join(", ")}.`,
        );
    }

    const lines: StatementLine[] = [];
    const errors: StatementRowError[] = [];

    for (const { line, fields } of rows) {
        const fail = (message: string) => errors.push({ rowIndex: line, message });

        if (fields.length !== EXPECTED_HEADER.length) {
            fail(`Esperadas ${EXPECTED_HEADER.length} colunas, encontradas ${fields.length}.`);
            continue;
        }

        const [date, time, type, counterpart, rawAmount, method] = fields.map((field) => field.trim());

        if (!isRealDate(date)) {
            fail(`Data inválida: "${date}".`);
            continue;
        }
        if (!TIME_PATTERN.test(time)) {
            fail(`Hora inválida: "${time}".`);
            continue;
        }
        if (!type || !counterpart) {
            fail("Tipo ou origem/destino em branco.");
            continue;
        }
        const amount = parseStatementAmount(rawAmount);
        if (amount === null || amount === 0) {
            fail(`Valor inválido: "${rawAmount}".`);
            continue;
        }

        lines.push({ rowIndex: line, date, time: time.slice(0, 5), type, counterpart, amount, method });
    }

    return { lines, errors };
}

export const picpayAdapter: StatementAdapter = {
    id: "picpay",
    label: "PicPay (CSV)",
    parse: parsePicPay,
};
