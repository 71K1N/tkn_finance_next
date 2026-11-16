import type { AccountType, BankAccount } from "@/lib/types/bank-account";
import type { TransactionKind } from "@/lib/types/transaction";

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
    CHECKING: "Conta corrente",
    INVESTMENT: "Investimento",
};

/** Accounts from an API older than the account types have none: they are checking accounts. */
export function accountTypeOf(account: Pick<BankAccount, "type"> | null | undefined): AccountType {
    return account?.type === "INVESTMENT" ? "INVESTMENT" : "CHECKING";
}

export function isInvestmentAccount(account: Pick<BankAccount, "type"> | null | undefined): boolean {
    return accountTypeOf(account) === "INVESTMENT";
}

/**
 * Accounts a transaction of this kind may use: an expense never goes to an investment
 * account (the API answers 422); income and transfers may use any account.
 */
export function accountsForType<T extends Pick<BankAccount, "type">>(accounts: T[], kind: TransactionKind): T[] {
    return kind === "EXPENSE" ? accounts.filter((account) => !isInvestmentAccount(account)) : accounts;
}
