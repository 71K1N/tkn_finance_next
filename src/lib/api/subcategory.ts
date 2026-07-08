import { http } from "./http";
import type { Subcategory, SubcategoryInput } from "@/lib/types/subcategory";
import type { DataTableRequestParams, DataTableResponse } from "tikin-ds";

const BASE_PATH = "/subcategory";

export const getSubcategories = (params: DataTableRequestParams) =>
    http.get<DataTableResponse<Subcategory>>(BASE_PATH, { ...params });
export const createSubcategory = (input: SubcategoryInput) => http.post<Subcategory>(BASE_PATH, input);
export const updateSubcategory = (id: string, input: SubcategoryInput) => http.patch<Subcategory>(`${BASE_PATH}/${id}`, input);
export const removeSubcategory = (id: string) => http.delete<void>(`${BASE_PATH}/${id}`);
