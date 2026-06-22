import { ReactNode } from "react";

interface DashboardSummaryCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    colorClass: string;
    subtitle?: string;
}

export default function DashboardSummaryCard({ title, value, icon, colorClass, subtitle }: DashboardSummaryCardProps) {
    return (
        <div className="card h-100 border-0 shadow-sm">
            <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                    <div className={`bg-${colorClass} bg-opacity-10 p-3 rounded flex-shrink-0`}>
                        <span className={`text-${colorClass}`}>{icon}</span>
                    </div>
                    <div className="flex-grow-1 ms-3">
                        <h6 className="card-title mb-0 text-muted">{title}</h6>
                        <h3 className="mb-0 mt-1">{value}</h3>
                    </div>
                </div>
                {subtitle && <div className="text-muted small">{subtitle}</div>}
            </div>
        </div>
    );
}
