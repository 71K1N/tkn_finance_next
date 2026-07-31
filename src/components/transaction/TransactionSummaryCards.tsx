"use client"
import { Card, SimpleGrid, Text } from "@chakra-ui/react";
import type { TransactionSummary } from "@/lib/types/transaction";
import { useFormatCurrency } from "@/lib/hooks/useFormatCurrency";

export default function TransactionSummaryCards({ summary }: { summary: TransactionSummary | null }) {
    const formatCurrency = useFormatCurrency();
    if (!summary) return null;

    return (
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={6}>
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
        </SimpleGrid>
    );
}
