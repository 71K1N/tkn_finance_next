"use client"
import { useEffect, useState } from "react";
import { Trash2, Edit, DollarSign } from 'react-feather';
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
        <div>
            <div className="row">
                <div className="col">
                    <h2>Transações</h2>
                </div>
            </div>
            <div className="card">
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="form-floating mb-3">
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
                            <div className="form-floating mb-3">
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

                    <div className="row">
                        <div className="col-md-3">
                            <div className="form-floating mb-3">
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
                            <div className="form-floating mb-3">
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
                    </div>

                    <div className="row mb-3">                       
                        
                        {/* Alternativa com Radio Buttons para melhor UX */}
                        <div className="col-md-8">
                            <div className="mt-2">
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

                    <div className="row">
                        <div className="col-md-4">
                            <div className="form-floating mb-3">
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
                            <div className="form-floating mb-3">
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
                            <div className="form-floating mb-3">
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

                    <div className="row mt-2">
                        <div className="col-md-6">
                            <button className="btn btn-warning" onClick={handleSubmit}>Salvar</button>
                            <button className="btn btn-danger mx-2" onClick={clearForm}>Cancelar</button>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-12">
                            <table className="table mt-4">
                                <thead className="table-dark">
                                    <tr>
                                        <th>Descrição</th>
                                        <th>Categoria</th>
                                        <th>Subcategoria</th>
                                        <th>Valor</th>
                                        <th>Vencimento</th>
                                        <th>Status</th>
                                        <th>Tipo</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(item => (
                                        <tr key={item.id} className={item.payment_date ? 'table-success' : ''}>
                                            <td>{item.name}</td>
                                            <td>{getCategoryName(item.category_id)}</td>
                                            <td>{getSubCategoryName(item.subcategory_id)}</td>
                                            <td>R$ {item.amount.toFixed(2)}</td>
                                            <td>{new Date(item.due_date).toLocaleDateString()}</td>
                                            <td>
                                                {item.payment_date ? (
                                                    <span className="badge bg-success">Pago</span>
                                                ) : (
                                                    <span className="badge bg-warning">Pendente</span>
                                                )}
                                            </td>
                                            <td>{item.type === 'EXPENSE' ? 'Despesa' : 'Receita'}</td>
                                            <td>
                                                <div className="btn-group" role="group">
                                                    {!item.payment_date && (
                                                        <button 
                                                            className="btn btn-outline-success" 
                                                            onClick={() => handleOpenPaymentModal(item)}
                                                            title="Registrar Pagamento"
                                                        >
                                                            <DollarSign size={18} />
                                                        </button>
                                                    )}
                                                    <button className="btn btn-outline-secondary" onClick={() => edit(item)}>
                                                        <Edit size={18} />
                                                    </button>
                                                    <button className="btn btn-outline-secondary" onClick={() => remove(item.id)}>
                                                        <Trash2 size={18} />
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
                                {/* Novo: Informações da transação */}
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
                                    className="btn btn-secondary" 
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
                    {/* <div className="modal-backdrop show" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1040}}></div> */}
                </div>
            )}
        </div>
    )
}