/** Income or expense: what drafts, filters and reports work with. */
export type TransactionType = "EXPENSE" | "INCOME";

/**
 * What a stored transaction can be: income, expense or a transfer between two of the
 * user's own accounts (lowercase, as the API stores it). Transfers are never income or expense.
 */
export type TransactionKind = TransactionType | "transfer";

export type Transaction = {
    id: string;
    name: string;
    description: string;
    amount: number;
    due_date: string | null;
    payment_date: string | null;
    subcategory_id: string | null;
    account_id: string;
    target_account_id: string | null;
    paid_amount: number | null;
    type: TransactionKind;
    is_planned?: boolean;
    user_id: number;
    /** Shared by both legs of a transfer. */
    transfer_group_id?: string | null;
    /**
     * True on the leg written into the destination account's history; its `account_id` is
     * the destination and `target_account_id` the origin (see `transferEnds`).
     */
    is_transfer_mirror?: boolean;
};

export type TransactionInput = {
    name: string;
    description: string;
    amount: number;
    due_date?: string;
    payment_date?: string;
    paid_amount?: number;
    subcategory_id?: string;
    account_id: string;
    target_account_id?: string;
    /** "transfer" moves money between two accounts and requires `target_account_id`. */
    type: TransactionKind;
};

/** Draft built by the API from a free-text sentence; nothing is saved until the user confirms the form. */
export type TransactionDraft = {
    name: string | null;
    amount: number | null;
    type: TransactionType;
    /** `YYYY-MM-DD`, never in the future. */
    payment_date: string;
    subcategory_id: string | null;
    account_id: string | null;
};

export type DueGroup = {
    /** Sum of `amount` over every transaction in the group, not just the listed `items`. */
    total: number;
    count: number;
    /**
     * Sums of `amount` by type over every transaction in the group (both non-negative;
     * `total = income + expense`). Optional only while older API builds that don't
     * send them are still deployed.
     */
    income?: number;
    expense?: number;
    items: Transaction[];
};

/** Pending transactions: overdue (due before today) and upcoming (due within `days`). */
export type DueTransactions = {
    overdue: DueGroup;
    upcoming: DueGroup & { days: number };
};

export type PaymentInput = {
    payment_date?: string;
    paid_amount: number;
};

export type TransactionFilters = {
    from?: string;
    to?: string;
    type?: TransactionType | "";
    account_id?: string;
    category_id?: string;
    subcategory_id?: string;
    is_planned?: string;
};

export type TransactionSummary = {
    totalExpenses: number;
    totalIncome: number;
    balance: number;
};

export type CategoryBreakdown = {
    month: string;
    categories: {
        categoryId: string;
        categoryName: string;
        total: number;
        transactionCount: number;
    }[];
};

export type MonthlyTrendEntry = {
    month: string;
    income: number;
    expenses: number;
};

export type BalanceEvolutionEntry = {
    month: string;
    balance: number;
};

/** Paid income/expenses and transaction count for one day (`YYYY-MM-DD`); days without movement are not returned. */
export type DailySummaryEntry = {
    date: string;
    expenses: number;
    income: number;
    count: number;
};
