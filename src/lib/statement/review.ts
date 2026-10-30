import type { SaveItem } from "@/lib/api/statement-import";
import type { Subcategory } from "@/lib/types/subcategory";
import type { Transaction } from "@/lib/types/transaction";
import type { ClassifiedLine } from "./classify";

export type RowChoice = "imported" | "ignore" | "create" | "settle" | "transfer";

/** One statement line on the review screen, with what the user decided to do with it. */
export type ReviewRow = {
    line: ClassifiedLine;
    choice: RowChoice;
    /** Planned transactions the line could settle. */
    candidateIds: string[];
    settleId: string;
    name: string;
    description: string;
    categoryId: string;
    subcategoryId: string;
    /** Remember the chosen subcategory for lines from the same counterpart. */
    saveRule: boolean;
    otherAccountId: string;
};

export function buildReviewRows(lines: ClassifiedLine[], subcategories: Subcategory[]): ReviewRow[] {
    return lines.map((line) => {
        const { action } = line;
        const subcategoryId = action.kind === "create" ? (action.subcategoryId ?? "") : "";

        let choice: RowChoice = "create";
        if (action.kind === "imported") choice = "imported";
        // A possible own transfer isn't income or expense; nothing is saved until the user
        // says which account is on the other side.
        else if (action.kind === "transfer") choice = "ignore";
        else if (action.kind === "settle" || action.kind === "ambiguous") choice = "settle";

        return {
            line,
            choice,
            candidateIds:
                action.kind === "settle"
                    ? [action.transactionId]
                    : action.kind === "ambiguous"
                      ? action.candidateIds
                      : [],
            settleId: action.kind === "settle" ? action.transactionId : "",
            name: line.counterpart,
            description: line.type,
            categoryId: subcategories.find((sub) => sub.id === subcategoryId)?.categoryId ?? "",
            subcategoryId,
            saveRule: false,
            otherAccountId: "",
        };
    });
}

export function availableChoices(row: ReviewRow): RowChoice[] {
    if (row.choice === "imported") return ["imported"];
    return row.candidateIds.length > 0
        ? ["create", "settle", "transfer", "ignore"]
        : ["create", "transfer", "ignore"];
}

export const isSaved = (choice: RowChoice) => choice === "create" || choice === "settle" || choice === "transfer";

/** What is still missing on each row (`null` when it is ready), in the same order as `rows`. */
export function validateRows(rows: ReviewRow[], accountId: string): (string | null)[] {
    const claims = new Map<string, number>();
    rows.forEach((row) => {
        if (row.choice === "settle" && row.settleId) claims.set(row.settleId, (claims.get(row.settleId) ?? 0) + 1);
    });

    return rows.map((row) => {
        if (row.choice === "create") return row.name.trim() ? null : "Informe o nome.";
        if (row.choice === "settle") {
            if (!row.settleId) return "Escolha a transação a baixar.";
            return (claims.get(row.settleId) ?? 0) > 1 ? "Essa transação já foi escolhida em outra linha." : null;
        }
        if (row.choice === "transfer") {
            if (!row.otherAccountId) return "Escolha a outra conta.";
            return row.otherAccountId === accountId ? "A outra conta deve ser diferente da conta do extrato." : null;
        }
        return null;
    });
}

/** The rows to save, in file order. Callers check `validateRows` first. */
export function toSaveItems(rows: ReviewRow[], transactions: Transaction[]): SaveItem[] {
    const byId = new Map(transactions.map((transaction) => [transaction.id, transaction]));
    const items: SaveItem[] = [];

    for (const row of rows) {
        const { line } = row;
        if (row.choice === "create") {
            items.push({
                kind: "create",
                line,
                name: row.name.trim(),
                description: row.description.trim(),
                subcategoryId: row.subcategoryId || null,
            });
        } else if (row.choice === "settle") {
            const transaction = byId.get(row.settleId);
            if (transaction) items.push({ kind: "settle", line, transaction });
        } else if (row.choice === "transfer") {
            items.push({ kind: "transfer", line, otherAccountId: row.otherAccountId });
        }
    }

    return items;
}

/**
 * How much the statement account's balance moves if the selected rows are saved: the API applies
 * payments and transfers to the balance as they are recorded.
 */
export function netBalanceEffect(rows: ReviewRow[]): number {
    const cents = rows.reduce((sum, row) => (isSaved(row.choice) ? sum + Math.round(row.line.amount * 100) : sum), 0);
    return cents / 100;
}
