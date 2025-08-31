"use client"
import { useState } from 'react';
import { Plus, DollarSign, ArrowRight, ArrowDown, ArrowUp } from 'react-feather';
import Link from 'next/link';

export default function FloatingActionButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="position-fixed bottom-0 end-0 p-4" style={{ zIndex: 1000 }}>
            <div className="d-flex flex-column align-items-end">
                {isOpen && (
                    <div className="mb-2">
                        <Link 
                            href="/transaction/new?type=income" 
                            className="btn btn-success rounded-circle p-3 mb-2 shadow-sm"
                            title="Nova Receita"
                        >
                            <ArrowDown size={24} />
                        </Link>
                        <Link 
                            href="/transaction/new?type=expense" 
                            className="btn btn-danger rounded-circle p-3 mb-2 shadow-sm"
                            title="Nova Despesa"
                        >
                            <ArrowUp size={24} />
                        </Link>
                        <Link 
                            href="/transaction/new?type=transfer" 
                            className="btn btn-primary rounded-circle p-3 shadow-sm"
                            title="Nova Transferência"
                        >
                            <ArrowRight size={24} />
                        </Link>
                    </div>
                )}
                <button 
                    className="btn btn-primary rounded-circle p-3 shadow"
                    onClick={() => setIsOpen(!isOpen)}
                    title="Nova Transação"
                >
                    <Plus size={24} />
                </button>
            </div>
        </div>
    );
} 