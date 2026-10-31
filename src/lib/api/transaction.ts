import { http } from "./http";
import type {
    Transaction,
    TransactionInput,
    PaymentInput,
    TransactionFilters,
    TransactionSummary,
    CategoryBreakdown,
    MonthlyTrendEntry,
    BalanceEvolutionEntry,
    DailySummaryEntry,
    TransactionDraft,
} from "@/lib/types/transaction";
import type { DataTableRequestParams, DataTableResponse } from "tikin-uai";

const BASE_PATH = "/transaction";

export const getTransactions = (params: DataTableRequestParams & Partial<TransactionFilters>) =>
    http.get<DataTableResponse<Transaction>>(BASE_PATH, { ...params });
export const createTransaction = (input: TransactionInput) => http.post<Transaction>(BASE_PATH, input);
export const updateTransaction = (id: string, input: Partial<TransactionInput>) => http.patch<Transaction>(`${BASE_PATH}/${id}`, input);
export const parseTransactionText = (text: string) => http.post<TransactionDraft>(`${BASE_PATH}/parse`, { text });
export const removeTransaction = (id: string) => http.delete<void>(`${BASE_PATH}/${id}`);
export const payTransaction = (id: string, input: PaymentInput) => http.post<Transaction>(`${BASE_PATH}/${id}/payment`, input);

const SUGGESTION_PAGE_SIZE = 50;
const normalizeName = (name: string) => name.trim().toLowerCase();

/**
 * Past transactions to suggest while typing a name: the most recent occurrence of each
 * distinct name containing `query`. The API's `search` also matches `description`, so rows
 * are filtered by name here. Failures and aborted lookups yield no suggestions.
 */
export async function searchTransactionSuggestions(query: string, signal?: AbortSignal): Promise<Transaction[]> {
    const needle = normalizeName(query);
    if (!needle) return [];

    try {
        const response = await getTransactions({
            page: 1,
            pageSize: SUGGESTION_PAGE_SIZE,
            search: query.trim(),
            sort: { key: "created_at", direction: "desc" },
        });
        if (signal?.aborted) return [];

        const seen = new Set<string>();
        return response.data.filter((transaction) => {
            const key = normalizeName(transaction.name);
            if (!key.includes(needle) || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    } catch {
        return [];
    }
}

export const getTransactionSummary =(params?: Partial<TransactionFilters> & { month?: string, status?: string }) =>
    http.get<TransactionSummary>(`${BASE_PATH}/summary`, params);
export const getCategoryBreakdown = (month?: string) => http.get<CategoryBreakdown>(`${BASE_PATH}/category-breakdown`, month ? { month } : undefined);
export const getMonthlyTrend = (months?: number) => http.get<MonthlyTrendEntry[]>(`${BASE_PATH}/monthly-trend`, months ? { months } : undefined);
export const getBalanceEvolution = (months?: number) => http.get<BalanceEvolutionEntry[]>(`${BASE_PATH}/balance-evolution`, months ? { months } : undefined);
export const getDailySummary = (from: string, to: string) => http.get<DailySummaryEntry[]>(`${BASE_PATH}/daily-summary`, { from, to });
export const getPlannedVsUnplanned = (month?: string) => http.get<{ month: string; planned: { total: number; count: number }; unplanned: { total: number; count: number } }>(`${BASE_PATH}/analysis/planned-vs-unplanned`, month ? { month } : undefined);
