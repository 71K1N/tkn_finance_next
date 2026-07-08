"use client"
import { useEffect, useRef, useState } from "react";
import { Edit, Trash2, Save, X } from 'react-feather';
import swal from 'sweetalert';
import { Button, DataTable, type DataTableColumn, type DataTableAction, type DataTableHandle } from "tikin-ds";
import { Box, Card, Container, Field, Heading, Input, NativeSelect, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { createSubcategory, getSubcategories, removeSubcategory, updateSubcategory } from "@/lib/api/subcategory";
import { getCategories } from "@/lib/api/category";
import type { Subcategory } from "@/lib/types/subcategory";
import type { Category } from "@/lib/types/category";

export default function PageSubcategory() {
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [id, setId] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [errors, setErrors] = useState<{name?: string, description?: string, categoryId?: string}>({});
    const tableRef = useRef<DataTableHandle>(null);

    async function loadCategories() {
        try {
            const response = await getCategories({ page: 1, pageSize: 100 });
            setCategories(response.data);
        } catch (error) {
            swal("Erro!", "Não foi possível carregar as categorias", "error");
        }
    }

    useEffect(() => {
        loadCategories();
    }, []);

    function categoryName(id: string) {
        return categories.find((category) => category.id === id)?.name ?? "Categoria não encontrada";
    }

    function validateForm() {
        const newErrors: {name?: string, description?: string, categoryId?: string} = {};
        if (!name.trim()) {
            newErrors.name = "Nome é obrigatório";
        }
        if (!description.trim()) {
            newErrors.description = "Descrição é obrigatória";
        }
        if (!categoryId.trim()) {
            newErrors.categoryId = "Categoria é obrigatória";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit() {
        if (!validateForm()) return;

        swal({
            title: "Confirmar",
            text: id ? "Deseja atualizar esta subcategoria?" : "Deseja criar uma nova subcategoria?",
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
            await createSubcategory({ name, description, categoryId });
            swal("Sucesso!", "Subcategoria criada com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível criar a subcategoria", "error");
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        setLoading(true);
        try {
            await updateSubcategory(id, { name, description, categoryId });
            swal("Sucesso!", "Subcategoria atualizada com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível atualizar a subcategoria", "error");
        } finally {
            setLoading(false);
        }
    }

    async function remove(item: Subcategory) {
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
                    await removeSubcategory(item.id);
                    swal("Sucesso!", "Subcategoria excluída com sucesso!", "success");
                    tableRef.current?.refetch();
                } catch (error) {
                    swal("Erro!", "Não foi possível excluir a subcategoria", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    }

    function edit(item: Subcategory) {
        setId(item.id);
        setName(item.name);
        setDescription(item.description);
        setCategoryId(item.categoryId);
    }

    function clearForm() {
        setId("");
        setName("");
        setDescription("");
        setCategoryId("");
        setErrors({});
    }

    const columns: DataTableColumn<Subcategory>[] = [
        { key: "categoryId", header: "Categoria", render: (row) => categoryName(row.categoryId) },
        { key: "name", header: "Nome", sortable: true },
        { key: "description", header: "Descrição" },
    ];

    const actions: DataTableAction<Subcategory>[] = [
        { label: "Editar", icon: <Edit size={16} />, onClick: edit },
        { label: "Excluir", icon: <Trash2 size={16} />, variant: "danger", onClick: remove },
    ];

    return (
        <Container maxW="6xl" py={8}>
            <Box mb={6}>
                <Heading size="5xl">Subcategorias</Heading>
                <Text color="fg.muted">Gerencie suas subcategorias de forma simples e eficiente</Text>
            </Box>

            <Card.Root mb={6}>
                <Card.Body>
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                        <Field.Root invalid={!!errors.categoryId}>
                            <Field.Label>Categoria</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field
                                    value={categoryId}
                                    onChange={(e) => {
                                        setCategoryId(e.target.value);
                                        if (errors.categoryId) setErrors({...errors, categoryId: undefined});
                                    }}
                                >
                                    <option value="">Selecione uma categoria</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                            {errors.categoryId && <Field.ErrorText>{errors.categoryId}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root invalid={!!errors.name}>
                            <Field.Label>Nome</Field.Label>
                            <Input
                                placeholder="Digite um bom nome para sua subcategoria"
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
                                placeholder="Digite uma descrição para sua subcategoria"
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
                    <DataTable<Subcategory>
                        ref={tableRef}
                        columns={columns}
                        actions={actions}
                        rowKey={(row) => row.id}
                        enableSearch
                        searchPlaceholder="Buscar subcategorias..."
                        emptyMessage="Nenhuma subcategoria encontrada"
                        errorMessage="Não foi possível carregar as subcategorias"
                        onDataLoading={getSubcategories}
                    />
                </Card.Body>
            </Card.Root>
        </Container>
    )
}
