"use client"
import { useEffect, useState } from "react";
import { Trash2, Edit, Search, Save, X } from 'react-feather';
import swal from 'sweetalert';

export default function PageSubCategory() {
    const apiUrl = "http://localhost:8081"
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [id, setId] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [subcategories, setSubcategories] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number>(0);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [errors, setErrors] = useState<{name?: string, description?: string, category?: string}>({});

    async function getAll() {
        setLoading(true);
        try {
            const [subcategoriesResponse, categoriesResponse] = await Promise.all([
                fetch(apiUrl + '/subcategory', { method: "GET" }),
                fetch(apiUrl + '/category', { method: "GET" })
            ]);
            
            const subcategoriesData = await subcategoriesResponse.json();
            const categoriesData = await categoriesResponse.json();
            
            setSubcategories(subcategoriesData);
            setCategories(categoriesData);
        } catch (error) {
            swal("Erro!", "Não foi possível carregar os dados", "error");
        } finally {
            setLoading(false);
        }
    }

    function validateForm() {
        const newErrors: {name?: string, description?: string, category?: string} = {};
        if (!name.trim()) {
            newErrors.name = "Nome é obrigatório";
        }
        if (!description.trim()) {
            newErrors.description = "Descrição é obrigatória";
        }
        if (!selectedCategory) {
            newErrors.category = "Categoria é obrigatória";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit() {
        if (!validateForm()) return;
        
        swal({
            title: "Confirmar",
            text: id > 0 ? "Deseja atualizar esta subcategoria?" : "Deseja criar uma nova subcategoria?",
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
            const subcategory = { name, description, categoryId: selectedCategory }
            await fetch(apiUrl + "/subcategory", {
                method: "POST", 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(subcategory)
            });
            swal("Sucesso!", "Subcategoria criada com sucesso!", "success");
            clearForm();
            getAll();
        } catch (error) {
            swal("Erro!", "Não foi possível criar a subcategoria", "error");
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        setLoading(true);
        try {
            const subcategory = { name, description, categoryId: selectedCategory }
            await fetch(`${apiUrl}/subcategory/${id}`, {
                method: "PATCH", 
                headers: {'Content-Type': 'application/json'}, 
                body: JSON.stringify(subcategory)
            });
            swal("Sucesso!", "Subcategoria atualizada com sucesso!", "success");
            clearForm();
            getAll();
        } catch (error) {
            swal("Erro!", "Não foi possível atualizar a subcategoria", "error");
        } finally {
            setLoading(false);
        }
    }

    async function remove(id:number) {
        swal({
            title: "Confirmação",
            text: "Tem certeza que deseja excluir esta subcategoria?",
            icon: "warning",
            dangerMode: true,
            buttons: ["Cancelar", "Excluir"],
        }).then(async (willDelete) => {
            if (willDelete) {
                setLoading(true);
                try {
                    await fetch(`${apiUrl}/subcategory/${id}`, {method:'DELETE'});
                    swal("Sucesso!", "Subcategoria excluída com sucesso!", "success");
                    getAll();
                } catch (error) {
                    swal("Erro!", "Não foi possível excluir a subcategoria", "error");
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
        setSelectedCategory(item.categoryId);
    }

    function clearForm() {
        setId(0);
        setName("");
        setDescription("");
        setSelectedCategory(0);
        setErrors({});
    }

    const filteredSubcategories = subcategories.filter(subcategory => 
        subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subcategory.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        categories.find(cat => cat.id === subcategory.categoryId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        getAll()
    }, [])
    
    return (
        <div className="container-fluid py-4">
            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Subcategorias</h2>
                    <p className="text-muted">Gerencie suas subcategorias de forma simples e eficiente</p>
                </div>
            </div>
            <div className="card shadow-sm">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <div className="form-floating">
                                <select 
                                    className={`form-select ${errors.category ? 'is-invalid' : ''}`}
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(Number(e.target.value));
                                        if (errors.category) setErrors({...errors, category: undefined});
                                    }}
                                >
                                    <option value="0">Selecione uma categoria</option>
                                    {categories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <label>Categoria</label>
                                {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-floating">
                                <input 
                                    type="text" 
                                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                    id="floatingInput" 
                                    placeholder="Digite um bom nome para sua subcategoria" 
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
                        <div className="col-md-4">
                            <div className="form-floating">
                                <input 
                                    type="text" 
                                    className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                    id="description" 
                                    placeholder="Digite uma descrição para sua subcategoria" 
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
                                    placeholder="Buscar subcategorias..." 
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
                                    <th>Categoria</th>
                                    <th>Nome</th>
                                    <th>Descrição</th>
                                    <th className="text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody>                                    
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4">
                                            <div className="spinner-border text-primary" role="status">
                                                <span className="visually-hidden">Carregando...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredSubcategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4">
                                            Nenhuma subcategoria encontrada
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubcategories.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                {categories.find(cat => cat.id === item.categoryId)?.name || 'Categoria não encontrada'}
                                            </td>
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