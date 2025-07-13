"use client"
import { useEffect, useState } from "react";
import { Trash2, Edit, DollarSign, Search, Save, X, CreditCard, Calendar, Tag, List } from 'react-feather';
import swal from 'sweetalert';

interface Transaction {
    id?: number;
    name: string;
    description: string;
    amount: number;
    due_date: string;
    payment_date: string | null;
    subcategory_id: number;
    category_id: number;
    user_id: number;
    account_id: number;
    paid_amount: number;
    type: 'EXPENSE' | 'INCOME';
}

export default function PageTransaction() {
    const apiUrl = "http://localhost:8081"

    // Estados para o formulário
    const [id, setId] = useState<number>(0);
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);
    const [dueDate, setDueDate] = useState<string>("");
    const [categoryId, setCategoryId] = useState<number>(0);
    const [subCategoryId, setSubCategoryId] = useState<number>(0);
    const [accountId, setAccountId] = useState<number>(0);
    const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    
    // Estados para dados relacionados
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Novos estados para totalizadores
    const [totalExpenses, setTotalExpenses] = useState(0)
    const [totalIncome, setTotalIncome] = useState(0)
    const [balance, setBalance] = useState(0)

    // Estados para o modal de pagamento
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [modalPaymentDate, setModalPaymentDate] = useState("");
    const [modalPaidAmount, setModalPaidAmount] = useState(0);

    async function getAllTransactions() {
        let response = await fetch(apiUrl + '/transaction', { method: "GET" });
        setTransactions(await response.json());
    }

    async function getCategories() {
        let response = await fetch(apiUrl + '/category', { method: "GET" })
        setCategories(await response.json());
    }

    async function getSubCategories() {
        let response = await fetch(apiUrl + '/subcategory', { method: "GET" });
        setSubCategories(await response.json());
    }

    async function getAccounts() {
        let response = await fetch(apiUrl + '/bank-account', { method: "GET" });
        setAccounts(await response.json());
    }

    function handleSubmit() {
        id > 0 ? update() : store();
    }

    async function store() {
        const transaction: Transaction = {
            name,
            description,
            amount,
            due_date: dueDate,
            payment_date: null,
            subcategory_id: subCategoryId,
            category_id: categoryId,
            user_id: 1, // Temporário - deve vir do contexto de autenticação
            account_id: accountId,
            paid_amount: amount,
            type
        }

        let response = await fetch(apiUrl + "/transaction", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });

        if (response.status === 201) {
            swal("Salvo!", "Transação adicionada com sucesso!", "success");
            clearForm();
            getAllTransactions();
        } else {
            swal("Erro!", "Erro ao salvar, verifique os dados!", "error");
        }
    }

    async function update() {
        const transaction = { 
            category_id: categoryId, 
            subcategory_id: subCategoryId,
            description, 
            amount,
            due_date: dueDate,
            type
        }
        let response = await fetch(`${apiUrl}/transaction/${id}`, {
            method: "PATCH",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        })
        clearForm();
        getAllTransactions();
    }

    async function remove(id: number | undefined) {
        swal({
            title: "Confirmação",
            text: "Confirma a exclusão desta transação?",
            icon: "warning",
            dangerMode: true,
        })
        .then(willDelete => {
            if (willDelete) {
                fetch(`${apiUrl}/transaction/${id}`, { method: 'DELETE' }).then(() => {
                    swal("Excluído!", "Transação excluída com sucesso!", "success");
                    getAllTransactions();
                });
            }
        });
    }

    function edit(item: Transaction) {
        setId(item.id || 0);
        setName(item.name);
        setDescription(item.description);
        setCategoryId(item.category_id);
        setSubCategoryId(item.subcategory_id);
        setAmount(item.amount);
        setDueDate(item.due_date);
        setType(item.type);
    }

    function clearForm() {
        setId(0);
        setName("");
        setDescription("");
        setAmount(0);
        setDueDate("");
        setCategoryId(0);
        setSubCategoryId(0);
        setAccountId(0);
        setType('EXPENSE');
    }

    function handleCategorySelect(e: any) {
        setCategoryId(Number(e.target.value));
    }

    function handleSubCategorySelect(e: any) {
        setSubCategoryId(Number(e.target.value));
    }

    function getCategoryName(id: number) {
        const category = categories.find(cat => cat.id === id);
        return category ? category.name : "N/A";
    }

    function getSubCategoryName(id: number) {
        const subCategory = subCategories.find(sub => sub.id === id);
        return subCategory ? subCategory.name : "N/A";
    }

    // Função para calcular totalizadores
    function calculateTotals() {
        const expenses = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((acc, curr) => acc + curr.amount, 0)
        
        const income = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((acc, curr) => acc + curr.amount, 0)
        
        setTotalExpenses(expenses)
        setTotalIncome(income)
        setBalance(income - expenses)
    }

    // Função para abrir modal de pagamento
    function handleOpenPaymentModal(transaction: Transaction) {
        setSelectedTransaction(transaction);
        setModalPaidAmount(transaction.amount);
        setModalPaymentDate(new Date().toISOString().split('T')[0]);
        setShowPaymentModal(true);
    }

    // Função para processar o pagamento
    async function handlePayment() {
        if (!selectedTransaction) return;

        const paymentData = {
            payment_date: modalPaymentDate,
            paid_amount: modalPaidAmount
        };

        const response = await fetch(`${apiUrl}/transaction/${selectedTransaction.id}/payment`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });

        if (response.status === 200) {
            swal("Sucesso!", "Pagamento registrado com sucesso!", "success");
            setShowPaymentModal(false);
            getAllTransactions();
        } else {
            swal("Erro!", "Erro ao registrar pagamento!", "error");
        }
    }

    // Atualizar useEffect para incluir cálculo de totais quando transactions mudar
    useEffect(() => {
        getCategories();
        getSubCategories();
        getAccounts();
        getAllTransactions();
        calculateTotals();
    }, [])

    return (
        <div className="container-fluid py-4">
            {/* Cabeçalho com Resumo */}
            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Transações</h2>
                    <p className="text-muted">Gerencie suas transações financeiras</p>
                </div>
            </div>

            {/* Formulário */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-4">Nova Transação</h5>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="form-floating">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="name" 
                                    placeholder="Nome da transação"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <label htmlFor="name">Nome</label>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-floating">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="description" 
                                    placeholder="Descrição"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                                <label htmlFor="description">Descrição</label>
                            </div>
                        </div>
                    </div>

                    <div className="row g-3 mt-2">
                        <div className="col-md-3">
                            <div className="form-floating">
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="amount" 
                                    placeholder="Valor"
                                    value={amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '') 
                                        setAmount(Number(value) / 100)
                                    }}
                                />
                                <label htmlFor="amount">Valor</label>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="form-floating">
                                <input 
                                    type="date" 
                                    className="form-control" 
                                    id="dueDate"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                                <label htmlFor="dueDate">Data Vencimento</label>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex align-items-center h-100">
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="transactionType"
                                        id="typeExpense"
                                        value="EXPENSE"
                                        checked={type === 'EXPENSE'}
                                        onChange={(e) => setType(e.target.value as 'EXPENSE' | 'INCOME')}
                                    />
                                    <label className="form-check-label text-danger" htmlFor="typeExpense">
                                        <span className="ms-1">Despesa</span>
                                    </label>
                                </div>
                                <div className="form-check form-check-inline">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="transactionType"
                                        id="typeIncome"
                                        value="INCOME"
                                        checked={type === 'INCOME'}
                                        onChange={(e) => setType(e.target.value as 'EXPENSE' | 'INCOME')}
                                    />
                                    <label className="form-check-label text-success" htmlFor="typeIncome">
                                        <span className="ms-1">Receita</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-3 mt-2">
                        <div className="col-md-4">
                            <div className="form-floating">
                                <select 
                                    className="form-select" 
                                    value={accountId} 
                                    onChange={(e) => setAccountId(Number(e.target.value))}
                                >
                                    <option value="0">Selecione...</option>
                                    {accounts.map(account => (
                                        <option key={account.id} value={account.id}>
                                            {account.description}
                                        </option>
                                    ))}
                                </select>
                                <label>Conta</label>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-floating">
                                <select 
                                    className="form-select" 
                                    value={categoryId} 
                                    onChange={(e) => setCategoryId(Number(e.target.value))}
                                >
                                    <option value="0">Selecione...</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <label>Categoria</label>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-floating">
                                <select 
                                    className="form-select" 
                                    value={subCategoryId} 
                                    onChange={(e) => setSubCategoryId(Number(e.target.value))}
                                >
                                    <option value="0">Selecione...</option>
                                    {subCategories
                                        .filter(sub => sub.categoryId === categoryId)
                                        .map(sub => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                </select>
                                <label>Subcategoria</label>
                            </div>
                        </div>
                    </div>

                    <div className="row mt-4">
                        <div className="col">
                            <button 
                                className="btn btn-primary me-2" 
                                onClick={handleSubmit}
                            >
                                <Save size={16} className="me-1" />
                                {id > 0 ? 'Atualizar' : 'Salvar'}
                            </button>
                            <button 
                                className="btn btn-outline-secondary" 
                                onClick={clearForm}
                            >
                                <X size={16} className="me-1" />
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Transações */}
            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="row mb-3">
                        <div className="col">
                            <div className="input-group">
                                <span className="input-group-text">
                                    <Search size={16} />
                                </span>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Buscar transações..." 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Descrição</th>
                                    <th>Categoria</th>
                                    <th>Subcategoria</th>
                                    <th>Valor</th>
                                    <th>Vencimento</th>
                                    <th>Status</th>
                                    <th>Tipo</th>
                                    <th className="text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(item => (
                                    <tr key={item.id} className={item.payment_date ? 'table-success' : ''}>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <List size={16} className="me-2 text-primary" />
                                                {item.name}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <Tag size={16} className="me-2 text-secondary" />
                                                {getCategoryName(item.category_id)}
                                            </div>
                                        </td>
                                        <td>{getSubCategoryName(item.subcategory_id)}</td>
                                        <td className={item.type === 'EXPENSE' ? 'text-danger' : 'text-success'}>
                                            R$ {item.amount.toFixed(2)}
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <Calendar size={16} className="me-2 text-secondary" />
                                                {new Date(item.due_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            {item.payment_date ? (
                                                <span className="badge bg-success">Pago</span>
                                            ) : (
                                                <span className="badge bg-warning">Pendente</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${item.type === 'EXPENSE' ? 'bg-danger' : 'bg-success'}`}>
                                                {item.type === 'EXPENSE' ? 'Despesa' : 'Receita'}
                                            </span>
                                        </td>
                                        <td className="text-end">
                                            <div className="btn-group" role="group">
                                                {!item.payment_date && (
                                                    <button 
                                                        className="btn btn-outline-success btn-sm" 
                                                        onClick={() => handleOpenPaymentModal(item)}
                                                        title="Registrar Pagamento"
                                                    >
                                                        <DollarSign size={16} />
                                                    </button>
                                                )}
                                                <button 
                                                    className="btn btn-outline-primary btn-sm" 
                                                    onClick={() => edit(item)}
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    className="btn btn-outline-danger btn-sm" 
                                                    onClick={() => remove(item.id)}
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal de Pagamento */}
            {showPaymentModal && (
                <div className="modal show d-block" tabIndex={-1}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Registrar Pagamento</h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowPaymentModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info mb-3">
                                    <h6 className="mb-1">Transação: {selectedTransaction?.name}</h6>
                                    <div className="small">
                                        <strong>Valor Original:</strong> R$ {selectedTransaction?.amount.toFixed(2)}
                                        <br />
                                        <strong>Vencimento:</strong> {new Date(selectedTransaction?.due_date || '').toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="form-floating mb-3">
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        id="modalPaymentDate"
                                        value={modalPaymentDate}
                                        onChange={(e) => setModalPaymentDate(e.target.value)}
                                    />
                                    <label htmlFor="modalPaymentDate">Data do Pagamento</label>
                                </div>
                                <div className="form-floating mb-3">
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        id="modalPaidAmount"
                                        value={modalPaidAmount}
                                        onChange={(e) => setModalPaidAmount(Number(e.target.value))}
                                    />
                                    <label htmlFor="modalPaidAmount">Valor Pago</label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-outline-secondary" 
                                    onClick={() => setShowPaymentModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={handlePayment}
                                >
                                    Confirmar Pagamento
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop show"></div>
                </div>
            )}
        </div>
    )
}