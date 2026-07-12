"use client"
import { useEffect, useRef, useState } from "react";
import { Trash2, Edit, DollarSign, Plus, List, Calendar, Tag } from 'react-feather';
import swal from 'sweetalert';
import { Button, DataTable, type DataTableColumn, type DataTableAction, type DataTableHandle } from "tikin-ds";
import { Box, Card, Container, Flex, HStack, Heading, Text } from "@chakra-ui/react";
import StatusBadge from "@/components/StatusBadge";
import TransactionSummaryCards from "@/components/transaction/TransactionSummaryCards";
import TransactionFormModal from "@/components/transaction/TransactionFormModal";
import TransactionPaymentModal from "@/components/transaction/TransactionPaymentModal";
import { getTransactionSummary, getTransactions, removeTransaction } from "@/lib/api/transaction";
import { getCategories } from "@/lib/api/category";
import { getSubcategories } from "@/lib/api/subcategory";
import { getBankAccounts } from "@/lib/api/bank-account";
import type { Transaction, TransactionSummary } from "@/lib/types/transaction";
import type { Category } from "@/lib/types/category";
import type { Subcategory } from "@/lib/types/subcategory";
import type { BankAccount } from "@/lib/types/bank-account";
import { useFormatCurrency } from "@/lib/hooks/useFormatCurrency";

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
    const formatCurrency = useFormatCurrency();
    const [loading, setLoading] = useState<boolean>(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [summary, setSummary] = useState<TransactionSummary | null>(null);

    const [formModalOpen, setFormModalOpen] = useState<boolean>(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [paymentTarget, setPaymentTarget] = useState<Transaction | null>(null);

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

    function openCreate() {
        setEditingTransaction(null);
        setFormModalOpen(true);
    }

    function edit(item: Transaction) {
        setEditingTransaction(item);
        setFormModalOpen(true);
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

    function openPayment(item: Transaction) {
        setPaymentTarget(item);
    }

    function handleSaved() {
        tableRef.current?.refetch();
        loadSummary();
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
                    {formatCurrency(row.amount)}
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
            sortable: true,
            render: (row) => (
                <StatusBadge status={row.payment_date ? "success" : "warning"}>
                    {row.payment_date ? "Pago" : "Pendente"}
                </StatusBadge>
            ),
        },
        {
            key: "type",
            header: "Tipo",
            filterable: true,
            render: (row) => (
                <StatusBadge status={row.type === 'EXPENSE' ? "danger" : "success"}>
                    {row.type === 'EXPENSE' ? "Despesa" : "Receita"}
                </StatusBadge>
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
            <Flex justify="space-between" align="center" mb={6}>
                <Box>
                    <Heading size="5xl">Transações</Heading>
                    <Text color="fg.muted">Gerencie suas transações financeiras</Text>
                </Box>
                <Button colorPalette="primary" onClick={openCreate} disabled={loading}>
                    <Plus size={16} />
                    Nova Transação
                </Button>
            </Flex>

            <TransactionSummaryCards summary={summary} />

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

            <TransactionFormModal
                open={formModalOpen}
                transaction={editingTransaction}
                categories={categories}
                subcategories={subcategories}
                accounts={accounts}
                onClose={() => setFormModalOpen(false)}
                onSaved={handleSaved}
            />

            <TransactionPaymentModal
                transaction={paymentTarget}
                onClose={() => setPaymentTarget(null)}
                onSaved={handleSaved}
            />
        </Container>
    )
}
