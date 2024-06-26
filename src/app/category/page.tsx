"use client"
import { useEffect, useState } from "react";
import { Trash2, Edit } from 'react-feather';
import swal from 'sweetalert';

export default function PageCategory() {
    const apiUrl = "http://localhost:8081"
    // const [count, setCount] = useState(0);
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [id, setId] = useState<number>(0);

    const [categories, setCategories] = useState<any[]>([])

    async function getAll() {
        let response = await fetch(apiUrl + '/category', { method: "GET" })
        setCategories(await response.json());
    }

    function handleSubmit() {
        id>0?update():store();
    }

    async function store() {
        const category = { name, description }
        let response = await fetch(apiUrl + "/category", {
            method: "POST", 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(category)
        })
        clearForm();
        getAll();

    }

    async function update() {
        const category = { name, description }
        let response = await fetch(`${apiUrl}/category/${id}`, {
            method: "PATCH", 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(category)
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
                let response = fetch(`${apiUrl}/category/${id}`,{method:'DELETE'}).then(()=>{
                    swal("Excluido!", "Excluido com sucesso!", "success");
                    getAll();

                });
                    

            }
          });
    }

    function edit(item:any) {
        console.log(item);
        setId(item.id);
        setName(item.name);
        setDescription(item.description);
    }

    function clearForm() {
        setId(0);
        setName("");
        setDescription("");
        
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
                        <div className="col-md-6">
                            <div className="form-floating mb-1">
                                <input type="hidden" name="id" value={id} onInput={(e) => { setId(Number((e.target as HTMLInputElement).value)) }}  />
                                <input type="text" className="form-control" id="floatingInput" placeholder="Digite um bom nome para sua categoria" value={name} onInput={(e) => { setName((e.target as HTMLInputElement).value) }} />
                                <label htmlFor="floatingInput">Nome</label>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="form-floating mb-6">
                                <input type="text" name="description" id="description" className="form-control" placeholder="Digite uma descricao para sua categoria " value={description} onInput={e => { setDescription((e.target as HTMLInputElement).value) }} />
                                <label htmlFor="description">Descricao</label>
                            </div>
                        </div>
                    </div>
                    <div className="row">
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
                                        <td>Descricao</td>
                                        <td>Acoes</td>
                                    </tr>
                                </thead>
                                <tbody>                                    
                                    {
                                        categories.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.name}</td>
                                                <td>{item.description}</td>
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