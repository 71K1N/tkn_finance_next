"use client"
import { useRef, useState } from "react";
import { Edit, Trash2, Save, X } from 'react-feather';
import swal from 'sweetalert';
import { Button, DataTable, type DataTableColumn, type DataTableAction, type DataTableHandle } from "tikin-ds";
import { Box, Card, Container, Field, Heading, Input, NativeSelect, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import StatusBadge from "@/components/StatusBadge";
import { createWishItem, getWishItems, removeWishItem, updateWishItem, updateWishItemStatus } from "@/lib/api/wish-item";
import type { WishItem, WishItemPriority, WishItemStatus } from "@/lib/types/wish-item";
import { formatCurrency } from "@/lib/utils/currency";
import MoneyInput from "@/components/common/MoneyInput";

const STATUS_LABEL: Record<WishItemStatus, string> = {
    active: "Ativo",
    completed: "Concluído",
    abandoned: "Abandonado",
    on_hold: "Em espera",
};

const STATUS_COLOR: Record<WishItemStatus, string> = {
    active: "blue",
    completed: "green",
    abandoned: "gray",
    on_hold: "yellow",
};

const PRIORITY_LABEL: Record<WishItemPriority, string> = {
    low: "Baixa",
    medium: "Média",
    high: "Alta",
};

function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR');
}

export default function PageWishlist() {
    const [id, setId] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [estimatedCost, setEstimatedCost] = useState<number>(0);
    const [targetDate, setTargetDate] = useState<string>("");
    const [priority, setPriority] = useState<WishItemPriority>("medium");
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<{name?: string, estimatedCost?: string, targetDate?: string}>({});
    const tableRef = useRef<DataTableHandle>(null);

    function validateForm() {
        const newErrors: {name?: string, estimatedCost?: string, targetDate?: string} = {};
        if (!name.trim()) newErrors.name = "Nome é obrigatório";
        if (!estimatedCost || estimatedCost <= 0) newErrors.estimatedCost = "Custo estimado deve ser positivo";
        if (!targetDate.trim()) newErrors.targetDate = "Data alvo é obrigatória";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit() {
        if (!validateForm()) return;

        swal({
            title: "Confirmar",
            text: id ? "Deseja atualizar este item?" : "Deseja criar um novo item?",
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
            await createWishItem({ name, estimatedCost, targetDate, priority });
            swal("Sucesso!", "Item criado com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível criar o item", "error");
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        setLoading(true);
        try {
            await updateWishItem(id, { name, estimatedCost, targetDate, priority });
            swal("Sucesso!", "Item atualizado com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível atualizar o item", "error");
        } finally {
            setLoading(false);
        }
    }

    async function remove(item: WishItem) {
        swal({
            title: "Confirmação",
            text: "Tem certeza que deseja excluir este item?",
            icon: "warning",
            dangerMode: true,
            buttons: ["Cancelar", "Excluir"],
        }).then(async (willDelete) => {
            if (willDelete) {
                setLoading(true);
                try {
                    await removeWishItem(item.id);
                    swal("Sucesso!", "Item excluído com sucesso!", "success");
                    tableRef.current?.refetch();
                } catch (error) {
                    swal("Erro!", "Não foi possível excluir o item", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    }

    async function changeStatus(item: WishItem, status: WishItemStatus) {
        try {
            await updateWishItemStatus(item.id, status);
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível atualizar o status", "error");
        }
    }

    function edit(item: WishItem) {
        setId(item.id);
        setName(item.name);
        setEstimatedCost(item.estimatedCost);
        setTargetDate(item.targetDate.slice(0, 10));
        setPriority(item.priority);
    }

    function clearForm() {
        setId("");
        setName("");
        setEstimatedCost(0);
        setTargetDate("");
        setPriority("medium");
        setErrors({});
    }

    const columns: DataTableColumn<WishItem>[] = [
        { key: "name", header: "Nome", sortable: true },
        {
            key: "estimatedCost",
            header: "Custo Estimado",
            sortable: true,
            render: (row) => formatCurrency(row.estimatedCost),
        },
        {
            key: "targetDate",
            header: "Data Alvo",
            sortable: true,
            render: (row) => formatDate(row.targetDate),
        },
        {
            key: "priority",
            header: "Prioridade",
            filterable: true,
            render: (row) => <StatusBadge status={row.priority === 'high' ? 'danger' : row.priority === 'medium' ? 'warning' : 'neutral'}>{PRIORITY_LABEL[row.priority]}</StatusBadge>,
        },
        {
            key: "status",
            header: "Status",
            filterable: true,
            render: (row) => (
                <NativeSelect.Root size="sm" width="140px">
                    <NativeSelect.Field
                        value={row.status}
                        onChange={(e) => changeStatus(row, e.target.value as WishItemStatus)}
                    >
                        {Object.entries(STATUS_LABEL).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
            ),
        },
    ];

    const actions: DataTableAction<WishItem>[] = [
        { label: "Editar", icon: <Edit size={16} />, onClick: edit },
        { label: "Excluir", icon: <Trash2 size={16} />, variant: "danger", onClick: remove },
    ];

    return (
        <Container maxW="6xl" py={8}>
            <Box mb={6}>
                <Heading size="5xl">Lista de Desejos</Heading>
                <Text color="fg.muted">Gerencie seus itens de desejo e acompanhe o progresso</Text>
            </Box>

            <Card.Root mb={6}>
                <Card.Body>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                        <Field.Root invalid={!!errors.name}>
                            <Field.Label>Nome</Field.Label>
                            <Input
                                value={name}
                                placeholder="Ex: Notebook novo"
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) setErrors({...errors, name: undefined});
                                }}
                            />
                            {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root invalid={!!errors.estimatedCost}>
                            <Field.Label>Custo Estimado</Field.Label>
                            <MoneyInput
                                value={estimatedCost}
                                onValueChange={(value) => {
                                    setEstimatedCost(value);
                                    if (errors.estimatedCost) setErrors({...errors, estimatedCost: undefined});
                                }}
                            />
                            {errors.estimatedCost && <Field.ErrorText>{errors.estimatedCost}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root invalid={!!errors.targetDate}>
                            <Field.Label>Data Alvo</Field.Label>
                            <Input
                                type="date"
                                value={targetDate}
                                onChange={(e) => {
                                    setTargetDate(e.target.value);
                                    if (errors.targetDate) setErrors({...errors, targetDate: undefined});
                                }}
                            />
                            {errors.targetDate && <Field.ErrorText>{errors.targetDate}</Field.ErrorText>}
                        </Field.Root>
                    </SimpleGrid>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} mt={4}>
                        <Field.Root>
                            <Field.Label>Prioridade</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field value={priority} onChange={(e) => setPriority(e.target.value as WishItemPriority)}>
                                    <option value="low">Baixa</option>
                                    <option value="medium">Média</option>
                                    <option value="high">Alta</option>
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
                    <DataTable<WishItem>
                        ref={tableRef}
                        columns={columns}
                        actions={actions}
                        rowKey={(row) => row.id}
                        enableSearch
                        searchPlaceholder="Buscar itens..."
                        emptyMessage="Nenhum item encontrado"
                        errorMessage="Não foi possível carregar os itens"
                        onDataLoading={getWishItems}
                    />
                </Card.Body>
            </Card.Root>
        </Container>
    )
}
