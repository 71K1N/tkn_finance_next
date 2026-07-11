"use client"
import { useEffect, useState } from "react";
import { CreditCard, TrendingUp, Save, ArrowDownCircle } from 'react-feather';
import { Box, Button, Container, Flex, Heading, SimpleGrid, Spinner, Text } from "@chakra-ui/react";
import DashboardSummaryCard from "@/components/dashboard/DashboardSummaryCard";
import DashboardTrendChart, { TrendMonth } from "@/components/dashboard/DashboardTrendChart";
import UpcomingTransactionsCard, { UpcomingTransaction } from "@/components/dashboard/UpcomingTransactionsCard";
import AddTransactionAction from "@/components/dashboard/AddTransactionAction";

interface Transaction {
    id?: number;
    name: string;
    amount: number;
    due_date: string;
    payment_date: string | null;
    paid_amount: number;
    type: 'EXPENSE' | 'INCOME';
}

interface DashboardMetrics {
    debtBalance: number;
    receivableBalance: number;
    totalSaved: number;
    upcoming: UpcomingTransaction[];
    trend: TrendMonth[];
    rangeLabel: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";
const AUTH_HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN ?? "1"}`,
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
}

function getLastThreeMonths(): { year: number; month: number; label: string }[] {
    const now = new Date();
    return [2, 1, 0].map((offset) => {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        return {
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            label: d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' }),
        };
    });
}

function computeMetrics(transactions: Transaction[]): DashboardMetrics {
    const today = new Date().toISOString().split('T')[0];

    const debtBalance = transactions
        .filter(t => t.type === 'EXPENSE' && !t.payment_date)
        .reduce((sum, t) => sum + t.amount, 0);

    const receivableBalance = transactions
        .filter(t => t.type === 'INCOME' && !t.payment_date)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalSaved = transactions
        .filter(t => t.payment_date)
        .reduce((sum, t) => sum + (t.type === 'INCOME' ? t.paid_amount : -t.paid_amount), 0);

    const upcoming: UpcomingTransaction[] = transactions
        .filter(t => !t.payment_date && t.due_date >= today)
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .slice(0, 5)
        .map(t => ({ id: t.id, name: t.name, amount: t.amount, due_date: t.due_date, type: t.type }));

    const months = getLastThreeMonths();
    const trend: TrendMonth[] = months.map(({ year, month, label }) => {
        const inMonth = transactions.filter(t => {
            const [y, m] = t.due_date.split('-').map(Number);
            return y === year && m === month;
        });
        return {
            month: label,
            income: inMonth.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
            expenses: inMonth.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
        };
    });

    const hasData = trend.some(m => m.income > 0 || m.expenses > 0);
    const rangeLabel = hasData
        ? `${months[0].label} – ${months[2].label}`
        : '';

    return { debtBalance, receivableBalance, totalSaved, upcoming, trend: hasData ? trend : [], rangeLabel };
}

export default function FinancialDashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function loadDashboard() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/transaction`, { headers: AUTH_HEADERS });
            if (!response.ok) throw new Error(`Erro ao carregar transações: ${response.status}`);
            const data = await response.json();
            const transactions: Transaction[] = Array.isArray(data) ? data : [];
            setMetrics(computeMetrics(transactions));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadDashboard(); }, []);

    return (
        <Container maxW="6xl" py={8}>
            <Flex justify="space-between" align="center" mb={6}>
                <Box>
                    <Heading size="5xl">Dashboard Financeiro</Heading>
                    <Text color="fg.muted">Visão rápida da sua situação financeira</Text>
                </Box>
                <AddTransactionAction />
            </Flex>

            {loading && (
                <Flex justify="center" py={10}>
                    <Spinner size="lg" color="brand.primary" />
                </Flex>
            )}

            {error && (
                <Flex justify="space-between" align="center" bg="status.danger.subtle" color="status.danger" p={4} borderRadius="md" mb={4}>
                    <Text>{error}</Text>
                    <Button size="sm" variant="outline" colorPalette="red" onClick={loadDashboard}>Tentar novamente</Button>
                </Flex>
            )}

            {!loading && !error && metrics && (
                <>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4} mb={6}>
                        <DashboardSummaryCard
                            title="Saldo Devedor"
                            value={formatCurrency(metrics.debtBalance)}
                            icon={<CreditCard size={24} />}
                            colorClass="danger"
                            subtitle="Despesas não pagas"
                        />
                        <DashboardSummaryCard
                            title="Saldo a Receber"
                            value={formatCurrency(metrics.receivableBalance)}
                            icon={<ArrowDownCircle size={24} />}
                            colorClass="warning"
                            subtitle="Receitas pendentes"
                        />
                        <DashboardSummaryCard
                            title="Total Economizado"
                            value={formatCurrency(metrics.totalSaved)}
                            icon={<Save size={24} />}
                            colorClass={metrics.totalSaved >= 0 ? "success" : "danger"}
                            subtitle="Saldo líquido das transações pagas"
                        />
                        <DashboardSummaryCard
                            title="Próx. Vencimentos"
                            value={`${metrics.upcoming.length} transaç${metrics.upcoming.length === 1 ? 'ão' : 'ões'}`}
                            icon={<TrendingUp size={24} />}
                            colorClass="info"
                            subtitle="Com vencimento a partir de hoje"
                        />
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, lg: 12 }} gap={4}>
                        <Box gridColumn={{ lg: "span 7" }}>
                            <DashboardTrendChart
                                data={metrics.trend}
                                formatCurrency={formatCurrency}
                                rangeLabel={metrics.rangeLabel}
                            />
                        </Box>
                        <Box gridColumn={{ lg: "span 5" }}>
                            <UpcomingTransactionsCard
                                transactions={metrics.upcoming}
                                formatCurrency={formatCurrency}
                                formatDate={formatDate}
                            />
                        </Box>
                    </SimpleGrid>
                </>
            )}

            {!loading && !error && metrics && metrics.debtBalance === 0 && metrics.receivableBalance === 0 &&
                metrics.totalSaved === 0 && metrics.upcoming.length === 0 && (
                <Box bg="status.info.subtle" color="status.info" p={4} borderRadius="md" mt={4}>
                    Nenhuma transação encontrada. Adicione sua primeira transação para ver o resumo financeiro.
                </Box>
            )}
        </Container>
    );
}
