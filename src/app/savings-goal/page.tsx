"use client"
import { useRef, useState } from "react";
import { Edit, Trash2, Save, X, ArrowDownCircle, ArrowUpCircle } from 'react-feather';
import swal from 'sweetalert';
import { Button, DataTable, type DataTableColumn, type DataTableAction, type DataTableHandle } from "tikin-ds";
import { Box, Card, Container, Dialog, Field, Heading, Input, Portal, Progress, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import {
    createSavingsGoal,
    depositSavingsGoal,
    getSavingsGoals,
    removeSavingsGoal,
    updateSavingsGoal,
    withdrawSavingsGoal,
} from "@/lib/api/savings-goal";
import type { SavingsGoal } from "@/lib/types/savings-goal";

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

export default function PageSavingsGoal() {
    const [id, setId] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [targetAmount, setTargetAmount] = useState<number>(0);
    const [monthlyAllocation, setMonthlyAllocation] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<{name?: string, targetAmount?: string, monthlyAllocation?: string}>({});
    const tableRef = useRef<DataTableHandle>(null);

    const [movementTarget, setMovementTarget] = useState<SavingsGoal | null>(null);
    const [movementType, setMovementType] = useState<'deposit' | 'withdraw'>('deposit');
    const [movementAmount, setMovementAmount] = useState<number>(0);

    function validateForm() {
        const newErrors: {name?: string, targetAmount?: string, monthlyAllocation?: string} = {};
        if (!name.trim()) newErrors.name = "Nome é obrigatório";
        if (!targetAmount || targetAmount <= 0) newErrors.targetAmount = "Valor alvo deve ser positivo";
        if (!monthlyAllocation || monthlyAllocation <= 0) newErrors.monthlyAllocation = "Aporte mensal deve ser positivo";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit() {
        if (!validateForm()) return;

        swal({
            title: "Confirmar",
            text: id ? "Deseja atualizar esta meta?" : "Deseja criar uma nova meta de poupança?",
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
            await createSavingsGoal({ name, targetAmount, monthlyAllocation });
            swal("Sucesso!", "Meta criada com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível criar a meta", "error");
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        setLoading(true);
        try {
            await updateSavingsGoal(id, { name, targetAmount, monthlyAllocation });
            swal("Sucesso!", "Meta atualizada com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível atualizar a meta", "error");
        } finally {
            setLoading(false);
        }
    }

    async function remove(item: SavingsGoal) {
        swal({
            title: "Confirmação",
            text: "Tem certeza que deseja excluir esta meta?",
            icon: "warning",
            dangerMode: true,
            buttons: ["Cancelar", "Excluir"],
        }).then(async (willDelete) => {
            if (willDelete) {
                setLoading(true);
                try {
                    await removeSavingsGoal(item.id);
                    swal("Sucesso!", "Meta excluída com sucesso!", "success");
                    tableRef.current?.refetch();
                } catch (error) {
                    swal("Erro!", "Não foi possível excluir a meta", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    }

    function edit(item: SavingsGoal) {
        setId(item.id);
        setName(item.name);
        setTargetAmount(item.targetAmount);
        setMonthlyAllocation(item.monthlyAllocation);
    }

    function clearForm() {
        setId("");
        setName("");
        setTargetAmount(0);
        setMonthlyAllocation(0);
        setErrors({});
    }

    function openMovement(item: SavingsGoal, type: 'deposit' | 'withdraw') {
        setMovementTarget(item);
        setMovementType(type);
        setMovementAmount(0);
    }

    async function confirmMovement() {
        if (!movementTarget || !movementAmount || movementAmount <= 0) return;
        setLoading(true);
        try {
            if (movementType === 'deposit') {
                await depositSavingsGoal(movementTarget.id, movementAmount);
            } else {
                await withdrawSavingsGoal(movementTarget.id, movementAmount);
            }
            swal("Sucesso!", movementType === 'deposit' ? "Depósito registrado!" : "Saque registrado!", "success");
            setMovementTarget(null);
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível registrar o movimento", "error");
        } finally {
            setLoading(false);
        }
    }

    const columns: DataTableColumn<SavingsGoal>[] = [
        {
            key: "name",
            header: "Nome",
            sortable: true,
        },
        {
            key: "targetAmount",
            header: "Valor Alvo",
            sortable: true,
            render: (row) => formatCurrency(row.targetAmount),
        },
        {
            key: "currentSaved",
            header: "Progresso",
            sortable: true,
            render: (row) => (
                <Stack gap={1}>
                    <Text fontSize="sm">
                        {formatCurrency(row.currentSaved)} / {formatCurrency(row.targetAmount)}
                    </Text>
                    <Progress.Root value={Math.min(100, (row.currentSaved / row.targetAmount) * 100)} size="xs" colorPalette="green">
                        <Progress.Track>
                            <Progress.Range />
                        </Progress.Track>
                    </Progress.Root>
                </Stack>
            ),
        },
        {
            key: "monthlyAllocation",
            header: "Aporte Mensal",
            sortable: true,
            render: (row) => formatCurrency(row.monthlyAllocation),
        },
        {
            key: "projectedCompletionDate",
            header: "Previsão de Conclusão",
            sortable: true,
            render: (row) => (row.projectedCompletionDate ? new Date(row.projectedCompletionDate).toLocaleDateString('pt-BR') : "—"),
        },
    ];

    const actions: DataTableAction<SavingsGoal>[] = [
        { label: "Depositar", icon: <ArrowUpCircle size={16} />, onClick: (row) => openMovement(row, 'deposit') },
        { label: "Sacar", icon: <ArrowDownCircle size={16} />, onClick: (row) => openMovement(row, 'withdraw') },
        { label: "Editar", icon: <Edit size={16} />, onClick: edit },
        { label: "Excluir", icon: <Trash2 size={16} />, variant: "danger", onClick: remove },
    ];

    return (
        <Container maxW="6xl" py={8}>
            <Box mb={6}>
                <Heading size="5xl">Metas de Poupança</Heading>
                <Text color="fg.muted">Gerencie suas metas de poupança e acompanhe o progresso</Text>
            </Box>

            <Card.Root mb={6}>
                <Card.Body>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                        <Field.Root invalid={!!errors.name}>
                            <Field.Label>Nome</Field.Label>
                            <Input
                                placeholder="Ex: Viagem para a praia"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if (errors.name) setErrors({...errors, name: undefined});
                                }}
                            />
                            {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root invalid={!!errors.targetAmount}>
                            <Field.Label>Valor Alvo</Field.Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={targetAmount || ""}
                                onChange={(e) => {
                                    setTargetAmount(Number(e.target.value));
                                    if (errors.targetAmount) setErrors({...errors, targetAmount: undefined});
                                }}
                            />
                            {errors.targetAmount && <Field.ErrorText>{errors.targetAmount}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root invalid={!!errors.monthlyAllocation}>
                            <Field.Label>Aporte Mensal</Field.Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={monthlyAllocation || ""}
                                onChange={(e) => {
                                    setMonthlyAllocation(Number(e.target.value));
                                    if (errors.monthlyAllocation) setErrors({...errors, monthlyAllocation: undefined});
                                }}
                            />
                            {errors.monthlyAllocation && <Field.ErrorText>{errors.monthlyAllocation}</Field.ErrorText>}
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
                    <DataTable<SavingsGoal>
                        ref={tableRef}
                        columns={columns}
                        actions={actions}
                        rowKey={(row) => row.id}
                        enableSearch
                        searchPlaceholder="Buscar metas..."
                        emptyMessage="Nenhuma meta encontrada"
                        errorMessage="Não foi possível carregar as metas"
                        onDataLoading={getSavingsGoals}
                    />
                </Card.Body>
            </Card.Root>

            <Dialog.Root open={!!movementTarget} onOpenChange={(e) => { if (!e.open) setMovementTarget(null); }}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{movementType === 'deposit' ? 'Registrar Depósito' : 'Registrar Saque'}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Text mb={4}>
                                    <strong>Meta:</strong> {movementTarget?.name} ({movementTarget ? formatCurrency(movementTarget.targetAmount) : ''})<br />
                                    <strong>Saldo atual:</strong> {movementTarget ? formatCurrency(movementTarget.currentSaved) : ''}
                                </Text>
                                <Field.Root>
                                    <Field.Label>Valor</Field.Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={movementAmount || ""}
                                        onChange={(e) => setMovementAmount(Number(e.target.value))}
                                    />
                                </Field.Root>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Button variant="outline" onClick={() => setMovementTarget(null)} disabled={loading}>Cancelar</Button>
                                <Button colorPalette="primary" onClick={confirmMovement} disabled={loading}>Confirmar</Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </Container>
    )
}
