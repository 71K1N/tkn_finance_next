import { Calendar } from 'react-feather';

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
        <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
                <h5 className="card-title mb-4">Próximas Transações a Vencer</h5>
                {transactions.length === 0 ? (
                    <p className="text-muted mb-0">Nenhuma transação pendente com vencimento próximo.</p>
                ) : (
                    <ul className="list-group list-group-flush">
                        {transactions.map((t) => (
                            <li key={t.id} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                                <div>
                                    <div className="fw-semibold">{t.name}</div>
                                    <div className="text-muted small d-flex align-items-center gap-1">
                                        <Calendar size={12} />
                                        {formatDate(t.due_date)}
                                    </div>
                                </div>
                                <div className="text-end">
                                    <div className={`fw-bold ${t.type === 'EXPENSE' ? 'text-danger' : 'text-success'}`}>
                                        {t.type === 'EXPENSE' ? '-' : '+'}{formatCurrency(t.amount)}
                                    </div>
                                    <span className={`badge ${t.type === 'EXPENSE' ? 'bg-danger' : 'bg-success'}`}>
                                        {t.type === 'EXPENSE' ? 'Despesa' : 'Receita'}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
