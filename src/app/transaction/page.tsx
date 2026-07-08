"use client"
import { useEffect, useRef, useState } from "react";
import { Trash2, Edit, DollarSign, Save, X, List, Calendar, Tag } from 'react-feather';
import swal from 'sweetalert';
import { Button, DataTable, type DataTableColumn, type DataTableAction, type DataTableHandle } from "tikin-ds";
import {
    Badge,
    Box,
    Card,
    Container,
    Dialog,
    Field,
    HStack,
    Heading,
    Input,
    NativeSelect,
    Portal,
    SimpleGrid,
    Stack,
    Text,
} from "@chakra-ui/react";
import { createTransaction, getTransactionSummary, getTransactions, payTransaction, removeTransaction, updateTransaction } from "@/lib/api/transaction";
import { getCategories } from "@/lib/api/category";
import { getSubcategories } from "@/lib/api/subcategory";
import { getBankAccounts } from "@/lib/api/bank-account";
import type { Transaction, TransactionSummary, TransactionType } from "@/lib/types/transaction";
import type { Category } from "@/lib/types/category";
import type { Subcategory } from "@/lib/types/subcategory";
import type { BankAccount } from "@/lib/types/bank-account";

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

function formatDate(dateString: string | null): string {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

export default function PageTransaction() {
    const [id, setId] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);
    const [dueDate, setDueDate] = useState<string>("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [subcategoryId, setSubcategoryId] = useState<string>("");
    const [accountId, setAccountId] = useState<string>("");
    const [type, setType] = useState<TransactionType>('EXPENSE');
    const [loading, setLoading] = useState<boolean>(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [summary, setSummary] = useState<TransactionSummary | null>(null);

    const [paymentTarget, setPaymentTarget] = useState<Transaction | null>(null);
    const [paymentDate, setPaymentDate] = useState<string>("");
    const [paidAmount, setPaidAmount] = useState<number>(0);

    const tableRef = useRef<DataTableHandle>(null);

    async function loadRelatedData() {
        const [categoriesResponse, subcategoriesResponse, accountsResponse] = await Promise.all([
            getCategories({ page: 1, pageSize: 100 }),
            getSubcategories({ page: 1, pageSize: 100 }),
            getBankAccounts({ page: 1, pageSize: 100 }),
        ]);
        setCategories(categoriesResponse.data);
        setSubcategories(subcategoriesResponse.data);
        setAccounts(accountsResponse.data);
    }

    async function loadSummary() {
        try {
            setSummary(await getTransactionSummary());
        } catch (error) {
            // summary is a secondary indicator; failing to load it shouldn't block the page
        }
    }

    useEffect(() => {
        loadRelatedData();
        loadSummary();
    }, []);

    function categoryName(subcategoryId: string | null) {
        const sub = subcategories.find((s) => s.id === subcategoryId);
        if (!sub) return "N/A";
        return categories.find((c) => c.id === sub.categoryId)?.name ?? "N/A";
    }

    function subcategoryName(subcategoryId: string | null) {
        return subcategories.find((s) => s.id === subcategoryId)?.name ?? "N/A";
    }

    function accountName(accountId: string) {
        return accounts.find((a) => a.id === accountId)?.description ?? "N/A";
    }

    function handleSubmit() {
        swal({
            title: "Confirmar",
            text: id ? "Deseja atualizar esta transação?" : "Deseja criar uma nova transação?",
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
            await createTransaction({
                name,
                description,
                amount,
                due_date: dueDate,
                subcategory_id: subcategoryId || undefined,
                account_id: accountId,
                type,
                user_id: 1,
            });
            swal("Sucesso!", "Transação criada com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
            loadSummary();
        } catch (error) {
            swal("Erro!", "Não foi possível criar a transação", "error");
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        setLoading(true);
        try {
            await updateTransaction(id, {
                name,
                description,
                amount,
                due_date: dueDate,
                subcategory_id: subcategoryId || undefined,
                account_id: accountId,
                type,
            });
            swal("Sucesso!", "Transação atualizada com sucesso!", "success");
            clearForm();
            tableRef.current?.refetch();
            loadSummary();
        } catch (error) {
            swal("Erro!", "Não foi possível atualizar a transação", "error");
        } finally {
            setLoading(false);
        }
    }

    async function remove(item: Transaction) {
        swal({
            title: "Confirmação",
            text: "Tem certeza que deseja excluir esta transação?",
            icon: "warning",
            dangerMode: true,
            buttons: ["Cancelar", "Excluir"],
        }).then(async (willDelete) => {
            if (willDelete) {
                setLoading(true);
                try {
                    await removeTransaction(item.id);
                    swal("Sucesso!", "Transação excluída com sucesso!", "success");
                    tableRef.current?.refetch();
                    loadSummary();
                } catch (error) {
                    swal("Erro!", "Não foi possível excluir a transação", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    }

    function edit(item: Transaction) {
        setId(item.id);
        setName(item.name);
        setDescription(item.description);
        setAmount(item.amount);
        setDueDate(item.due_date ?? "");
        setSubcategoryId(item.subcategory_id ?? "");
        const sub = subcategories.find((s) => s.id === item.subcategory_id);
        setCategoryId(sub?.categoryId ?? "");
        setAccountId(item.account_id);
        setType(item.type);
    }

    function clearForm() {
        setId("");
        setName("");
        setDescription("");
        setAmount(0);
        setDueDate("");
        setCategoryId("");
        setSubcategoryId("");
        setAccountId("");
        setType('EXPENSE');
    }

    function openPayment(item: Transaction) {
        setPaymentTarget(item);
        setPaidAmount(item.amount);
        setPaymentDate(new Date().toISOString().split('T')[0]);
    }

    async function confirmPayment() {
        if (!paymentTarget) return;
        setLoading(true);
        try {
            await payTransaction(paymentTarget.id, { payment_date: paymentDate, paid_amount: paidAmount });
            swal("Sucesso!", "Pagamento registrado com sucesso!", "success");
            setPaymentTarget(null);
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível registrar o pagamento", "error");
        } finally {
            setLoading(false);
        }
    }

    const columns: DataTableColumn<Transaction>[] = [
        {
            key: "name",
            header: "Nome",
            sortable: true,
            render: (row) => (
                <HStack gap={2}>
                    <List size={16} />
                    <Text>{row.name}</Text>
                </HStack>
            ),
        },
        {
            key: "subcategory_id",
            header: "Categoria",
            render: (row) => (
                <HStack gap={2}>
                    <Tag size={16} />
                    <Text>{categoryName(row.subcategory_id)} / {subcategoryName(row.subcategory_id)}</Text>
                </HStack>
            ),
        },
        {
            key: "account_id",
            header: "Conta",
            render: (row) => accountName(row.account_id),
        },
        {
            key: "amount",
            header: "Valor",
            sortable: true,
            render: (row) => (
                <Text color={row.type === 'EXPENSE' ? 'red.solid' : 'green.solid'}>
                    R$ {row.amount.toFixed(2)}
                </Text>
            ),
        },
        {
            key: "due_date",
            header: "Vencimento",
            sortable: true,
            render: (row) => (
                <HStack gap={2}>
                    <Calendar size={16} />
                    <Text>{formatDate(row.due_date)}</Text>
                </HStack>
            ),
        },
        {
            key: "payment_date",
            header: "Status",
            render: (row) => (
                <Badge colorPalette={row.payment_date ? "green" : "yellow"}>
                    {row.payment_date ? "Pago" : "Pendente"}
                </Badge>
            ),
        },
        {
            key: "type",
            header: "Tipo",
            filterable: true,
            render: (row) => (
                <Badge colorPalette={row.type === 'EXPENSE' ? "red" : "green"}>
                    {row.type === 'EXPENSE' ? "Despesa" : "Receita"}
                </Badge>
            ),
        },
    ];

    const actions: DataTableAction<Transaction>[] = [
        {
            label: "Registrar Pagamento",
            icon: <DollarSign size={16} />,
            isDisabled: (row) => !!row.payment_date,
            onClick: openPayment,
        },
        { label: "Editar", icon: <Edit size={16} />, onClick: edit },
        { label: "Excluir", icon: <Trash2 size={16} />, variant: "danger", onClick: remove },
    ];

    return (
        <Container maxW="6xl" py={8}>
            <Box mb={6}>
                <Heading size="5xl">Transações</Heading>
                <Text color="fg.muted">Gerencie suas transações financeiras</Text>
            </Box>

            {summary && (
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={6}>
                    <Card.Root>
                        <Card.Body>
                            <Text color="fg.muted">Receitas</Text>
                            <Text fontSize="2xl" color="green.solid">{formatCurrency(summary.totalIncome)}</Text>
                        </Card.Body>
                    </Card.Root>
                    <Card.Root>
                        <Card.Body>
                            <Text color="fg.muted">Despesas</Text>
                            <Text fontSize="2xl" color="red.solid">{formatCurrency(summary.totalExpenses)}</Text>
                        </Card.Body>
                    </Card.Root>
                    <Card.Root>
                        <Card.Body>
                            <Text color="fg.muted">Saldo</Text>
                            <Text fontSize="2xl" color={summary.balance >= 0 ? "green.solid" : "red.solid"}>
                                {formatCurrency(summary.balance)}
                            </Text>
                        </Card.Body>
                    </Card.Root>
                </SimpleGrid>
            )}

            <Card.Root mb={6}>
                <Card.Body>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                        <Field.Root>
                            <Field.Label>Nome</Field.Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da transação" />
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Descrição</Field.Label>
                            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />
                        </Field.Root>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 4 }} gap={4} mt={4}>
                        <Field.Root>
                            <Field.Label>Valor</Field.Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={amount || ""}
                                onChange={(e) => setAmount(Number(e.target.value))}
                            />
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Data Vencimento</Field.Label>
                            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Tipo</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field value={type} onChange={(e) => setType(e.target.value as TransactionType)}>
                                    <option value="EXPENSE">Despesa</option>
                                    <option value="INCOME">Receita</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Conta</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>{account.description}</option>
                                    ))}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </Field.Root>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={4}>
                        <Field.Root>
                            <Field.Label>Categoria</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field
                                    value={categoryId}
                                    onChange={(e) => {
                                        setCategoryId(e.target.value);
                                        setSubcategoryId("");
                                    }}
                                >
                                    <option value="">Selecione...</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Subcategoria</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {subcategories
                                        .filter((sub) => sub.categoryId === categoryId)
                                        .map((sub) => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
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
                    <DataTable<Transaction>
                        ref={tableRef}
                        columns={columns}
                        actions={actions}
                        rowKey={(row) => row.id}
                        enableSearch
                        searchPlaceholder="Buscar transações..."
                        emptyMessage="Nenhuma transação encontrada"
                        errorMessage="Não foi possível carregar as transações"
                        onDataLoading={getTransactions}
                    />
                </Card.Body>
            </Card.Root>

            <Dialog.Root open={!!paymentTarget} onOpenChange={(e) => { if (!e.open) setPaymentTarget(null); }}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>Registrar Pagamento</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Text mb={4}>
                                    <strong>Transação:</strong> {paymentTarget?.name}<br />
                                    <strong>Valor Original:</strong> R$ {paymentTarget?.amount.toFixed(2)}
                                </Text>
                                <Stack gap={4}>
                                    <Field.Root>
                                        <Field.Label>Data do Pagamento</Field.Label>
                                        <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                                    </Field.Root>
                                    <Field.Root>
                                        <Field.Label>Valor Pago</Field.Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={paidAmount || ""}
                                            onChange={(e) => setPaidAmount(Number(e.target.value))}
                                        />
                                    </Field.Root>
                                </Stack>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Button variant="outline" onClick={() => setPaymentTarget(null)} disabled={loading}>Cancelar</Button>
                                <Button colorPalette="primary" onClick={confirmPayment} disabled={loading}>Confirmar Pagamento</Button>
                            </Dialog.Footer>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>
        </Container>
    )
}
