"use client"
import { useRef, useState } from "react";
import { CreditCard, Edit, Trash2, Save, X } from 'react-feather';
import { useConfirm } from "@/components/common/ConfirmProvider";
import { notifyError, notifySuccess } from "@/lib/ui/notify";
import { Button, DataTable, PageHeader, type DataTableColumn, type DataTableAction, type DataTableHandle } from "tikin-uai";
import { Card, Container, Field, HStack, Input, NativeSelect, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { createBankAccount, getBankAccounts, removeBankAccount, updateBankAccount } from "@/lib/api/bank-account";
import type { AccountType, BankAccount } from "@/lib/types/bank-account";
import { useFormatCurrency } from "@/lib/hooks/useFormatCurrency";
import MoneyInput from "@/components/common/MoneyInput";
import StatusBadge from "@/components/StatusBadge";
import { ACCOUNT_TYPE_LABEL, accountTypeOf } from "@/lib/utils/account-type";

const ACCOUNT_TYPES: AccountType[] = ["CHECKING", "INVESTMENT"];

export default function PageAccount() {
    const formatCurrency = useFormatCurrency();
    const confirm = useConfirm();
    const [description, setDescription] = useState<string>("");
    const [balance, setBalance] = useState<number>(0);
    const [accountType, setAccountType] = useState<AccountType>("CHECKING");
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

    async function handleSubmit() {
        if (!validateForm()) return;

        const confirmed = await confirm({
            title: "Confirmar",
            text: id ? "Deseja atualizar esta conta?" : "Deseja criar uma nova conta?",
        });
        if (confirmed) {
            id ? update() : store();
        }
    }

    async function store() {
        setLoading(true);
        try {
            await createBankAccount({ description, balance, type: accountType });
            notifySuccess("Conta criada com sucesso!");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            notifyError("Não foi possível criar a conta");
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        setLoading(true);
        try {
            await updateBankAccount(id, { description, balance, type: accountType });
            notifySuccess("Conta atualizada com sucesso!");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            notifyError("Não foi possível atualizar a conta");
        } finally {
            setLoading(false);
        }
    }

    async function remove(item: BankAccount) {
        const confirmed = await confirm({
            title: "Confirmação",
            text: "Tem certeza que deseja excluir esta conta?",
            confirmLabel: "Excluir",
            tone: "danger",
        });
        if (!confirmed) return;

        setLoading(true);
        try {
            await removeBankAccount(item.id);
            notifySuccess("Conta excluída com sucesso!");
            tableRef.current?.refetch();
        } catch (error) {
            notifyError("Não foi possível excluir a conta");
        } finally {
            setLoading(false);
        }
    }

    function edit(item: BankAccount) {
        setId(item.id);
        setDescription(item.description);
        setBalance(item.balance);
        setAccountType(accountTypeOf(item));
    }

    function clearForm() {
        setId("");
        setDescription("");
        setBalance(0);
        setAccountType("CHECKING");
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
            key: "type",
            header: "Tipo",
            render: (row) => {
                const type = accountTypeOf(row);
                return (
                    <StatusBadge status={type === "INVESTMENT" ? "info" : "neutral"} variant="surface">
                        {ACCOUNT_TYPE_LABEL[type]}
                    </StatusBadge>
                );
            },
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
            <PageHeader title="Contas Bancárias" subtitle="Gerencie suas contas bancárias de forma simples e eficiente" mb={6} />

            <Card.Root mb={6}>
                <Card.Body>
                    <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
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
                        <Field.Root>
                            <Field.Label>Tipo</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field
                                    value={accountType}
                                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                                >
                                    {ACCOUNT_TYPES.map((type) => (
                                        <option key={type} value={type}>{ACCOUNT_TYPE_LABEL[type]}</option>
                                    ))}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                            <Field.HelperText>
                                {accountType === "INVESTMENT"
                                    ? "Recebe só receitas e transferências, nunca despesas."
                                    : "Usada para receitas e despesas do dia a dia."}
                            </Field.HelperText>
                        </Field.Root>
                        <Field.Root invalid={!!errors.balance}>
                            <Field.Label>Saldo</Field.Label>
                            <MoneyInput
                                placeholder="Digite o saldo da conta"
                                value={balance}
                                allowNegative
                                onValueChange={(value) => {
                                    setBalance(value);
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
