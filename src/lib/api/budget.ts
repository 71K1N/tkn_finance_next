import { http } from "./http";
import type { Budget, BudgetInput } from "@/lib/types/budget";
import type { DataTableRequestParams, DataTableResponse } from "tikin-ds";

const BASE_PATH = "/budget";

export const getBudgets = (params: DataTableRequestParams) =>
    http.get<DataTableResponse<Budget>>(BASE_PATH, { ...params });
export const createBudget = (input: BudgetInput) => http.post<Budget>(BASE_PATH, input);
export const updateBudget = (id: string, input: Partial<BudgetInput>) => http.patch<Budget>(`${BASE_PATH}/${id}`, input);
export const removeBudget = (id: string) => http.delete<void>(`${BASE_PATH}/${id}`);
