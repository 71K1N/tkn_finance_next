"use client"
import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Save, Percent, ArrowUp, ArrowDown, Target } from 'react-feather';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, RadialBarChart, RadialBar
} from 'recharts';
import { Box, Card, Container, Flex, Heading, Progress, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import StatusBadge from "@/components/StatusBadge";
import { getTotalBalance } from "@/lib/api/bank-account";
import { getTransactionSummary, getCategoryBreakdown, getMonthlyTrend, getBalanceEvolution } from "@/lib/api/transaction";
import { getSavingsGoals } from "@/lib/api/savings-goal";
import type { CategoryBreakdown, MonthlyTrendEntry, BalanceEvolutionEntry, TransactionSummary } from "@/lib/types/transaction";
import type { SavingsGoal } from "@/lib/types/savings-goal";
import AiInsightsCard from "@/components/dashboard/AiInsightsCard";
import { useFormatCurrency } from "@/lib/hooks/useFormatCurrency";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B'];
const SAVINGS_RATE_TARGET = 20;

function currentMonthString() {
    return new Date().toISOString().slice(0, 7);
}

function calculateProgress(current: number, target: number) {
    if (target <= 0) return 0;
    return Math.min((current / target) * 100, 100);
}

export default function Home() {
    const formatCurrency = useFormatCurrency();
    const [totalBalance, setTotalBalance] = useState(0);
    const [summary, setSummary] = useState<TransactionSummary>({ totalIncome: 0, totalExpenses: 0, balance: 0 });
    const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown>({ month: currentMonthString(), categories: [] });
    const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrendEntry[]>([]);
    const [balanceEvolution, setBalanceEvolution] = useState<BalanceEvolutionEntry[]>([]);

    useEffect(() => {
        const month = currentMonthString();

        Promise.allSettled([
            getTotalBalance(),
            getTransactionSummary(month),
            getSavingsGoals({ page: 1, pageSize: 100 }),
            getCategoryBreakdown(month),
            getMonthlyTrend(6),
            getBalanceEvolution(6),
        ]).then(([totalBalanceResult, summaryResult, goalsResult, categoryResult, trendResult, evolutionResult]) => {
            if (totalBalanceResult.status === "fulfilled") setTotalBalance(totalBalanceResult.value.totalBalance);
            if (summaryResult.status === "fulfilled") setSummary(summaryResult.value);
            if (goalsResult.status === "fulfilled") setSavingsGoals(goalsResult.value.data);
            if (categoryResult.status === "fulfilled") setCategoryBreakdown(categoryResult.value);
            if (trendResult.status === "fulfilled") setMonthlyTrend(trendResult.value);
            if (evolutionResult.status === "fulfilled") setBalanceEvolution(evolutionResult.value);
        });
    }, []);

    const monthlySavings = summary.totalIncome - summary.totalExpenses;
    const savingsRate = summary.totalIncome > 0 ? (monthlySavings / summary.totalIncome) * 100 : 0;

    return (
        <Container maxW="6xl" py={8}>
            <Box mb={6}>
                <Heading size="5xl">Dashboard Financeiro</Heading>
                <Text color="fg.muted">Visão geral da sua situação financeira</Text>
            </Box>

            <AiInsightsCard />

            {/* Cards Principais */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4} mb={6}>
                <Card.Root h="full">
                    <Card.Body>
                        <Flex align="center" gap={3} mb={3}>
                            <Box bg="brand.primary.subtle" color="brand.primary" p={3} borderRadius="md">
                                <DollarSign size={24} />
                            </Box>
                            <Box>
                                <Text fontSize="sm" fontWeight="semibold" color="fg.muted">Saldo Total</Text>
                                <Heading size="lg" mt={1}>{formatCurrency(totalBalance)}</Heading>
                            </Box>
                        </Flex>
                        <Text fontSize="sm" color="fg.muted">Saldo em todas as contas</Text>
                    </Card.Body>
                </Card.Root>

                <Card.Root h="full">
                    <Card.Body>
                        <Flex align="center" gap={3} mb={3}>
                            <Box bg="status.success.subtle" color="status.success" p={3} borderRadius="md">
                                <TrendingUp size={24} />
                            </Box>
                            <Box>
                                <Text fontSize="sm" fontWeight="semibold" color="fg.muted">Fluxo Mensal</Text>
                                <Stack gap={0} mt={1}>
                                    <Flex align="center" gap={1} color="status.success" fontSize="sm">
                                        <ArrowUp size={14} />
                                        <Text>{formatCurrency(summary.totalIncome)}</Text>
                                    </Flex>
                                    <Flex align="center" gap={1} color="status.danger" fontSize="sm">
                                        <ArrowDown size={14} />
                                        <Text>{formatCurrency(summary.totalExpenses)}</Text>
                                    </Flex>
                                </Stack>
                            </Box>
                        </Flex>
                        <Text fontSize="sm" color="fg.muted">Receitas e despesas do mês</Text>
                    </Card.Body>
                </Card.Root>

                <Card.Root h="full">
                    <Card.Body>
                        <Flex align="center" gap={3} mb={3}>
                            <Box bg="status.info.subtle" color="status.info" p={3} borderRadius="md">
                                <Save size={24} />
                            </Box>
                            <Box>
                                <Text fontSize="sm" fontWeight="semibold" color="fg.muted">Economia Mensal</Text>
                                <Heading size="lg" mt={1}>{formatCurrency(monthlySavings)}</Heading>
                                <Text fontSize="sm" color="status.success">{savingsRate.toFixed(1)}% da receita</Text>
                            </Box>
                        </Flex>
                        <Text fontSize="sm" color="fg.muted">Economia do mês atual</Text>
                    </Card.Body>
                </Card.Root>

                <Card.Root h="full">
                    <Card.Body>
                        <Flex align="center" gap={3} mb={3}>
                            <Box bg="status.info.subtle" color="status.info" p={3} borderRadius="md">
                                <Percent size={24} />
                            </Box>
                            <Box>
                                <Text fontSize="sm" fontWeight="semibold" color="fg.muted">Taxa de Poupança</Text>
                                <Heading size="lg" mt={1}>{savingsRate.toFixed(1)}%</Heading>
                            </Box>
                        </Flex>
                        <Text fontSize="sm" color="fg.muted">Da receita mensal</Text>
                    </Card.Body>
                </Card.Root>
            </SimpleGrid>

            {/* Objetivos Financeiros */}
            <Card.Root mb={6}>
                <Card.Body>
                    <Heading size="md" mb={4}>Objetivos Financeiros</Heading>
                    {savingsGoals.length === 0 ? (
                        <Text color="fg.muted">Nenhuma meta de poupança cadastrada.</Text>
                    ) : (
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                            {savingsGoals.map((goal) => {
                                const progress = calculateProgress(goal.currentSaved, goal.targetAmount);
                                return (
                                    <Card.Root key={goal.id} bg="bg.subtle" h="full">
                                        <Card.Body>
                                            <Flex align="center" gap={3} mb={3}>
                                                <Box bg="brand.primary.subtle" color="brand.primary" p={3} borderRadius="md">
                                                    <Target size={24} />
                                                </Box>
                                                <Box>
                                                    <Text fontWeight="semibold">{goal.name}</Text>
                                                    <Text fontSize="sm" color="fg.muted">
                                                        {formatCurrency(goal.currentSaved)} / {formatCurrency(goal.targetAmount)}
                                                    </Text>
                                                </Box>
                                            </Flex>
                                            <Progress.Root value={progress} size="xs" colorPalette="purple">
                                                <Progress.Track>
                                                    <Progress.Range />
                                                </Progress.Track>
                                            </Progress.Root>
                                            <Flex justify="flex-end" mt={2}>
                                                <StatusBadge status="primary">{progress.toFixed(1)}%</StatusBadge>
                                            </Flex>
                                        </Card.Body>
                                    </Card.Root>
                                )
                            })}
                        </SimpleGrid>
                    )}
                </Card.Body>
            </Card.Root>

            {/* Gráficos */}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={6}>
                <Card.Root h="full">
                    <Card.Body>
                        <Heading size="md" mb={4}>Distribuição de Despesas</Heading>
                        <Box w="full" h="300px">
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={categoryBreakdown.categories}
                                        dataKey="total"
                                        nameKey="categoryName"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                    >
                                        {categoryBreakdown.categories.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card.Body>
                </Card.Root>

                <Card.Root h="full">
                    <Card.Body>
                        <Heading size="md" mb={4}>Receita vs. Despesas Mensais</Heading>
                        <Box w="full" h="300px">
                            <ResponsiveContainer>
                                <BarChart data={monthlyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Legend />
                                    <Bar dataKey="income" name="Receitas" fill="#00C49F" />
                                    <Bar dataKey="expenses" name="Despesas" fill="#FF8042" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card.Body>
                </Card.Root>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mb={6}>
                <Card.Root h="full">
                    <Card.Body>
                        <Heading size="md" mb={4}>Evolução do Saldo Total</Heading>
                        <Box w="full" h="300px">
                            <ResponsiveContainer>
                                <LineChart data={balanceEvolution}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    <Legend />
                                    <Line type="monotone" dataKey="balance" name="Saldo" stroke="#8884d8" />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card.Body>
                </Card.Root>

                <Card.Root h="full">
                    <Card.Body>
                        <Heading size="md" mb={4}>Taxa de Poupança</Heading>
                        <Box w="full" h="300px">
                            <ResponsiveContainer>
                                <RadialBarChart
                                    innerRadius="10%"
                                    outerRadius="80%"
                                    data={[
                                        {
                                            name: 'Taxa Atual',
                                            value: savingsRate,
                                            fill: savingsRate >= SAVINGS_RATE_TARGET ? '#00C49F' : '#FF8042'
                                        }
                                    ]}
                                    startAngle={180}
                                    endAngle={0}
                                >
                                    <RadialBar
                                        background
                                        dataKey="value"
                                    />
                                    <Legend />
                                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </Box>
                    </Card.Body>
                </Card.Root>
            </SimpleGrid>

            {/* Histograma de Gastos por Categoria */}
            <Card.Root>
                <Card.Body>
                    <Heading size="md" mb={4}>Gastos por Categoria</Heading>
                    <Box w="full" h="400px">
                        <ResponsiveContainer>
                            <BarChart data={categoryBreakdown.categories}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="categoryName" />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="transactionCount" name="Frequência" fill="#8884d8" />
                                <Bar yAxisId="right" dataKey="total" name="Valor Total" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Card.Body>
            </Card.Root>
        </Container>
    );
}
