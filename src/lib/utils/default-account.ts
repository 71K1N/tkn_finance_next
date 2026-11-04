import { safeStorageGet, safeStorageSet } from "@/lib/utils/safe-storage";

const LAST_ACCOUNT_KEY = "tkn:lastAccountId";

export function getLastAccountId(): string | null {
    return safeStorageGet(LAST_ACCOUNT_KEY);
}

export function setLastAccountId(accountId: string): void {
    if (accountId) safeStorageSet(LAST_ACCOUNT_KEY, accountId);
}

/**
 * Account to pre-select on a new transaction: the only account, otherwise the last one
 * used (if it still exists), otherwise none (empty string).
 */
export function resolveDefaultAccountId(accounts: { id: string }[], lastUsedId: string | null): string {
    if (accounts.length === 1) return accounts[0].id;
    if (lastUsedId && accounts.some((account) => account.id === lastUsedId)) return lastUsedId;
    return "";
}
