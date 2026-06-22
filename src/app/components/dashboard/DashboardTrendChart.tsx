"use client"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

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
    return (
        <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="card-title mb-0">Histórico dos Últimos 3 Meses</h5>
                    {rangeLabel && <span className="badge bg-secondary">{rangeLabel}</span>}
                </div>
                {data.length === 0 ? (
                    <div className="d-flex align-items-center justify-content-center" style={{ height: 260 }}>
                        <p className="text-muted mb-0">Sem dados históricos disponíveis.</p>
                    </div>
                ) : (
                    <div style={{ width: '100%', height: 260 }}>
                        <ResponsiveContainer>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                <Legend />
                                <Bar dataKey="income" name="Entradas" fill="#00C49F" />
                                <Bar dataKey="expenses" name="Saídas" fill="#FF8042" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}
