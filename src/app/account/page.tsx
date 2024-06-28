"use client"
import { useEffect, useState } from "react";
import { Trash2, Edit } from 'react-feather';
import swal from 'sweetalert';

export default function PageAccount() {
    const apiUrl = "http://localhost:8081"
    const [description, setDescription] = useState<string>("");
    const [id, setId] = useState<number>(0);
    const [balance, setBalance] = useState<number>(0);

    const [accounts, setAccounts] = useState<any[]>([])

    async function getAll() {
        let response = await fetch(apiUrl + '/bank-account', { method: "GET" })
        setAccounts(await response.json());
    }

    function handleSubmit() {
        id>0?update():store();
    }

    async function store() {
        const data = { description, balance }
        let response = await fetch(apiUrl + "/bank-account", {
            method: "POST", 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(data)
        })
        clearForm();
        getAll();

    }

    async function update() {
        const data = { description, balance}
        let response = await fetch(`${apiUrl}/bank-account/${id}`, {
            method: "PATCH", 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(data)
        })
        clearForm();
        getAll();

    }

    async function remove(id:number) {
        swal({
            title: "Confirmacao?",
            text: "Confirma a exclusao do item?",
            icon: "warning",
            dangerMode: true,
          })
          .then(willDelete => {
            if (willDelete) {
                let response = fetch(`${apiUrl}/bank-account/${id}`,{method:'DELETE'}).then(()=>{
                    swal("Excluido!", "Excluido com sucesso!", "success");
                    getAll();

                });
                    

            }
          });
    }

    function edit(item:any) {
        console.log(item);
        setId(item.id);
        setDescription(item.description);
        setBalance(item.balance);
    }

    function clearForm() {
        setId(0);
        setDescription("");
        setBalance(0);
        
    }

    useEffect(() => {
        getAll()
    }, [])
    
    return (
        <div>
            <div className="row">
                <div className="col">
                    <h2>
                        Categoria
                    </h2>
                </div>
            </div>
            <div className="card">
                <div className="card-body">
                    <div className="row">                        
                        <div className="col-md-4">
                            <div className="form-floating mb-6">
                                <input type="text" name="description" id="description" className="form-control" placeholder="Digite uma descricao para sua categoria " value={description} onInput={e => { setDescription((e.target as HTMLInputElement).value) }} />
                                <label htmlFor="description">Descricao</label>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-floating mb-6">
                                <input type="number" name="balance" id="balance" className="form-control" placeholder="Digite o saldo da conta " value={balance?balance:""} onInput={e => { setBalance(Number((e.target as HTMLInputElement).value)) }} />
                                <label htmlFor="description">Saldo</label>
                            </div>
                        </div>
                    </div>
                    <div className="row mt-2">
                        <div className="col-md-6">
                            <button className="btn btn-primary">Buscar</button>
                            <button className="btn btn-warning mx-2" onClick={handleSubmit}>Salvar</button>
                            <button className="btn btn-danger" onClick={clearForm}>Cancelar</button>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-12">
                            <table className="table mt-4">
                                <thead className="table-dark">
                                    <tr>
                                        <td>Nome</td>
                                        <td>Saldo</td>
                                        <td>Acoes</td>
                                    </tr>
                                </thead>
                                <tbody>                                    
                                    {
                                        accounts.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.description}</td>
                                                <td>{item.balance}</td>
                                                <td>
                                                    <div className="btn-group" role="group">
                                                        <div className="btn btn-outline-secondary" onClick={()=>{edit(item)}}><Edit/></div>
                                                        <div className="btn btn-outline-secondary" onClick={()=>{remove(item.id)}}><Trash2/></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}