/** Investment accounts only take income and transfers, never expenses. */
export type AccountType = "CHECKING" | "INVESTMENT";

export type BankAccount = {
    id: string;
    description: string;
    balance: number;
    /** Absent only on responses from an API older than the account types; read it with `accountTypeOf`. */
    type?: AccountType;
};

export type BankAccountInput = {
    description: string;
    balance: number;
    type: AccountType;
};

/** `GET /bank-account/total-balance`; `available`/`invested` are missing on an older API. */
export type BalanceTotals = {
    totalBalance: number;
    available?: number;
    invested?: number;
};
