export type SavingsGoal = {
    id: string;
    userId: number;
    targetAmount: number;
    currentSaved: number;
    monthlyAllocation: number;
    projectedCompletionDate: string | null;
};

export type SavingsGoalInput = {
    targetAmount: number;
    monthlyAllocation: number;
};
