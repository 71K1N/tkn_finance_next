import { http } from "./http";
import type {
    Transaction,
    TransactionInput,
    PaymentInput,
    TransactionSummary,
    CategoryBreakdown,
    MonthlyTrendEntry,
    BalanceEvolutionEntry,
} from "@/lib/types/transaction";
import type { DataTableRequestParams, DataTableResponse } from "tikin-ds";

const BASE_PATH = "/transaction";

export const getTransactions = (params: DataTableRequestParams) =>
    http.get<DataTableResponse<Transaction>>(BASE_PATH, { ...params });
export const createTransaction = (input: TransactionInput) => http.post<Transaction>(BASE_PATH, input);
export const updateTransaction = (id: string, input: TransactionInput) => http.patch<Transaction>(`${BASE_PATH}/${id}`, input);
export const removeTransaction = (id: string) => http.delete<void>(`${BASE_PATH}/${id}`);
export const payTransaction = (id: string, input: PaymentInput) => http.post<Transaction>(`${BASE_PATH}/${id}/payment`, input);
export const getTransactionSummary = (month?: string) => http.get<TransactionSummary>(`${BASE_PATH}/summary`, month ? { month } : undefined);
export const getCategoryBreakdown = (month?: string) => http.get<CategoryBreakdown>(`${BASE_PATH}/category-breakdown`, month ? { month } : undefined);
export const getMonthlyTrend = (months?: number) => http.get<MonthlyTrendEntry[]>(`${BASE_PATH}/monthly-trend`, months ? { months } : undefined);
export const getBalanceEvolution = (months?: number) => http.get<BalanceEvolutionEntry[]>(`${BASE_PATH}/balance-evolution`, months ? { months } : undefined);
