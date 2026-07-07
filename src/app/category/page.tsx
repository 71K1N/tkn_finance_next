"use client"
import { useRef, useState } from "react";
import { Edit, Trash2, Save, X } from 'react-feather';
import swal from 'sweetalert';
import { Button, DataTable, type DataTableColumn, type DataTableAction, type DataTableHandle } from "tikin-ds";
import { Box, Card, Container, Field, Heading, Input, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { createCategory, getCategories, removeCategory, updateCategory } from "@/lib/api/category";
import type { Category } from "@/lib/types/category";

export default function PageCategory() {
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [id, setId] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<{name?: string, description?: string}>({});
    const tableRef = useRef<DataTableHandle>(null);

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
            text: id ? "Deseja atualizar esta categoria?" : "Deseja criar uma nova categoria?",
            icon: "question",
            buttons: ["Cancelar", "Confirmar"],
        }).then((willProceed) => {
            if (willProceed) {
                id ? update() : store();
            }
        });
    }

    async function store() {
        setLoading(true);
        try {
            await createCategory({ name, description });
            swal("Sucesso!", "Categoria criada com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível criar a categoria", "error");
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        setLoading(true);
        try {
            await updateCategory(id, { name, description });
            swal("Sucesso!", "Categoria atualizada com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível atualizar a categoria", "error");
        } finally {
            setLoading(false);
        }
    }

    async function remove(item: Category) {
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
                    await removeCategory(item.id);
                    swal("Sucesso!", "Categoria excluída com sucesso!", "success");
                    tableRef.current?.refetch();
                } catch (error) {
                    swal("Erro!", "Não foi possível excluir a categoria", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    }

    function edit(item: Category) {
        setId(item.id);
        setName(item.name);
        setDescription(item.description);
    }

    function clearForm() {
        setId("");
        setName("");
        setDescription("");
        setErrors({});
    }

    const columns: DataTableColumn<Category>[] = [
        { key: "name", header: "Nome", sortable: true, },
        { key: "description", header: "Descrição", },
    ];

    const actions: DataTableAction<Category>[] = [
        { label: "Editar", icon: <Edit size={16} />, onClick: edit },
        { label: "Excluir", icon: <Trash2 size={16} />, variant: "danger", onClick: remove },
    ];

    return (
        <Container maxW="6xl" py={8}>
            <Box mb={6}>
                <Heading size="5xl">Categorias</Heading>
                <Text color="fg.muted">Gerencie suas categorias de forma simples e eficiente</Text>
            </Box>

            <Card.Root mb={6}>
                <Card.Body>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        <Field.Root invalid={!!errors.name}>
                            <Field.Label>Nome</Field.Label>
                            <Input
                                placeholder="Digite um bom nome para sua categoria"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) setErrors({...errors, name: undefined});
                                }}
                            />
                            {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root invalid={!!errors.description}>
                            <Field.Label>Descrição</Field.Label>
                            <Input
                                placeholder="Digite uma descrição para sua categoria"
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                    if (errors.description) setErrors({...errors, description: undefined});
                                }}
                            />
                            {errors.description && <Field.ErrorText>{errors.description}</Field.ErrorText>}
                        </Field.Root>
                    </SimpleGrid>
                    <Stack direction="row" gap={2} mt={4}>
                        <Button colorPalette="primary" onClick={handleSubmit} disabled={loading}>
                            <Save size={16} />
                            {id ? 'Atualizar' : 'Salvar'}
                        </Button>
                        <Button variant="outline" onClick={clearForm} disabled={loading}>
                            <X size={16} />
                            Cancelar
                        </Button>
                    </Stack>
                </Card.Body>
            </Card.Root>

            <Card.Root>
                <Card.Body>
                    <DataTable<Category>
                        ref={tableRef}
                        columns={columns}
                        actions={actions}
                        rowKey={(row) => row.id}
                        enableSearch
                        searchPlaceholder="Buscar categorias..."
                        emptyMessage="Nenhuma categoria encontrada"
                        errorMessage="Não foi possível carregar as categorias"
                        onDataLoading={getCategories}
                    />
                </Card.Body>
            </Card.Root>
        </Container>
    )
}
