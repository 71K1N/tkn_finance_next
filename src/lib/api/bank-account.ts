import { http } from "./http";
import type { BankAccount, BankAccountInput } from "@/lib/types/bank-account";
import type { DataTableRequestParams, DataTableResponse } from "tikin-ds";

const BASE_PATH = "/bank-account";

export const getBankAccounts = (params: DataTableRequestParams) =>
    http.get<DataTableResponse<BankAccount>>(BASE_PATH, { ...params });
export const createBankAccount = (input: BankAccountInput) => http.post<BankAccount>(BASE_PATH, input);
export const updateBankAccount = (id: string, input: BankAccountInput) => http.patch<BankAccount>(`${BASE_PATH}/${id}`, input);
export const removeBankAccount = (id: string) => http.delete<void>(`${BASE_PATH}/${id}`);
export const getTotalBalance = () => http.get<{ totalBalance: number }>(`${BASE_PATH}/total-balance`);
