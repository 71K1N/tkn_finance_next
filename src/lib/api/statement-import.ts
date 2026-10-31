import { ApiError } from "./http";
import { createTransaction, getTransactions, payTransaction, updateTransaction } from "./transaction";
import {
    appendImportMarker,
    IMPORT_MARKER_PREFIX,
    readImportKeys,
    type KeyedStatementLine,
} from "@/lib/statement/import-key";
import { SETTLEMENT_WINDOW_DAYS } from "@/lib/statement/classify";
import { toDateInputValue } from "@/lib/utils/date";
import type { Transaction } from "@/lib/types/transaction";

// The API caps pageSize at 100.
const PAGE_SIZE = 100;

/** Every transaction of `accountId` in `from`..`to` (`YYYY-MM-DD`), optionally narrowed by `search`. */
async function fetchAllTransactions(accountId: string, from: string, to: string, search?: string): Promise<Transaction[]> {
    const all: Transaction[] = [];
    let page = 1;
    let totalPages = 1;

    do {
        const response = await getTransactions({
            page,
            pageSize: PAGE_SIZE,
            search,
            from,
            to,
            filters: { account_id: accountId },
        });
        all.push(...response.data);
        totalPages = response.pagination.totalPages;
        page++;
    } while (page <= totalPages);

    return all;
}

/** Import keys already saved on the account's transactions within the statement's period. */
export async function getImportedKeys(accountId: string, from: string, to: string): Promise<Set<string>> {
    const transactions = await fetchAllTransactions(accountId, from, to, IMPORT_MARKER_PREFIX);
    return new Set(transactions.flatMap((transaction) => readImportKeys(transaction.description)));
}

function shiftDate(date: string, days: number): string {
    const [year, month, day] = date.split("-").map(Number);
    return toDateInputValue(new Date(year, month - 1, day + days));
}

/**
 * The account's transactions that a line of the statement period could settle: those due or
 * paid within the period widened by the matching window, so a bill due just outside the
 * statement's first or last day is still found.
 */
export function getSettlementCandidates(
    accountId: string,
    from: string,
    to: string,
    windowDays: number = SETTLEMENT_WINDOW_DAYS,
): Promise<Transaction[]> {
    return fetchAllTransactions(accountId, shiftDate(from, -windowDays), shiftDate(to, windowDays));
}

export type SaveItem =
    | { kind: "create"; line: KeyedStatementLine; name: string; description: string; subcategoryId: string | null }
    | { kind: "settle"; line: KeyedStatementLine; transaction: Transaction }
    | { kind: "transfer"; line: KeyedStatementLine; otherAccountId: string };

export type SaveFailure = { item: SaveItem; message: string };

export type SaveResult = {
    created: number;
    settled: number;
    transferred: number;
    failures: SaveFailure[];
};

function failureMessage(error: unknown): string {
    if (!(error instanceof ApiError)) return "Não foi possível falar com a API.";
    // The API reports the reason in `error` (a string, or a list for validation failures).
    const body = error.body as { error?: unknown; message?: unknown } | undefined;
    const detail = body?.error ?? body?.message;
    const text = Array.isArray(detail) ? detail.join(" ") : detail;
    return typeof text === "string" && text ? text : `A API recusou a gravação (erro ${error.status}).`;
}

async function create(accountId: string, item: Extract<SaveItem, { kind: "create" }>) {
    const { line } = item;
    const amount = Math.abs(line.amount);
    await createTransaction({
        name: item.name,
        description: appendImportMarker(item.description, line.key),
        amount,
        payment_date: line.date,
        paid_amount: amount,
        subcategory_id: item.subcategoryId ?? undefined,
        account_id: accountId,
        type: line.amount < 0 ? "EXPENSE" : "INCOME",
    });
}

// The marker goes on first and is taken back if the payment fails: a paid transaction without
// its marker would be offered again as a new one on the next import, while a marker on an
// unpaid one would hide the line forever.
async function settle(item: Extract<SaveItem, { kind: "settle" }>) {
    const { line, transaction } = item;
    const original = transaction.description ?? "";

    await updateTransaction(transaction.id, { description: appendImportMarker(original, line.key) });
    try {
        await payTransaction(transaction.id, { payment_date: line.date, paid_amount: Math.abs(line.amount) });
    } catch (error) {
        await updateTransaction(transaction.id, { description: original }).catch(() => undefined);
        throw error;
    }
}

// `payment_date` isn't needed by the API for a transfer, but without it the transfer has no date
// the period filter can see, so it would never be found again as an already imported line.
async function transfer(accountId: string, item: Extract<SaveItem, { kind: "transfer" }>) {
    const { line } = item;
    const outgoing = line.amount < 0;
    await createTransaction({
        name: "Transferência",
        description: appendImportMarker(line.type, line.key),
        amount: Math.abs(line.amount),
        payment_date: line.date,
        account_id: outgoing ? accountId : item.otherAccountId,
        target_account_id: outgoing ? item.otherAccountId : accountId,
        type: "transfer",
    });
}

/**
 * Saves the items one by one. A failure doesn't stop the rest and doesn't undo what was already
 * saved; every saved line carries its marker, so importing the file again offers only the failed ones.
 */
export async function saveStatementItems(accountId: string, items: SaveItem[]): Promise<SaveResult> {
    const result: SaveResult = { created: 0, settled: 0, transferred: 0, failures: [] };

    for (const item of items) {
        try {
            if (item.kind === "create") {
                await create(accountId, item);
                result.created++;
            } else if (item.kind === "settle") {
                await settle(item);
                result.settled++;
            } else {
                await transfer(accountId, item);
                result.transferred++;
            }
        } catch (error) {
            result.failures.push({ item, message: failureMessage(error) });
        }
    }

    return result;
}
