"use client"
import { useEffect, useState } from "react";
import { CreditCard, TrendingUp, Save, ArrowDownCircle } from 'react-feather';
import DashboardSummaryCard from "../components/dashboard/DashboardSummaryCard";
import DashboardTrendChart, { TrendMonth } from "../components/dashboard/DashboardTrendChart";
import UpcomingTransactionsCard, { UpcomingTransaction } from "../components/dashboard/UpcomingTransactionsCard";
import AddTransactionAction from "../components/dashboard/AddTransactionAction";

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

const API_URL = "http://localhost:8081";
const AUTH_HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 1',
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
        <main className="container-fluid py-4">
            <div className="row mb-4 align-items-center">
                <div className="col">
                    <h2 className="mb-0">Dashboard Financeiro</h2>
                    <p className="text-muted mb-0">Visão rápida da sua situação financeira</p>
                </div>
                <div className="col-auto">
                    <AddTransactionAction />
                </div>
            </div>

            {loading && (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Carregando...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger d-flex justify-content-between align-items-center">
                    <span>{error}</span>
                    <button className="btn btn-sm btn-outline-danger" onClick={loadDashboard}>Tentar novamente</button>
                </div>
            )}

            {!loading && !error && metrics && (
                <>
                    {/* Summary Cards */}
                    <div className="row g-4 mb-4">
                        <div className="col-md-6 col-lg-3">
                            <DashboardSummaryCard
                                title="Saldo Devedor"
                                value={formatCurrency(metrics.debtBalance)}
                                icon={<CreditCard size={24} />}
                                colorClass="danger"
                                subtitle="Despesas não pagas"
                            />
                        </div>
                        <div className="col-md-6 col-lg-3">
                            <DashboardSummaryCard
                                title="Saldo a Receber"
                                value={formatCurrency(metrics.receivableBalance)}
                                icon={<ArrowDownCircle size={24} />}
                                colorClass="warning"
                                subtitle="Receitas pendentes"
                            />
                        </div>
                        <div className="col-md-6 col-lg-3">
                            <DashboardSummaryCard
                                title="Total Economizado"
                                value={formatCurrency(metrics.totalSaved)}
                                icon={<Save size={24} />}
                                colorClass={metrics.totalSaved >= 0 ? "success" : "danger"}
                                subtitle="Saldo líquido das transações pagas"
                            />
                        </div>
                        <div className="col-md-6 col-lg-3">
                            <DashboardSummaryCard
                                title="Próx. Vencimentos"
                                value={`${metrics.upcoming.length} transaç${metrics.upcoming.length === 1 ? 'ão' : 'ões'}`}
                                icon={<TrendingUp size={24} />}
                                colorClass="info"
                                subtitle="Com vencimento a partir de hoje"
                            />
                        </div>
                    </div>

                    {/* Trend Chart + Upcoming */}
                    <div className="row g-4">
                        <div className="col-lg-7">
                            <DashboardTrendChart
                                data={metrics.trend}
                                formatCurrency={formatCurrency}
                                rangeLabel={metrics.rangeLabel}
                            />
                        </div>
                        <div className="col-lg-5">
                            <UpcomingTransactionsCard
                                transactions={metrics.upcoming}
                                formatCurrency={formatCurrency}
                                formatDate={formatDate}
                            />
                        </div>
                    </div>
                </>
            )}

            {!loading && !error && metrics && metrics.debtBalance === 0 && metrics.receivableBalance === 0 &&
                metrics.totalSaved === 0 && metrics.upcoming.length === 0 && (
                <div className="alert alert-info mt-4">
                    Nenhuma transação encontrada. Adicione sua primeira transação para ver o resumo financeiro.
                </div>
            )}
        </main>
    );
}
