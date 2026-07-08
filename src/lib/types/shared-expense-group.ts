export type ShareType = "equal" | "percentage" | "fixed";
export type SplitType = "equal" | "percentage" | "fixed" | "shares";
export type GroupExpenseStatus = "active" | "void";

export type GroupMember = {
    user_id: number;
    share_type: ShareType;
    share_value: number | null;
    active: boolean;
    joined_at: string;
};

export type ExpenseGroup = {
    id: string;
    name: string;
    description: string | null;
    owner_id: number;
    members: GroupMember[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type CreateExpenseGroupInput = {
    name: string;
    description?: string;
};

export type UpdateExpenseGroupInput = {
    name?: string;
    description?: string;
};

export type AddGroupMemberInput = {
    user_id: number;
    share_type: ShareType;
    share_value?: number;
};

export type UpdateGroupMemberInput = {
    share_type: ShareType;
    share_value?: number;
};

export type SplitOverride = {
    user_id: number;
    share_value: number;
};

export type ExpenseSplit = {
    id: string;
    user_id: number;
    share_value: number;
    amount_owed: number;
};

export type GroupExpense = {
    id: string;
    group_id: string;
    description: string;
    amount: number;
    paid_by: number;
    expense_date: string;
    split_type: SplitType;
    status: GroupExpenseStatus;
    transaction_id: string | null;
    splits?: ExpenseSplit[];
};

export type CreateGroupExpenseInput = {
    description: string;
    amount: number;
    expense_date?: string;
    split_type?: SplitType;
    overrides?: SplitOverride[];
};

export type GroupBalance = {
    user_id: number;
    balance: number;
};

export type SettlementSuggestion = {
    from_user_id: number;
    to_user_id: number;
    amount: number;
};

export type ExpenseSettlement = {
    id: string;
    group_id: string;
    from_user_id: number;
    to_user_id: number;
    amount: number;
    note: string | null;
    settled_at: string;
};

export type RecordSettlementInput = {
    to_user_id: number;
    amount: number;
    note?: string;
};
