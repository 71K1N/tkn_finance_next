"use client"
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, ExternalLink, ShoppingBag, DollarSign, Tag, Link as LinkIcon } from 'react-feather';
import "bootstrap/dist/css/bootstrap.min.css";

interface WishlistItem {
    id: number;
    name: string;
    price: number;
    link: string;
    notes: string;
    listId: number;
    isBought: boolean;
}

interface Wishlist {
    id: number;
    name: string;
    items: WishlistItem[];
}

export default function WishlistPage() {
    const [wishlists, setWishlists] = useState<Wishlist[]>([]);
    const [selectedList, setSelectedList] = useState<Wishlist | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        link: '',
        notes: '',
        listId: 0
    });
    const [listFormData, setListFormData] = useState({
        name: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Função para calcular o total de uma lista
    function calculateListTotal(items: WishlistItem[]): number {
        return items.reduce((total, item) => total + item.price, 0);
    }

    // Função para calcular o total de itens não comprados
    function calculateNotBoughtTotal(items: WishlistItem[]): number {
        return items.reduce((total, item) => total + (item.isBought ? 0 : item.price), 0);
    }

    // Função para calcular o total de todas as listas
    function calculateTotalAllLists(): number {
        return wishlists.reduce((total, list) => total + calculateListTotal(list.items), 0);
    }

    // Função para calcular o total de itens não comprados em todas as listas
    function calculateTotalNotBought(): number {
        return wishlists.reduce((total, list) => total + calculateNotBoughtTotal(list.items), 0);
    }

    // Função para formatar valores monetários
    function formatCurrency(value: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    // Função para adicionar nova lista
    function handleAddList() {
        const newList: Wishlist = {
            id: Date.now(),
            name: listFormData.name,
            items: []
        };
        setWishlists([...wishlists, newList]);
        setListFormData({ name: '' });
        setIsModalOpen(false);
    }

    // Função para adicionar novo item
    function handleAddItem() {
        if (!selectedList) return;

        const newItem: WishlistItem = {
            id: Date.now(),
            name: formData.name,
            price: parseFloat(formData.price),
            link: formData.link,
            notes: formData.notes,
            listId: selectedList.id,
            isBought: false
        };

        const updatedList = {
            ...selectedList,
            items: [...selectedList.items, newItem]
        };

        setWishlists(wishlists.map(list => 
            list.id === selectedList.id ? updatedList : list
        ));
        setSelectedList(updatedList);
        setFormData({ name: '', price: '', link: '', notes: '', listId: 0 });
        setIsItemModalOpen(false);
    }

    // Função para remover item
    function handleRemoveItem(itemId: number) {
        if (!selectedList) return;

        const updatedList = {
            ...selectedList,
            items: selectedList.items.filter(item => item.id !== itemId)
        };

        setWishlists(wishlists.map(list => 
            list.id === selectedList.id ? updatedList : list
        ));
        setSelectedList(updatedList);
    }

    // Função para remover lista
    function handleRemoveList(listId: number) {
        setWishlists(wishlists.filter(list => list.id !== listId));
        if (selectedList?.id === listId) {
            setSelectedList(null);
        }
    }

    // Função para alternar status de compra do item
    function handleToggleBought(itemId: number) {
        if (!selectedList) return;

        const updatedList = {
            ...selectedList,
            items: selectedList.items.map(item => 
                item.id === itemId ? { ...item, isBought: !item.isBought } : item
            )
        };

        setWishlists(wishlists.map(list => 
            list.id === selectedList.id ? updatedList : list
        ));
        setSelectedList(updatedList);
    }

    // Função para extrair informações do produto da URL
    async function extractProductInfo(url: string) {
        try {
            setIsImporting(true);
            
            // Aqui você pode implementar a lógica para diferentes lojas
            // Por enquanto, vamos simular com dados básicos
            const productInfo = {
                name: 'Produto Importado',
                price: 0,
                link: url,
                notes: 'Importado automaticamente'
            };

            // Preencher o formulário com as informações
            setFormData({
                ...formData,
                name: productInfo.name,
                price: productInfo.price.toString(),
                link: productInfo.link,
                notes: productInfo.notes
            });

            setIsImportModalOpen(false);
            setIsItemModalOpen(true);
        } catch (error) {
            console.error('Erro ao importar produto:', error);
            alert('Não foi possível importar o produto. Verifique a URL e tente novamente.');
        } finally {
            setIsImporting(false);
        }
    }

    return (
        <main className="container-fluid py-4">
            <div className="row mb-4">
                <div className="col">
                    <h2 className="mb-0">Listas de Desejos</h2>
                    <p className="text-muted">Gerencie suas listas de desejos e itens</p>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="flex-shrink-0">
                                    <div className="bg-primary bg-opacity-10 p-3 rounded">
                                        <ShoppingBag className="text-primary" size={24} />
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="card-title mb-0">Total de Listas</h6>
                                    <h3 className="mb-0 mt-2">{wishlists.length}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="flex-shrink-0">
                                    <div className="bg-success bg-opacity-10 p-3 rounded">
                                        <DollarSign className="text-success" size={24} />
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="card-title mb-0">Valor Total</h6>
                                    <h3 className="mb-0 mt-2">{formatCurrency(calculateTotalAllLists())}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="flex-shrink-0">
                                    <div className="bg-warning bg-opacity-10 p-3 rounded">
                                        <DollarSign className="text-warning" size={24} />
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="card-title mb-0">A Comprar</h6>
                                    <h3 className="mb-0 mt-2">{formatCurrency(calculateTotalNotBought())}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                                <div className="flex-shrink-0">
                                    <div className="bg-info bg-opacity-10 p-3 rounded">
                                        <Tag className="text-info" size={24} />
                                    </div>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h6 className="card-title mb-0">Total de Itens</h6>
                                    <h3 className="mb-0 mt-2">
                                        {wishlists.reduce((total, list) => total + list.items.length, 0)}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Desejos e Itens */}
            <div className="row">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="card-title mb-0">Minhas Listas</h5>
                                <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                            <div className="list-group">
                                {wishlists.map(list => (
                                    <button
                                        key={list.id}
                                        className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                                            selectedList?.id === list.id ? 'active' : ''
                                        }`}
                                        onClick={() => setSelectedList(list)}
                                    >
                                        <div>
                                            <h6 className="mb-1">{list.name}</h6>
                                            <small className="text-muted">
                                                {list.items.length} itens • Total: {formatCurrency(calculateListTotal(list.items))}
                                                <br />
                                                A comprar: {formatCurrency(calculateNotBoughtTotal(list.items))}
                                            </small>
                                        </div>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveList(list.id);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-8">
                    {selectedList ? (
                        <div className="card border-0 shadow-sm">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <div>
                                        <h5 className="card-title mb-1">{selectedList.name}</h5>
                                        <p className="text-muted mb-0">
                                            Total: {formatCurrency(calculateListTotal(selectedList.items))}
                                        </p>
                                    </div>
                                    <div>
                                        <button 
                                            className="btn btn-outline-primary me-2"
                                            onClick={() => setIsImportModalOpen(true)}
                                        >
                                            <ExternalLink size={18} className="me-1" />
                                            Importar Produto
                                        </button>
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => setIsItemModalOpen(true)}
                                        >
                                            <Plus size={18} className="me-1" />
                                            Adicionar Item
                                        </button>
                                    </div>
                                </div>
                                <div className="table-responsive">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Nome</th>
                                                <th>Preço</th>
                                                <th>Link</th>
                                                <th>Observações</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedList.items.map(item => (
                                                <tr key={item.id} className={item.isBought ? 'table-success' : ''}>
                                                    <td>
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={item.isBought}
                                                                onChange={() => handleToggleBought(item.id)}
                                                            />
                                                            <label className="form-check-label">
                                                                {item.name}
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>{formatCurrency(item.price)}</td>
                                                    <td>
                                                        {item.link && (
                                                            <a 
                                                                href={item.link} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="btn btn-sm btn-outline-primary"
                                                            >
                                                                <ExternalLink size={16} />
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td>{item.notes}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleRemoveItem(item.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm">
                            <div className="card-body text-center py-5">
                                <ShoppingBag size={48} className="text-muted mb-3" />
                                <h5>Selecione uma lista ou crie uma nova</h5>
                                <p className="text-muted">Comece organizando seus desejos em listas</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Nova Lista */}
            {isModalOpen && (
                <div className="modal fade show" style={{ display: 'block' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Nova Lista de Desejos</h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setIsModalOpen(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Nome da Lista</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={listFormData.name}
                                        onChange={(e) => setListFormData({ name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={handleAddList}
                                >
                                    Criar Lista
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Novo Item */}
            {isItemModalOpen && (
                <div className="modal fade show" style={{ display: 'block' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Novo Item</h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setIsItemModalOpen(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Nome do Item</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Preço</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Link</label>
                                    <input
                                        type="url"
                                        className="form-control"
                                        value={formData.link}
                                        onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Observações</label>
                                    <textarea
                                        className="form-control"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setIsItemModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={handleAddItem}
                                >
                                    Adicionar Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Importar Produto */}
            {isImportModalOpen && (
                <div className="modal fade show" style={{ display: 'block' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Importar Produto</h5>
                                <button 
                                    type="button" 
                                    className="btn-close"
                                    onClick={() => setIsImportModalOpen(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">URL do Produto</label>
                                    <input
                                        type="url"
                                        className="form-control"
                                        placeholder="Cole a URL do produto aqui"
                                        value={importUrl}
                                        onChange={(e) => setImportUrl(e.target.value)}
                                    />
                                    <small className="text-muted">
                                        Suporta URLs de lojas online como Amazon, Mercado Livre, etc.
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary"
                                    onClick={() => setIsImportModalOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={() => extractProductInfo(importUrl)}
                                    disabled={isImporting || !importUrl}
                                >
                                    {isImporting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Importando...
                                        </>
                                    ) : (
                                        'Importar'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
} 