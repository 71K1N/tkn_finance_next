"use client"
import { useEffect, useState } from "react";
import { Trash2, Edit, Search, Save, X, CreditCard } from 'react-feather';
import swal from 'sweetalert';

export default function PageAccount() {
    const apiUrl = "http://localhost:8081"
    const [description, setDescription] = useState<string>("");
    const [id, setId] = useState<number>(0);
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [errors, setErrors] = useState<{description?: string, balance?: string}>({});

    async function getAll() {
        setLoading(true);
        try {
            let response = await fetch(apiUrl + '/bank-account', { method: "GET" });
            const data = await response.json();
            setAccounts(data);
        } catch (error) {
            swal("Erro!", "Não foi possível carregar as contas", "error");
        } finally {
            setLoading(false);
        }
    }

    function validateForm() {
        const newErrors: {description?: string, balance?: string} = {};
        if (!description.trim()) {
            newErrors.description = "Descrição é obrigatória";
        }
        if (balance === undefined || balance === null) {
            newErrors.balance = "Saldo é obrigatório";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit() {
        if (!validateForm()) return;
        
        swal({
            title: "Confirmar",
            text: id > 0 ? "Deseja atualizar esta conta?" : "Deseja criar uma nova conta?",
            icon: "question",
            buttons: ["Cancelar", "Confirmar"],
        }).then((willProceed) => {
            if (willProceed) {
                id > 0 ? update() : store();
            }
        });
    }

    async function store() {
        setLoading(true);
        try {
            const data = { description, balance }
            await fetch(apiUrl + "/bank-account", {
                method: "POST", 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(data)
            });
            swal("Sucesso!", "Conta criada com sucesso!", "success");
            clearForm();
            getAll();
        } catch (error) {
            swal("Erro!", "Não foi possível criar a conta", "error");
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        setLoading(true);
        try {
            const data = { description, balance }
            await fetch(`${apiUrl}/bank-account/${id}`, {
                method: "PATCH", 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(data)
            });
            swal("Sucesso!", "Conta atualizada com sucesso!", "success");
            clearForm();
            getAll();
        } catch (error) {
            swal("Erro!", "Não foi possível atualizar a conta", "error");
        } finally {
            setLoading(false);
        }
    }

    async function remove(id:number) {
        swal({
            title: "Confirmação",
            text: "Tem certeza que deseja excluir esta conta?",
            icon: "warning",
            dangerMode: true,
            buttons: ["Cancelar", "Excluir"],
        }).then(async (willDelete) => {
            if (willDelete) {
                setLoading(true);
                try {
                    await fetch(`${apiUrl}/bank-account/${id}`, {method:'DELETE'});
                    swal("Sucesso!", "Conta excluída com sucesso!", "success");
                    getAll();
                } catch (error) {
                    swal("Erro!", "Não foi possível excluir a conta", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    }

    function edit(item:any) {
        setId(item.id);
        setDescription(item.description);
        setBalance(item.balance);
    }

    function clearForm() {
        setId(0);
        setDescription("");
        setBalance(0);
        setErrors({});
    }

    function formatCurrency(value: number) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    const filteredAccounts = accounts.filter(account => 
        account.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatCurrency(account.balance).includes(searchTerm)
    );

    useEffect(() => {
        getAll()
    }, [])
    
    return (
        <div className="container-fluid py-4">
            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Contas Bancárias</h2>
                    <p className="text-muted">Gerencie suas contas bancárias de forma simples e eficiente</p>
                </div>
            </div>
            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="form-floating">
                                <input 
                                    type="text" 
                                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                    id="description" 
                                    placeholder="Digite uma descrição para sua conta" 
                                    value={description} 
                                    onChange={e => { 
                                        setDescription(e.target.value);
                                        if (errors.description) setErrors({...errors, description: undefined});
                                    }} 
                                />
                                <label htmlFor="description">Descrição</label>
                                {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-floating">
                                <input 
                                    type="number" 
                                    step="0.01"
                                    className={`form-control ${errors.balance ? 'is-invalid' : ''}`}
                                    id="balance" 
                                    placeholder="Digite o saldo da conta" 
                                    value={balance || ''} 
                                    onChange={e => { 
                                        setBalance(Number(e.target.value));
                                        if (errors.balance) setErrors({...errors, balance: undefined});
                                    }} 
                                />
                                <label htmlFor="balance">Saldo</label>
                                {errors.balance && <div className="invalid-feedback">{errors.balance}</div>}
                            </div>
                        </div>
                    </div>
                    <div className="row mt-3">
                        <div className="col">
                            <button 
                                className="btn btn-primary me-2" 
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                <Save size={16} className="me-1" />
                                {id > 0 ? 'Atualizar' : 'Salvar'}
                            </button>
                            <button 
                                className="btn btn-outline-secondary" 
                                onClick={clearForm}
                                disabled={loading}
                            >
                                <X size={16} className="me-1" />
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card shadow-sm mt-4">
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
                                    placeholder="Buscar contas..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Descrição</th>
                                    <th>Saldo</th>
                                    <th className="text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>                                    
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-4">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Carregando...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredAccounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-4">
                                            Nenhuma conta encontrada
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAccounts.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <CreditCard size={16} className="me-2 text-primary" />
                                                    {item.description}
                                                </div>
                                            </td>
                                            <td className={item.balance >= 0 ? 'text-success' : 'text-danger'}>
                                                {formatCurrency(item.balance)}
                                            </td>
                                            <td className="text-end">
                                                <div className="btn-group" role="group">
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}