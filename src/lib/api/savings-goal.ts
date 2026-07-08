import { http } from "./http";
import type { SavingsGoal, SavingsGoalInput } from "@/lib/types/savings-goal";
import type { DataTableRequestParams, DataTableResponse } from "tikin-ds";

const BASE_PATH = "/savings-goal";

export const getSavingsGoals = (params: DataTableRequestParams) =>
    http.get<DataTableResponse<SavingsGoal>>(BASE_PATH, { ...params });
export const createSavingsGoal = (input: SavingsGoalInput) => http.post<SavingsGoal>(BASE_PATH, input);
export const updateSavingsGoal = (id: string, input: Partial<SavingsGoalInput>) => http.patch<SavingsGoal>(`${BASE_PATH}/${id}`, input);
export const removeSavingsGoal = (id: string) => http.delete<void>(`${BASE_PATH}/${id}`);
export const depositSavingsGoal = (id: string, amount: number) => http.post<SavingsGoal>(`${BASE_PATH}/${id}/deposit`, { amount });
export const withdrawSavingsGoal = (id: string, amount: number) => http.post<SavingsGoal>(`${BASE_PATH}/${id}/withdraw`, { amount });
