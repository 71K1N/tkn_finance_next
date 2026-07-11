export type InsightSeverity = "info" | "warning" | "critical";
export type InsightSource = "llm" | "template";

export type InsightHighlight = {
    message: string;
    severity: InsightSeverity;
    categoryName?: string;
    amount?: number;
    percentageIncrease?: number;
};

export type InsightsResponse = {
    id: string;
    date: string;
    summary: string;
    highlights: InsightHighlight[];
    source: InsightSource;
    modelUsed: string | null;
};
