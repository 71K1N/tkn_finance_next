import { http } from "./http";
import type { WishItem, WishItemInput, WishItemStatus } from "@/lib/types/wish-item";
import type { DataTableRequestParams, DataTableResponse } from "tikin-ds";

const BASE_PATH = "/wish-item";

export const getWishItems = (params: DataTableRequestParams) =>
    http.get<DataTableResponse<WishItem>>(BASE_PATH, { ...params });
export const createWishItem = (input: WishItemInput) => http.post<WishItem>(BASE_PATH, input);
export const updateWishItem = (id: string, input: Partial<WishItemInput>) => http.patch<WishItem>(`${BASE_PATH}/${id}`, input);
export const updateWishItemStatus = (id: string, status: WishItemStatus) => http.patch<WishItem>(`${BASE_PATH}/${id}/status`, { status });
export const removeWishItem = (id: string) => http.delete<void>(`${BASE_PATH}/${id}`);
