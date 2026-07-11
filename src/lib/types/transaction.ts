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
    user_id: number;
};

export type TransactionInput = {
    name: string;
    description: string;
    amount: number;
    due_date?: string;
    subcategory_id?: string;
    account_id: string;
    target_account_id?: string;
    type: TransactionType;
    user_id?: number;
};

export type PaymentInput = {
    payment_date?: string;
    paid_amount: number;
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
