"use client"
import { useEffect, useState } from "react";
import { RefreshCw, AlertTriangle } from "react-feather";
import { Box, Card, Flex, Heading, IconButton, Skeleton, Stack, Text } from "@chakra-ui/react";
import StatusBadge from "@/components/StatusBadge";
import { getInsights, refreshInsights } from "@/lib/api/insights";
import type { InsightsResponse, InsightSeverity } from "@/lib/types/insights";

const SEVERITY_STATUS: Record<InsightSeverity, "danger" | "warning" | "info"> = {
    critical: "danger",
    warning: "warning",
    info: "info",
};

export default function AiInsightsCard() {
    const [insights, setInsights] = useState<InsightsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);

    async function load() {
        setLoading(true);
        setError(false);
        try {
            setInsights(await getInsights());
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    async function handleRefresh() {
        setRefreshing(true);
        setError(false);
        try {
            setInsights(await refreshInsights());
        } catch {
            setError(true);
        } finally {
            setRefreshing(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <Card.Root mb={6}>
            <Card.Body>
                <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Insights da IA</Heading>
                    <IconButton
                        aria-label="Atualizar insights"
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        loading={refreshing}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                    </IconButton>
                </Flex>

                {loading && (
                    <Stack gap={2}>
                        <Skeleton height="20px" />
                        <Skeleton height="20px" width="80%" />
                    </Stack>
                )}

                {!loading && error && (
                    <Flex align="center" gap={2} color="status.danger">
                        <AlertTriangle size={16} />
                        <Text fontSize="sm">Não foi possível carregar os insights.</Text>
                    </Flex>
                )}

                {!loading && !error && insights && (
                    <Stack gap={3}>
                        <Text>{insights.summary}</Text>
                        {insights.highlights.length > 0 && (
                            <Stack gap={2}>
                                {insights.highlights.map((highlight, index) => (
                                    <Flex key={index} align="center" gap={2}>
                                        <StatusBadge status={SEVERITY_STATUS[highlight.severity]}>
                                            {highlight.severity === "critical" ? "Crítico" : highlight.severity === "warning" ? "Atenção" : "Info"}
                                        </StatusBadge>
                                        <Text fontSize="sm">{highlight.message}</Text>
                                    </Flex>
                                ))}
                            </Stack>
                        )}
                        <Box>
                            <Text fontSize="xs" color="fg.muted">
                                {insights.source === "template" ? "Gerado automaticamente" : "Gerado por IA"} · {insights.date}
                            </Text>
                        </Box>
                    </Stack>
                )}
            </Card.Body>
        </Card.Root>
    );
}
