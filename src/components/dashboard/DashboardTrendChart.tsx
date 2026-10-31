"use client"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Badge, Box, Card, Flex, Heading, Text } from "@chakra-ui/react";
import { useHideValues } from "@/contexts/HideValuesContext";

export interface TrendMonth {
    month: string;
    income: number;
    expenses: number;
}

interface DashboardTrendChartProps {
    data: TrendMonth[];
    formatCurrency: (value: number) => string;
    rangeLabel?: string;
}

export default function DashboardTrendChart({ data, formatCurrency, rangeLabel }: DashboardTrendChartProps) {
    const { hidden } = useHideValues();
    return (
        <Card.Root h="full">
            <Card.Body>
                <Flex justify="space-between" align="center" mb={4}>
                    <Heading size="md">Histórico dos Últimos 3 Meses</Heading>
                    {rangeLabel && <Badge>{rangeLabel}</Badge>}
                </Flex>
                {data.length === 0 ? (
                    <Flex align="center" justify="center" h="260px">
                        <Text color="fg.muted">Sem dados históricos disponíveis.</Text>
                    </Flex>
                ) : (
                    <Box w="full" h="260px">
                        <ResponsiveContainer>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(v) => hidden ? '••' : `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                <Legend />
                                <Bar dataKey="income" name="Entradas" fill="#00C49F" />
                                <Bar dataKey="expenses" name="Saídas" fill="#FF8042" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                )}
            </Card.Body>
        </Card.Root>
    );
}
