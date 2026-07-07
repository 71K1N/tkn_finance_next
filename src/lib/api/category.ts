import { http } from "./http";
import type { Category, CategoryInput } from "@/lib/types/category";
import type { DataTableRequestParams, DataTableResponse } from "tikin-ds";

const BASE_PATH = "/category";

export const getCategories = (params: DataTableRequestParams) =>
    http.get<DataTableResponse<Category>>(BASE_PATH, { ...params });
export const createCategory = (input: CategoryInput) => http.post<Category>(BASE_PATH, input);
export const updateCategory = (id: string, input: CategoryInput) => http.patch<Category>(`${BASE_PATH}/${id}`, input);
export const removeCategory = (id: string) => http.delete<void>(`${BASE_PATH}/${id}`);
