export type TransactionType = "EXPENSE" | "INCOME";

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
    type: TransactionType;
    is_planned?: boolean;
    user_id: number;
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
    type: TransactionType;
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
