"use client"
import { useEffect, useRef, useState } from "react";
import { Edit, Trash2, Save, X } from 'react-feather';
import swal from 'sweetalert';
import { Button, DataTable, type DataTableColumn, type DataTableAction, type DataTableHandle } from "tikin-ds";
import { Box, Card, Container, Field, Heading, Input, NativeSelect, Progress, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { createBudget, getBudgets, removeBudget, updateBudget } from "@/lib/api/budget";
import { getCategories } from "@/lib/api/category";
import type { Budget, RolloverPolicy } from "@/lib/types/budget";
import type { Category } from "@/lib/types/category";
import { formatCurrency } from "@/lib/utils/currency";
import MoneyInput from "@/components/common/MoneyInput";

export default function PageBudget() {
    const [categoryId, setCategoryId] = useState<string>("");
    const [month, setMonth] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);
    const [rolloverPolicy, setRolloverPolicy] = useState<RolloverPolicy>("no_rollover");
    const [id, setId] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [errors, setErrors] = useState<{categoryId?: string, month?: string, amount?: string}>({});
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

    function categoryName(categoryId: string) {
        return categories.find((c) => c.id === categoryId)?.name ?? "Categoria não encontrada";
    }

    function validateForm() {
        const newErrors: {categoryId?: string, month?: string, amount?: string} = {};
        if (!categoryId.trim()) newErrors.categoryId = "Categoria é obrigatória";
        if (!month.trim()) newErrors.month = "Mês é obrigatório";
        if (!amount || amount <= 0) newErrors.amount = "Valor deve ser positivo";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit() {
        if (!validateForm()) return;

        swal({
            title: "Confirmar",
            text: id ? "Deseja atualizar este orçamento?" : "Deseja criar um novo orçamento?",
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
            await createBudget({ categoryId, month, amount, rolloverPolicy });
            swal("Sucesso!", "Orçamento criado com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível criar o orçamento", "error");
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        setLoading(true);
        try {
            await updateBudget(id, { amount, rolloverPolicy });
            swal("Sucesso!", "Orçamento atualizado com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível atualizar o orçamento", "error");
        } finally {
            setLoading(false);
        }
    }

    async function remove(item: Budget) {
        swal({
            title: "Confirmação",
            text: "Tem certeza que deseja excluir este orçamento?",
            icon: "warning",
            dangerMode: true,
            buttons: ["Cancelar", "Excluir"],
        }).then(async (willDelete) => {
            if (willDelete) {
                setLoading(true);
                try {
                    await removeBudget(item.id);
                    swal("Sucesso!", "Orçamento excluído com sucesso!", "success");
                    tableRef.current?.refetch();
                } catch (error) {
                    swal("Erro!", "Não foi possível excluir o orçamento", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    }

    function edit(item: Budget) {
        setId(item.id);
        setCategoryId(item.categoryId);
        setMonth(item.month);
        setAmount(item.amount);
        setRolloverPolicy(item.rolloverPolicy);
    }

    function clearForm() {
        setId("");
        setCategoryId("");
        setMonth("");
        setAmount(0);
        setRolloverPolicy("no_rollover");
        setErrors({});
    }

    const columns: DataTableColumn<Budget>[] = [
        { key: "month", header: "Mês", sortable: true },
        { key: "categoryId", header: "Categoria", render: (row) => categoryName(row.categoryId) },
        {
            key: "amount",
            header: "Valor",
            sortable: true,
            render: (row) => formatCurrency(row.amount),
        },
        {
            key: "spent",
            header: "Gasto",
            sortable: true,
            render: (row) => (
                <Stack gap={1}>
                    <Text fontSize="sm" color={row.spent > row.amount ? "red.solid" : "fg.default"}>
                        {formatCurrency(row.spent)} / {formatCurrency(row.amount)}
                    </Text>
                    <Progress.Root value={Math.min(100, (row.spent / row.amount) * 100)} size="xs" colorPalette={row.spent > row.amount ? "red" : "green"}>
                        <Progress.Track>
                            <Progress.Range />
                        </Progress.Track>
                    </Progress.Root>
                </Stack>
            ),
        },
        {
            key: "rolloverPolicy",
            header: "Política de Rollover",
            render: (row) => (row.rolloverPolicy === "carry_balance" ? "Acumula saldo" : "Sem acúmulo"),
        },
    ];

    const actions: DataTableAction<Budget>[] = [
        { label: "Editar", icon: <Edit size={16} />, onClick: edit },
        { label: "Excluir", icon: <Trash2 size={16} />, variant: "danger", onClick: remove },
    ];

    return (
        <Container maxW="6xl" py={8}>
            <Box mb={6}>
                <Heading size="5xl">Orçamentos</Heading>
                <Text color="fg.muted">Gerencie seus orçamentos mensais por categoria</Text>
            </Box>

            <Card.Root mb={6}>
                <Card.Body>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
                        <Field.Root invalid={!!errors.categoryId}>
                            <Field.Label>Categoria</Field.Label>
                            <NativeSelect.Root disabled={!!id}>
                                <NativeSelect.Field
                                    value={categoryId}
                                    onChange={(e) => {
                                        setCategoryId(e.target.value);
                                        if (errors.categoryId) setErrors({...errors, categoryId: undefined});
                                    }}
                                >
                                    <option value="">Selecione...</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                            {errors.categoryId && <Field.ErrorText>{errors.categoryId}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root invalid={!!errors.month}>
                            <Field.Label>Mês</Field.Label>
                            <Input
                                type="month"
                                value={month}
                                disabled={!!id}
                                onChange={(e) => {
                                    setMonth(e.target.value);
                                    if (errors.month) setErrors({...errors, month: undefined});
                                }}
                            />
                            {errors.month && <Field.ErrorText>{errors.month}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root invalid={!!errors.amount}>
                            <Field.Label>Valor</Field.Label>
                            <MoneyInput
                                value={amount}
                                onValueChange={(value) => {
                                    setAmount(value);
                                    if (errors.amount) setErrors({...errors, amount: undefined});
                                }}
                            />
                            {errors.amount && <Field.ErrorText>{errors.amount}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Rollover</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field
                                    value={rolloverPolicy}
                                    onChange={(e) => setRolloverPolicy(e.target.value as RolloverPolicy)}
                                >
                                    <option value="no_rollover">Sem acúmulo</option>
                                    <option value="carry_balance">Acumula saldo</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </Field.Root>
                    </SimpleGrid>
                    <Stack direction="row" gap={2} mt={4} wrap="wrap">
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
                    <DataTable<Budget>
                        ref={tableRef}
                        columns={columns}
                        actions={actions}
                        rowKey={(row) => row.id}
                        enableSearch
                        searchPlaceholder="Buscar orçamentos..."
                        emptyMessage="Nenhum orçamento encontrado"
                        errorMessage="Não foi possível carregar os orçamentos"
                        onDataLoading={getBudgets}
                    />
                </Card.Body>
            </Card.Root>
        </Container>
    )
}
