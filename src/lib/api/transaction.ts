import { http } from "./http";
import type { Transaction, TransactionInput, PaymentInput, TransactionSummary } from "@/lib/types/transaction";
import type { DataTableRequestParams, DataTableResponse } from "tikin-ds";

const BASE_PATH = "/transaction";

export const getTransactions = (params: DataTableRequestParams) =>
    http.get<DataTableResponse<Transaction>>(BASE_PATH, { ...params });
export const createTransaction = (input: TransactionInput) => http.post<Transaction>(BASE_PATH, input);
export const updateTransaction = (id: string, input: TransactionInput) => http.patch<Transaction>(`${BASE_PATH}/${id}`, input);
export const removeTransaction = (id: string) => http.delete<void>(`${BASE_PATH}/${id}`);
export const payTransaction = (id: string, input: PaymentInput) => http.post<Transaction>(`${BASE_PATH}/${id}/payment`, input);
export const getTransactionSummary = () => http.get<TransactionSummary>(`${BASE_PATH}/summary`);
