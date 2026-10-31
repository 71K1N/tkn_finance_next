"use client"
import { Card, SimpleGrid, Text } from "@chakra-ui/react";
import type { TransactionSummary } from "@/lib/types/transaction";
import { useFormatCurrency } from "@/lib/hooks/useFormatCurrency";

export default function TransactionSummaryCards({
    summary,
    plannedVsUnplanned
}: {
    summary: TransactionSummary | null;
    plannedVsUnplanned?: { month: string; planned: { total: number; count: number }; unplanned: { total: number; count: number } } | null;
}) {
    const formatCurrency = useFormatCurrency();
    if (!summary) return null;

    const plannedPercentage = plannedVsUnplanned && (plannedVsUnplanned.planned.total + plannedVsUnplanned.unplanned.total > 0)
        ? Math.round((plannedVsUnplanned.planned.total / (plannedVsUnplanned.planned.total + plannedVsUnplanned.unplanned.total)) * 100)
        : null;

    return (
        <SimpleGrid columns={{ base: 1, md: plannedVsUnplanned ? 4 : 3 }} gap={4} mb={6}>
            <Card.Root>
                <Card.Body>
                    <Text color="fg.muted">Receitas no período</Text>
                    <Text fontSize="2xl" color="green.solid">{formatCurrency(summary.totalIncome)}</Text>
                    <Text fontSize="xs" color="fg.subtle">Por vencimento, pagas ou pendentes</Text>
                </Card.Body>
            </Card.Root>
            <Card.Root>
                <Card.Body>
                    <Text color="fg.muted">Despesas no período</Text>
                    <Text fontSize="2xl" color="red.solid">{formatCurrency(summary.totalExpenses)}</Text>
                    <Text fontSize="xs" color="fg.subtle">Por vencimento, pagas ou pendentes</Text>
                </Card.Body>
            </Card.Root>
            <Card.Root>
                <Card.Body>
                    <Text color="fg.muted">Saldo no período</Text>
                    <Text fontSize="2xl" color={summary.balance >= 0 ? "green.solid" : "red.solid"}>
                        {formatCurrency(summary.balance)}
                    </Text>
                    <Text fontSize="xs" color="fg.subtle">Por vencimento, pagas ou pendentes</Text>
                </Card.Body>
            </Card.Root>
            {plannedVsUnplanned && (
                <Card.Root>
                    <Card.Body>
                        <Text color="fg.muted">Intenção das despesas</Text>
                        {plannedPercentage !== null ? (
                            <>
                                <Text fontSize="2xl" color="blue.solid">{plannedPercentage}% 📅</Text>
                                <Text fontSize="xs" color="fg.subtle">Planejado vs {100 - plannedPercentage}% ⚡ Impulsivo</Text>
                            </>
                        ) : (
                            <Text fontSize="xs" color="fg.subtle">Sem dados</Text>
                        )}
                    </Card.Body>
                </Card.Root>
            )}
        </SimpleGrid>
    );
}
