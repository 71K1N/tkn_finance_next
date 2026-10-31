import { http } from "./http";
import type { InsightsResponse } from "@/lib/types/insights";

const BASE_PATH = "/insights";

export const getInsights = () => http.get<InsightsResponse>(BASE_PATH);
export const refreshInsights = () => http.post<InsightsResponse>(`${BASE_PATH}/refresh`, {});
