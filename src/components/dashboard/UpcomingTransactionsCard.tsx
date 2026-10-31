import { Calendar } from 'react-feather';
import { Card, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import StatusBadge from "@/components/StatusBadge";

export interface UpcomingTransaction {
    id?: number;
    name: string;
    amount: number;
    due_date: string;
    type: 'EXPENSE' | 'INCOME';
}

interface UpcomingTransactionsCardProps {
    transactions: UpcomingTransaction[];
    formatCurrency: (value: number) => string;
    formatDate: (date: string) => string;
}

export default function UpcomingTransactionsCard({ transactions, formatCurrency, formatDate }: UpcomingTransactionsCardProps) {
    return (
        <Card.Root h="full">
            <Card.Body>
                <Heading size="md" mb={4}>Próximas Transações a Vencer</Heading>
                {transactions.length === 0 ? (
                    <Text color="fg.muted">Nenhuma transação pendente com vencimento próximo.</Text>
                ) : (
                    <Stack gap={0} divideY="1px">
                        {transactions.map((t) => (
                            <Flex key={t.id} justify="space-between" align="center" py={2}>
                                <Stack gap={0}>
                                    <Text fontWeight="semibold">{t.name}</Text>
                                    <Flex align="center" gap={1} color="fg.muted" fontSize="sm">
                                        <Calendar size={12} />
                                        <Text>{formatDate(t.due_date)}</Text>
                                    </Flex>
                                </Stack>
                                <Stack gap={1} align="flex-end">
                                    <Text fontWeight="bold" color={t.type === 'EXPENSE' ? 'status.danger' : 'status.success'}>
                                        {t.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(t.amount)}
                                    </Text>
                                    <StatusBadge status={t.type === 'EXPENSE' ? 'danger' : 'success'}>
                                        {t.type === 'EXPENSE' ? 'Despesa' : 'Receita'}
                                    </StatusBadge>
                                </Stack>
                            </Flex>
                        ))}
                    </Stack>
                )}
            </Card.Body>
        </Card.Root>
    );
}
