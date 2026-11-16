import type { Transaction } from "@/lib/types/transaction";

export function isTransfer(transaction: Pick<Transaction, "type">): boolean {
    return transaction.type === "transfer";
}

/**
 * Origin and destination accounts of a transfer, whichever leg is given: the mirror leg
 * lives in the destination account, so its `account_id`/`target_account_id` are swapped.
 */
export function transferEnds(
    transaction: Pick<Transaction, "account_id" | "target_account_id" | "is_transfer_mirror">,
): { fromId: string; toId: string } {
    const own = transaction.account_id ?? "";
    const other = transaction.target_account_id ?? "";
    return transaction.is_transfer_mirror ? { fromId: other, toId: own } : { fromId: own, toId: other };
}
