"use client"
import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Save, CreditCard, Target, Percent, ArrowUp, ArrowDown } from 'react-feather';
import { 
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import "bootstrap/dist/css/bootstrap.min.css";
import styles from "./page.module.css";

interface FinancialData {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    savingsRate: number;
    currentDebt: number;
    passiveIncome: number;
    financialGoals: {
        name: string;
        target: number;
        current: number;
    }[];
}

interface ExpenseDistribution {
    category: string;
    value: number;
}

interface MonthlyComparison {
    month: string;
    income: number;
    expenses: number;
}

interface BalanceEvolution {
    date: string;
    balance: number;
}

interface NetWorth {
    date: string;
    assets: number;
    liabilities: number;
    netWorth: number;
}

interface InvestmentAllocation {
    type: string;
    value: number;
}

interface SavingsRate {
    current: number;
    target: number;
}

interface CategorySpending {
    category: string;
    frequency: number;
    amount: number;
}

export default function Home() {
    const [financialData, setFinancialData] = useState<FinancialData>({
        totalBalance: 15000,
        monthlyIncome: 8000,
        monthlyExpenses: 5000,
        monthlySavings: 3000,
        savingsRate: 37.5,
        currentDebt: 2500,
        passiveIncome: 500,
        financialGoals: [
            { name: "Viagem para Europa", target: 20000, current: 8000 },
            { name: "Entrada do Apartamento", target: 50000, current: 15000 },
            { name: "Carro Novo", target: 30000, current: 12000 }
        ]
    });

    // Estados para os dados dos gráficos
    const [expenseDistribution, setExpenseDistribution] = useState<ExpenseDistribution[]>([
        { category: 'Habitação', value: 2500 },
        { category: 'Alimentação', value: 1500 },
        { category: 'Transporte', value: 800 },
        { category: 'Lazer', value: 600 },
        { category: 'Educação', value: 400 },
        { category: 'Saúde', value: 300 },
        { category: 'Outros', value: 500 }
    ]);

    const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison[]>([
        { month: 'Jan', income: 8000, expenses: 6000 },
        { month: 'Fev', income: 8500, expenses: 5500 },
        { month: 'Mar', income: 9000, expenses: 5800 },
        { month: 'Abr', income: 8200, expenses: 6200 },
        { month: 'Mai', income: 8800, expenses: 5900 },
        { month: 'Jun', income: 9200, expenses: 6100 }
    ]);

    const [balanceEvolution, setBalanceEvolution] = useState<BalanceEvolution[]>([
        { date: '2024-01', balance: 10000 },
        { date: '2024-02', balance: 12500 },
        { date: '2024-03', balance: 15700 },
        { date: '2024-04', balance: 17700 },
        { date: '2024-05', balance: 20600 },
        { date: '2024-06', balance: 24000 }
    ]);

    const [netWorth, setNetWorth] = useState<NetWorth[]>([
        { date: '2024-01', assets: 15000, liabilities: 5000, netWorth: 10000 },
        { date: '2024-02', assets: 17500, liabilities: 5000, netWorth: 12500 },
        { date: '2024-03', assets: 20700, liabilities: 5000, netWorth: 15700 },
        { date: '2024-04', assets: 22700, liabilities: 5000, netWorth: 17700 },
        { date: '2024-05', assets: 25600, liabilities: 5000, netWorth: 20600 },
        { date: '2024-06', assets: 29000, liabilities: 5000, netWorth: 24000 }
    ]);

    const [investmentAllocation, setInvestmentAllocation] = useState<InvestmentAllocation[]>([
        { type: 'Renda Fixa', value: 40 },
        { type: 'Ações', value: 25 },
        { type: 'Fundos', value: 20 },
        { type: 'Criptomoedas', value: 10 },
        { type: 'Outros', value: 5 }
    ]);

    const [savingsRate, setSavingsRate] = useState<SavingsRate>({
        current: 37.5,
        target: 30
    });

    const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([
        { category: 'Habitação', frequency: 12, amount: 2500 },
        { category: 'Alimentação', frequency: 45, amount: 1500 },
        { category: 'Transporte', frequency: 30, amount: 800 },
        { category: 'Lazer', frequency: 15, amount: 600 },
        { category: 'Educação', frequency: 8, amount: 400 },
        { category: 'Saúde', frequency: 6, amount: 300 },
        { category: 'Outros', frequency: 20, amount: 500 }
    ]);

    // Cores para os gráficos
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B'];

    function formatCurrency(value: number) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    function calculateProgress(current: number, target: number) {
        return Math.min((current / target) * 100, 100);
    }

    // Funções para buscar dados da API
    async function fetchExpenseDistribution() {
        // Implementar chamada à API
        // const response = await fetch('/api/expense-distribution');
        // const data = await response.json();
        // setExpenseDistribution(data);
    }

    async function fetchMonthlyComparison() {
        // Implementar chamada à API
        // const response = await fetch('/api/monthly-comparison');
        // const data = await response.json();
        // setMonthlyComparison(data);
    }

    async function fetchBalanceEvolution() {
        // Implementar chamada à API
        // const response = await fetch('/api/balance-evolution');
        // const data = await response.json();
        // setBalanceEvolution(data);
    }

    async function fetchNetWorth() {
        // Implementar chamada à API
        // const response = await fetch('/api/net-worth');
        // const data = await response.json();
        // setNetWorth(data);
    }

    async function fetchInvestmentAllocation() {
        // Implementar chamada à API
        // const response = await fetch('/api/investment-allocation');
        // const data = await response.json();
        // setInvestmentAllocation(data);
    }

    async function fetchSavingsRate() {
        // Implementar chamada à API
        // const response = await fetch('/api/savings-rate');
        // const data = await response.json();
        // setSavingsRate(data);
    }

    async function fetchCategorySpending() {
        // Implementar chamada à API
        // const response = await fetch('/api/category-spending');
        // const data = await response.json();
        // setCategorySpending(data);
    }

    // Carregar dados ao iniciar
    useEffect(() => {
        fetchExpenseDistribution();
        fetchMonthlyComparison();
        fetchBalanceEvolution();
        fetchNetWorth();
        fetchInvestmentAllocation();
        fetchSavingsRate();
        fetchCategorySpending();
    }, []);

    return (
        <main className="container-fluid py-4">
            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Dashboard Financeiro</h2>
                    <p className="text-muted">Visão geral da sua situação financeira</p>
                </div>
            </div>

            {/* Cards Principais */}
            <div className="row g-4 mb-4">
                {/* Saldo Total */}
                <div className="col-md-6 col-lg-3">
                    <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="flex-shrink-0">
                                    <div className="bg-primary bg-opacity-10 p-3 rounded">
                                        <DollarSign className="text-primary" size={24} />
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="card-title mb-0">Saldo Total</h6>
                                    <h3 className="mb-0 mt-2">{formatCurrency(financialData.totalBalance)}</h3>
                                </div>
                            </div>
                            <div className="text-muted small">
                                Saldo em todas as contas
                            </div>
                        </div>
                    </div>
                </div>

                {/* Receitas e Despesas */}
                <div className="col-md-6 col-lg-3">
                    <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="flex-shrink-0">
                                    <div className="bg-success bg-opacity-10 p-3 rounded">
                                        <TrendingUp className="text-success" size={24} />
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="card-title mb-0">Fluxo Mensal</h6>
                                    <div className="d-flex align-items-center mt-2">
                                        <div className="me-3">
                                            <div className="text-success small">
                                                <ArrowUp size={14} className="me-1" />
                                                {formatCurrency(financialData.monthlyIncome)}
                                            </div>
                                            <div className="text-danger small">
                                                <ArrowDown size={14} className="me-1" />
                                                {formatCurrency(financialData.monthlyExpenses)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-muted small">
                                Receitas e despesas do mês
                            </div>
                        </div>
                    </div>
                </div>

                {/* Economia Mensal */}
                <div className="col-md-6 col-lg-3">
                    <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="flex-shrink-0">
                                    <div className="bg-info bg-opacity-10 p-3 rounded">
                                        <Save className="text-info" size={24} />
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="card-title mb-0">Economia Mensal</h6>
                                    <h3 className="mb-0 mt-2">{formatCurrency(financialData.monthlySavings)}</h3>
                                    <div className="text-success small">
                                        {financialData.savingsRate.toFixed(1)}% da receita
                                    </div>
                                </div>
                            </div>
                            <div className="text-muted small">
                                Economia do mês atual
                            </div>
                        </div>
                    </div>
                </div>

                {/* Endividamento */}
                <div className="col-md-6 col-lg-3">
                    <div className="card h-100 border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="flex-shrink-0">
                                    <div className="bg-warning bg-opacity-10 p-3 rounded">
                                        <CreditCard className="text-warning" size={24} />
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="card-title mb-0">Endividamento</h6>
                                    <h3 className="mb-0 mt-2">{formatCurrency(financialData.currentDebt)}</h3>
                                    <div className="text-warning small">
                                        Dívidas ativas
                                    </div>
                                </div>
                            </div>
                            <div className="text-muted small">
                                Total de dívidas atuais
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Segunda Linha de Cards */}
            <div className="row g-4 mb-4">
                {/* Renda Passiva */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Renda Passiva</h5>
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-success bg-opacity-10 p-3 rounded">
                                        <TrendingUp className="text-success" size={24} />
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h3 className="mb-0">{formatCurrency(financialData.passiveIncome)}</h3>
                                    <div className="text-muted small">Renda mensal de investimentos</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Taxa de Poupança */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Taxa de Poupança</h5>
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0">
                                    <div className="bg-info bg-opacity-10 p-3 rounded">
                                        <Percent className="text-info" size={24} />
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h3 className="mb-0">{financialData.savingsRate.toFixed(1)}%</h3>
                                    <div className="text-muted small">Da receita mensal</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Objetivos Financeiros */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Objetivos Financeiros</h5>
                            <div className="row g-4">
                                {financialData.financialGoals.map((goal, index) => (
                                    <div key={index} className="col-md-4">
                                        <div className="card h-100 border-0 bg-light">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center mb-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="bg-primary bg-opacity-10 p-3 rounded">
                                                            <Target className="text-primary" size={24} />
                                                        </div>
                                                    </div>
                                                    <div className="flex-grow-1 ms-3">
                                                        <h6 className="card-title mb-0">{goal.name}</h6>
                                                        <div className="text-muted small">
                                                            {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="progress" style={{ height: '8px' }}>
                                                    <div 
                                                        className="progress-bar bg-primary" 
                                                        role="progressbar" 
                                                        style={{ width: `${calculateProgress(goal.current, goal.target)}%` }}
                                                        aria-valuenow={calculateProgress(goal.current, goal.target)} 
                                                        aria-valuemin={0} 
                                                        aria-valuemax={100}
                                                    ></div>
                                                </div>
                                                <div className="text-end mt-2">
                                                    <span className="badge bg-primary">
                                                        {calculateProgress(goal.current, goal.target).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficos */}
            <div className="row g-4 mb-4">
                {/* Distribuição de Despesas */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Distribuição de Despesas</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={expenseDistribution}
                                            dataKey="value"
                                            nameKey="category"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label
                                        >
                                            {expenseDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

                {/* Receita vs. Despesas Mensais */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Receita vs. Despesas Mensais</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={monthlyComparison}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Legend />
                                        <Bar dataKey="income" name="Receitas" fill="#00C49F" />
                                        <Bar dataKey="expenses" name="Despesas" fill="#FF8042" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-4">
                {/* Evolução do Saldo Total */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Evolução do Saldo Total</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <LineChart data={balanceEvolution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Legend />
                                        <Line type="monotone" dataKey="balance" name="Saldo" stroke="#8884d8" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patrimônio Líquido */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Patrimônio Líquido</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={netWorth}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Legend />
                                        <Area type="monotone" dataKey="assets" name="Ativos" fill="#8884d8" />
                                        <Area type="monotone" dataKey="liabilities" name="Passivos" fill="#ff8042" />
                                        <Area type="monotone" dataKey="netWorth" name="Patrimônio Líquido" fill="#00C49F" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-4">
                {/* Alocação de Investimentos */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Alocação de Investimentos</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={investmentAllocation}
                                            dataKey="value"
                                            nameKey="type"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            label
                                        >
                                            {investmentAllocation.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value}%`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Taxa de Poupança */}
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Taxa de Poupança</h5>
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <RadialBarChart
                                        innerRadius="10%"
                                        outerRadius="80%"
                                        data={[
                                            {
                                                name: 'Taxa Atual',
                                                value: savingsRate.current,
                                                fill: savingsRate.current >= savingsRate.target ? '#00C49F' : '#FF8042'
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
                                        <Tooltip formatter={(value) => `${value}%`} />
                                    </RadialBarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Histograma de Gastos por Categoria */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title mb-4">Gastos por Categoria</h5>
                            <div style={{ width: '100%', height: 400 }}>
                                <ResponsiveContainer>
                                    <BarChart data={categorySpending}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="category" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="frequency" name="Frequência" fill="#8884d8" />
                                        <Bar yAxisId="right" dataKey="amount" name="Valor Total" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
