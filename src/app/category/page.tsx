"use client"
import { useEffect, useState } from "react";
import { Trash2, Edit, Search, Save, X } from 'react-feather';
import swal from 'sweetalert';

export default function PageCategory() {
    const apiUrl = "http://localhost:8081"
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [id, setId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [errors, setErrors] = useState<{name?: string, description?: string}>({});

    async function getAll() {
        setLoading(true);
        try {
            let response = await fetch(apiUrl + '/category', { method: "GET" });
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            swal("Erro!", "Não foi possível carregar as categorias", "error");
        } finally {
            setLoading(false);
        }
    }

    function validateForm() {
        const newErrors: {name?: string, description?: string} = {};
        if (!name.trim()) {
            newErrors.name = "Nome é obrigatório";
        }
        if (!description.trim()) {
            newErrors.description = "Descrição é obrigatória";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit() {
        if (!validateForm()) return;
        
        swal({
            title: "Confirmar",
            text: id > 0 ? "Deseja atualizar esta categoria?" : "Deseja criar uma nova categoria?",
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
            const category = { name, description }
            await fetch(apiUrl + "/category", {
                method: "POST", 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(category)
            });
            swal("Sucesso!", "Categoria criada com sucesso!", "success");
            clearForm();
            getAll();
        } catch (error) {
            swal("Erro!", "Não foi possível criar a categoria", "error");
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        setLoading(true);
        try {
            const category = { name, description }
            await fetch(`${apiUrl}/category/${id}`, {
                method: "PATCH", 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(category)
            });
            swal("Sucesso!", "Categoria atualizada com sucesso!", "success");
            clearForm();
            getAll();
        } catch (error) {
            swal("Erro!", "Não foi possível atualizar a categoria", "error");
        } finally {
            setLoading(false);
        }
    }

    async function remove(id:number) {
        swal({
            title: "Confirmação",
            text: "Tem certeza que deseja excluir esta categoria?",
            icon: "warning",
            dangerMode: true,
            buttons: ["Cancelar", "Excluir"],
        }).then(async (willDelete) => {
            if (willDelete) {
                setLoading(true);
                try {
                    await fetch(`${apiUrl}/category/${id}`, {method:'DELETE'});
                    swal("Sucesso!", "Categoria excluída com sucesso!", "success");
                    getAll();
                } catch (error) {
                    swal("Erro!", "Não foi possível excluir a categoria", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    }

    function edit(item:any) {
        setId(item.id);
        setName(item.name);
        setDescription(item.description);
    }

    function clearForm() {
        setId(0);
        setName("");
        setDescription("");
        setErrors({});
    }

    const filteredCategories = categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        getAll()
    }, [])
    
    return (
        <div className="container-fluid py-4">
            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Categorias</h2>
                    <p className="text-muted">Gerencie suas categorias de forma simples e eficiente</p>
                </div>
            </div>
            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <div className="form-floating">
                                <input 
                                    type="text" 
                                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                    id="floatingInput" 
                                    placeholder="Digite um bom nome para sua categoria" 
                                    value={name} 
                                    onChange={(e) => { 
                                        setName(e.target.value);
                                        if (errors.name) setErrors({...errors, name: undefined});
                                    }} 
                                />
                                <label htmlFor="floatingInput">Nome</label>
                                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-floating">
                                <input 
                                    type="text" 
                                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                    id="description" 
                                    placeholder="Digite uma descrição para sua categoria" 
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
                                    placeholder="Buscar categorias..." 
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
                                    <th>Nome</th>
                                    <th>Descrição</th>
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
                                ) : filteredCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="text-center py-4">
                                            Nenhuma categoria encontrada
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCategories.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.description}</td>
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