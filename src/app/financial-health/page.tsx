"use client"
import { useEffect, useState } from "react";
import { 
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    RadialBarChart, RadialBar
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, DollarSign, CreditCard, Save } from 'react-feather';
import "bootstrap/dist/css/bootstrap.min.css";

interface FinancialHealthData {
    totalIncome: number;
    totalSavings: number;
    totalDebt: number;
    totalExpenses: number;
}

interface ScoreBreakdown {
    savingsScore: number;
    debtScore: number;
    balanceScore: number;
    totalScore: number;
}

export default function FinancialHealth() {
    const [financialData, setFinancialData] = useState<FinancialHealthData>({
        totalIncome: 5000,
        totalSavings: 1000,
        totalDebt: 2000,
        totalExpenses: 4800
    });

    const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown>({
        savingsScore: 0,
        debtScore: 0,
        balanceScore: 0,
        totalScore: 0
    });

    // Cores para os gráficos
    const COLORS = ['#00C49F', '#FF8042', '#0088FE'];

    function formatCurrency(value: number) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    function calculateSavingsScore(savings: number, income: number): number {
        const savingsRate = (savings / income) * 100;
        if (savingsRate >= 20) return 100;
        if (savingsRate >= 10) return 75;
        return 50;
    }

    function calculateDebtScore(debt: number, income: number): number {
        const debtRate = (debt / income) * 100;
        if (debtRate < 20) return 100;
        if (debtRate < 40) return 75;
        return 50;
    }

    function calculateBalanceScore(income: number, expenses: number): number {
        const balance = income - expenses;
        if (balance > 0) return 100;
        if (balance === 0) return 75;
        return 50;
    }

    function calculateTotalScore(breakdown: ScoreBreakdown): number {
        return (
            breakdown.savingsScore * 0.4 +
            breakdown.debtScore * 0.3 +
            breakdown.balanceScore * 0.3
        );
    }

    function getHealthStatus(score: number): { status: string; message: string; color: string } {
        if (score >= 90) {
            return {
                status: "Excelente",
                message: "Parabéns! Sua saúde financeira está excelente. Continue assim e considere explorar investimentos para potencializar seu patrimônio.",
                color: "success"
            };
        } else if (score >= 75) {
            return {
                status: "Boa",
                message: "Ótimo trabalho! Sua saúde financeira está boa, mas há espaço para melhorar. Reduza um pouco suas dívidas para aumentar sua segurança financeira.",
                color: "info"
            };
        } else if (score >= 50) {
            return {
                status: "Moderada",
                message: "Atenção! Sua saúde financeira precisa de ajustes. Seu nível de endividamento está um pouco alto, o que reduz sua capacidade de poupança.",
                color: "warning"
            };
        } else if (score >= 30) {
            return {
                status: "Ruim",
                message: "Cuidado! Sua saúde financeira está comprometida. Revise suas despesas, priorize a redução de dívidas e tente economizar pelo menos 10% da sua renda mensal.",
                color: "danger"
            };
        } else {
            return {
                status: "Crítica",
                message: "Alerta Vermelho! Sua saúde financeira está em uma situação crítica. Procure ajuda financeira e ajuste seu orçamento urgentemente.",
                color: "danger"
            };
        }
    }

    useEffect(() => {
        const savingsScore = calculateSavingsScore(financialData.totalSavings, financialData.totalIncome);
        const debtScore = calculateDebtScore(financialData.totalDebt, financialData.totalIncome);
        const balanceScore = calculateBalanceScore(financialData.totalIncome, financialData.totalExpenses);
        
        const breakdown = {
            savingsScore,
            debtScore,
            balanceScore,
            totalScore: 0
        };
        
        breakdown.totalScore = calculateTotalScore(breakdown);
        setScoreBreakdown(breakdown);
    }, [financialData]);

    const healthStatus = getHealthStatus(scoreBreakdown.totalScore);

    return (
        <main className="container-fluid py-4">
            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Indicador de Saúde Financeira</h2>
                    <p className="text-muted">Análise detalhada da sua situação financeira</p>
                </div>
            </div>

            {/* Score Principal */}
            <div className="row mb-4">
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Score de Saúde Financeira</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <RadialBarChart
                                        innerRadius="10%"
                                        outerRadius="80%"
                                        data={[
                                            {
                                                name: 'Score Atual',
                                                value: scoreBreakdown.totalScore,
                                                fill: `var(--bs-${healthStatus.color})`
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
                                        <Tooltip formatter={(value: number) => `${value.toFixed(1)} pontos`} />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="text-center mt-3">
                                <h3 className={`text-${healthStatus.color}`}>{healthStatus.status}</h3>
                                <p className="text-muted">{healthStatus.message}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Distribuição de Renda */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Distribuição de Renda</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Poupança', value: financialData.totalSavings },
                                                { name: 'Dívidas', value: financialData.totalDebt },
                                                { name: 'Despesas', value: financialData.totalExpenses }
                                            ]}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label
                                        >
                                            {COLORS.map((color, index) => (
                                                <Cell key={`cell-${index}`} fill={color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detalhamento dos Critérios */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Detalhamento dos Critérios</h5>
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Critério</th>
                                            <th>Valor</th>
                                            <th>Pontuação</th>
                                            <th>Peso</th>
                                            <th>Pontuação Final</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Taxa de Poupança</td>
                                            <td>{((financialData.totalSavings / financialData.totalIncome) * 100).toFixed(1)}%</td>
                                            <td>{scoreBreakdown.savingsScore} pontos</td>
                                            <td>40%</td>
                                            <td>{(scoreBreakdown.savingsScore * 0.4).toFixed(1)}</td>
                                        </tr>
                                        <tr>
                                            <td>Taxa de Endividamento</td>
                                            <td>{((financialData.totalDebt / financialData.totalIncome) * 100).toFixed(1)}%</td>
                                            <td>{scoreBreakdown.debtScore} pontos</td>
                                            <td>30%</td>
                                            <td>{(scoreBreakdown.debtScore * 0.3).toFixed(1)}</td>
                                        </tr>
                                        <tr>
                                            <td>Equilíbrio Financeiro</td>
                                            <td>{formatCurrency(financialData.totalIncome - financialData.totalExpenses)}</td>
                                            <td>{scoreBreakdown.balanceScore} pontos</td>
                                            <td>30%</td>
                                            <td>{(scoreBreakdown.balanceScore * 0.3).toFixed(1)}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot>
                                        <tr className="table-primary">
                                            <td colSpan={4} className="text-end"><strong>Score Total:</strong></td>
                                            <td><strong>{scoreBreakdown.totalScore.toFixed(1)}</strong></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recomendações */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Recomendações</h5>
                            <div className="row g-4">
                                <div className="col-md-4">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0">
                                            <div className="bg-success bg-opacity-10 p-3 rounded">
                                                <Save className="text-success" size={24} />
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h6>Poupança</h6>
                                            <p className="text-muted mb-0">
                                                {scoreBreakdown.savingsScore >= 75 
                                                    ? "Continue mantendo sua taxa de poupança!"
                                                    : "Tente aumentar sua taxa de poupança para pelo menos 10% da renda."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0">
                                            <div className="bg-warning bg-opacity-10 p-3 rounded">
                                                <CreditCard className="text-warning" size={24} />
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h6>Endividamento</h6>
                                            <p className="text-muted mb-0">
                                                {scoreBreakdown.debtScore >= 75 
                                                    ? "Seu nível de endividamento está controlado!"
                                                    : "Priorize a redução de dívidas para melhorar seu score."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0">
                                            <div className="bg-info bg-opacity-10 p-3 rounded">
                                                <TrendingUp className="text-info" size={24} />
                                            </div>
                                        </div>
                                        <div className="flex-grow-1 ms-3">
                                            <h6>Equilíbrio</h6>
                                            <p className="text-muted mb-0">
                                                {scoreBreakdown.balanceScore >= 75 
                                                    ? "Seu equilíbrio financeiro está positivo!"
                                                    : "Tente reduzir despesas para alcançar um superávit mensal."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
} 