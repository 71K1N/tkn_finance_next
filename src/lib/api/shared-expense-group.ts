import { http } from "./http";
import type { DataTableRequestParams, DataTableResponse } from "tikin-ds";
import type {
    AddGroupMemberInput,
    CreateExpenseGroupInput,
    CreateGroupExpenseInput,
    ExpenseGroup,
    ExpenseSettlement,
    GroupBalance,
    GroupExpense,
    RecordSettlementInput,
    SettlementSuggestion,
    UpdateExpenseGroupInput,
    UpdateGroupMemberInput,
} from "@/lib/types/shared-expense-group";

const BASE_PATH = "/expense-groups";

export const getExpenseGroups = (params: DataTableRequestParams) =>
    http.get<DataTableResponse<ExpenseGroup>>(BASE_PATH, { ...params });
export const getExpenseGroup = (id: string) => http.get<ExpenseGroup>(`${BASE_PATH}/${id}`);
export const createExpenseGroup = (input: CreateExpenseGroupInput) => http.post<ExpenseGroup>(BASE_PATH, input);
export const updateExpenseGroup = (id: string, input: UpdateExpenseGroupInput) =>
    http.patch<ExpenseGroup>(`${BASE_PATH}/${id}`, input);
export const archiveExpenseGroup = (id: string) => http.delete<void>(`${BASE_PATH}/${id}`);

export const addGroupMember = (groupId: string, input: AddGroupMemberInput) =>
    http.post<ExpenseGroup>(`${BASE_PATH}/${groupId}/members`, input);
export const updateGroupMember = (groupId: string, userId: number, input: UpdateGroupMemberInput) =>
    http.patch<ExpenseGroup>(`${BASE_PATH}/${groupId}/members/${userId}`, input);
export const removeGroupMember = (groupId: string, userId: number) =>
    http.delete<ExpenseGroup>(`${BASE_PATH}/${groupId}/members/${userId}`);

export const getGroupExpenses = (groupId: string, params: DataTableRequestParams) =>
    http.get<DataTableResponse<GroupExpense>>(`${BASE_PATH}/${groupId}/expenses`, { ...params });
export const createGroupExpense = (groupId: string, input: CreateGroupExpenseInput) =>
    http.post<GroupExpense>(`${BASE_PATH}/${groupId}/expenses`, input);
export const voidGroupExpense = (groupId: string, expenseId: string) =>
    http.delete<GroupExpense>(`${BASE_PATH}/${groupId}/expenses/${expenseId}`);

export const getGroupBalances = (groupId: string) => http.get<GroupBalance[]>(`${BASE_PATH}/${groupId}/balances`);
export const getSettlementSuggestions = (groupId: string) =>
    http.get<SettlementSuggestion[]>(`${BASE_PATH}/${groupId}/settlement-suggestions`);
export const recordSettlement = (groupId: string, input: RecordSettlementInput) =>
    http.post<ExpenseSettlement>(`${BASE_PATH}/${groupId}/settlements`, input);
export const getSettlements = (groupId: string, params: DataTableRequestParams) =>
    http.get<DataTableResponse<ExpenseSettlement>>(`${BASE_PATH}/${groupId}/settlements`, { ...params });
