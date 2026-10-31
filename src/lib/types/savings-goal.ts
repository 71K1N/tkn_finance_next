export type SavingsGoal = {
    id: string;
    userId: number;
    name: string;
    targetAmount: number;
    currentSaved: number;
    monthlyAllocation: number;
    projectedCompletionDate: string | null;
};

export type SavingsGoalInput = {
    name: string;
    targetAmount: number;
    monthlyAllocation: number;
};
