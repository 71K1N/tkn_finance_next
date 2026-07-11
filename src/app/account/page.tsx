"use client"
import { useRef, useState } from "react";
import { CreditCard, Edit, Trash2, Save, X } from 'react-feather';
import swal from 'sweetalert';
import { Button, DataTable, type DataTableColumn, type DataTableAction, type DataTableHandle } from "tikin-ds";
import { Box, Card, Container, Field, Heading, HStack, Input, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { createBankAccount, getBankAccounts, removeBankAccount, updateBankAccount } from "@/lib/api/bank-account";
import type { BankAccount } from "@/lib/types/bank-account";

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

export default function PageAccount() {
    const [description, setDescription] = useState<string>("");
    const [balance, setBalance] = useState<number>(0);
    const [id, setId] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [errors, setErrors] = useState<{description?: string, balance?: string}>({});
    const tableRef = useRef<DataTableHandle>(null);

    function validateForm() {
        const newErrors: {description?: string, balance?: string} = {};
        if (!description.trim()) {
            newErrors.description = "Descrição é obrigatória";
        }
        if (balance === undefined || balance === null) {
            newErrors.balance = "Saldo é obrigatório";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    function handleSubmit() {
        if (!validateForm()) return;

        swal({
            title: "Confirmar",
            text: id ? "Deseja atualizar esta conta?" : "Deseja criar uma nova conta?",
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
            await createBankAccount({ description, balance });
            swal("Sucesso!", "Conta criada com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível criar a conta", "error");
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        setLoading(true);
        try {
            await updateBankAccount(id, { description, balance });
            swal("Sucesso!", "Conta atualizada com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível atualizar a conta", "error");
        } finally {
            setLoading(false);
        }
    }

    async function remove(item: BankAccount) {
        swal({
            title: "Confirmação",
            text: "Tem certeza que deseja excluir esta conta?",
            icon: "warning",
            dangerMode: true,
            buttons: ["Cancelar", "Excluir"],
        }).then(async (willDelete) => {
            if (willDelete) {
                setLoading(true);
                try {
                    await removeBankAccount(item.id);
                    swal("Sucesso!", "Conta excluída com sucesso!", "success");
                    tableRef.current?.refetch();
                } catch (error) {
                    swal("Erro!", "Não foi possível excluir a conta", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    }

    function edit(item: BankAccount) {
        setId(item.id);
        setDescription(item.description);
        setBalance(item.balance);
    }

    function clearForm() {
        setId("");
        setDescription("");
        setBalance(0);
        setErrors({});
    }

    const columns: DataTableColumn<BankAccount>[] = [
        {
            key: "description",
            header: "Descrição",
            sortable: true,
            render: (row) => (
                <HStack gap={2}>
                    <CreditCard size={16} />
                    <Text>{row.description}</Text>
                </HStack>
            ),
        },
        {
            key: "balance",
            header: "Saldo",
            sortable: true,
            render: (row) => (
                <Text color={row.balance >= 0 ? "green.solid" : "red.solid"}>
                    {formatCurrency(row.balance)}
                </Text>
            ),
        },
    ];

    const actions: DataTableAction<BankAccount>[] = [
        { label: "Editar", icon: <Edit size={16} />, onClick: edit },
        { label: "Excluir", icon: <Trash2 size={16} />, variant: "danger", onClick: remove },
    ];

    return (
        <Container maxW="6xl" py={8}>
            <Box mb={6}>
                <Heading size="5xl">Contas Bancárias</Heading>
                <Text color="fg.muted">Gerencie suas contas bancárias de forma simples e eficiente</Text>
            </Box>

            <Card.Root mb={6}>
                <Card.Body>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        <Field.Root invalid={!!errors.description}>
                            <Field.Label>Descrição</Field.Label>
                            <Input
                                placeholder="Digite uma descrição para sua conta"
                                value={description}
                                onChange={(e) => {
                                    setDescription(e.target.value);
                                    if (errors.description) setErrors({...errors, description: undefined});
                                }}
                            />
                            {errors.description && <Field.ErrorText>{errors.description}</Field.ErrorText>}
                        </Field.Root>
                        <Field.Root invalid={!!errors.balance}>
                            <Field.Label>Saldo</Field.Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="Digite o saldo da conta"
                                value={balance || ""}
                                onChange={(e) => {
                                    setBalance(Number(e.target.value));
                                    if (errors.balance) setErrors({...errors, balance: undefined});
                                }}
                            />
                            {errors.balance && <Field.ErrorText>{errors.balance}</Field.ErrorText>}
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
                    <DataTable<BankAccount>
                        ref={tableRef}
                        columns={columns}
                        actions={actions}
                        rowKey={(row) => row.id}
                        enableSearch
                        searchPlaceholder="Buscar contas..."
                        emptyMessage="Nenhuma conta encontrada"
                        errorMessage="Não foi possível carregar as contas"
                        onDataLoading={getBankAccounts}
                    />
                </Card.Body>
            </Card.Root>
        </Container>
    )
}
