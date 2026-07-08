export type RolloverPolicy = "no_rollover" | "carry_balance";

export type Budget = {
    id: string;
    userId: number;
    categoryId: string;
    month: string;
    amount: number;
    spent: number;
    rolloverPolicy: RolloverPolicy;
};

export type BudgetInput = {
    categoryId: string;
    month: string;
    amount: number;
    rolloverPolicy?: RolloverPolicy;
};
