import type { Transaction } from "@/lib/types/transaction";
import { matchCategoryRule, type CategoryRule } from "./category-rules";
import type { KeyedStatementLine } from "./import-key";
import { normalizeText } from "./text";

/** How far a statement date may be from a planned transaction's due date to still match it. */
export const SETTLEMENT_WINDOW_DAYS = 5;

export type ProposedAction =
    | { kind: "imported" }
    | { kind: "transfer" }
    | { kind: "settle"; transactionId: string }
    | { kind: "ambiguous"; candidateIds: string[] }
    | { kind: "create"; subcategoryId: string | null };

export type ClassifiedLine = KeyedStatementLine & { action: ProposedAction };

export type ClassifyContext = {
    accountId: string;
    /** The account holder's name as the bank prints it; empty disables transfer detection. */
    holderName: string;
    /** Transactions that might be settled by a line; unpaid ones of the account are picked from it. */
    transactions: Transaction[];
    rules: CategoryRule[];
    windowDays?: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function dayNumber(date: string): number {
    const [year, month, day] = date.split("T")[0].split("-").map(Number);
    return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

const toCents = (value: number) => Math.round(value * 100);

export function isOwnTransfer(counterpart: string, holderName: string): boolean {
    const holder = normalizeText(holderName);
    return holder !== "" && normalizeText(counterpart) === holder;
}

/** Unpaid transactions of the account with the line's type and amount, due within the window. */
export function findSettlementCandidates(
    line: KeyedStatementLine,
    context: Pick<ClassifyContext, "accountId" | "transactions" | "windowDays">,
): Transaction[] {
    const type = line.amount < 0 ? "expense" : "income";
    const cents = toCents(Math.abs(line.amount));
    const window = context.windowDays ?? SETTLEMENT_WINDOW_DAYS;
    const lineDay = dayNumber(line.date);

    return context.transactions.filter(
        (transaction) =>
            transaction.account_id === context.accountId &&
            !transaction.payment_date &&
            !!transaction.due_date &&
            transaction.type.toLowerCase() === type &&
            toCents(transaction.amount) === cents &&
            Math.abs(dayNumber(transaction.due_date) - lineDay) <= window,
    );
}

/**
 * Proposes one action per line, in this order: already imported, own transfer, settle a
 * planned transaction, create a new one. Lines are visited oldest first so a planned
 * transaction is claimed by the earliest matching line and the next one falls through to
 * "create"; a line with several free candidates is left ambiguous for the user.
 */
export function classifyLines(lines: KeyedStatementLine[], context: ClassifyContext): ClassifiedLine[] {
    const claimed = new Set<string>();
    const actions = new Map<KeyedStatementLine, ProposedAction>();

    const chronological = [...lines].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));

    for (const line of chronological) {
        if (line.imported) {
            actions.set(line, { kind: "imported" });
            continue;
        }
        if (isOwnTransfer(line.counterpart, context.holderName)) {
            actions.set(line, { kind: "transfer" });
            continue;
        }

        const free = findSettlementCandidates(line, context).filter((candidate) => !claimed.has(candidate.id));
        if (free.length === 1) {
            claimed.add(free[0].id);
            actions.set(line, { kind: "settle", transactionId: free[0].id });
        } else if (free.length > 1) {
            actions.set(line, { kind: "ambiguous", candidateIds: free.map((candidate) => candidate.id) });
        } else {
            actions.set(line, { kind: "create", subcategoryId: matchCategoryRule(context.rules, line.counterpart) });
        }
    }

    return lines.map((line) => ({ ...line, action: actions.get(line)! }));
}
