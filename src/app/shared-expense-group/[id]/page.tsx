"use client"
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, UserMinus, UserPlus, X } from 'react-feather';
import swal from 'sweetalert';
import { Button, DataTable, type DataTableColumn, type DataTableAction, type DataTableHandle } from "tikin-ds";
import {
    Badge,
    Box,
    Card,
    Container,
    Field,
    Flex,
    Heading,
    HStack,
    Input,
    NativeSelect,
    SimpleGrid,
    Stack,
    Table,
    Tabs,
    Text,
} from "@chakra-ui/react";
import {
    addGroupMember,
    createGroupExpense,
    getExpenseGroup,
    getGroupBalances,
    getGroupExpenses,
    getSettlements,
    getSettlementSuggestions,
    recordSettlement,
    removeGroupMember,
    voidGroupExpense,
} from "@/lib/api/shared-expense-group";
import type {
    ExpenseGroup,
    ExpenseSettlement,
    GroupBalance,
    GroupExpense,
    SettlementSuggestion,
    ShareType,
    SplitType,
} from "@/lib/types/shared-expense-group";

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function MembersTab({ group, onChanged }: { group: ExpenseGroup; onChanged: () => void }) {
    const [userId, setUserId] = useState<string>("");
    const [shareType, setShareType] = useState<ShareType>("equal");
    const [shareValue, setShareValue] = useState<string>("");
    const [loading, setLoading] = useState(false);

    async function addMember() {
        if (!userId.trim()) {
            swal("Erro!", "Informe o ID do usuário", "error");
            return;
        }
        setLoading(true);
        try {
            await addGroupMember(group.id, {
                user_id: Number(userId),
                share_type: shareType,
                share_value: shareValue ? Number(shareValue) : undefined,
            });
            swal("Sucesso!", "Membro adicionado com sucesso!", "success");
            setUserId("");
            setShareValue("");
            onChanged();
        } catch (error) {
            swal("Erro!", "Não foi possível adicionar o membro", "error");
        } finally {
            setLoading(false);
        }
    }

    function removeMember(memberUserId: number) {
        swal({
            title: "Confirmação",
            text: "Remover este membro do grupo?",
            icon: "warning",
            dangerMode: true,
            buttons: ["Cancelar", "Remover"],
        }).then(async (willRemove) => {
            if (willRemove) {
                setLoading(true);
                try {
                    await removeGroupMember(group.id, memberUserId);
                    swal("Sucesso!", "Membro removido com sucesso!", "success");
                    onChanged();
                } catch (error) {
                    swal("Erro!", "Não foi possível remover (verifique se o saldo está zerado)", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    }

    return (
        <Stack gap={4}>
            <Card.Root>
                <Card.Body>
                    <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
                        <Field.Root>
                            <Field.Label>ID do usuário</Field.Label>
                            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Ex: 202" />
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Tipo de cota</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field value={shareType} onChange={(e) => setShareType(e.target.value as ShareType)}>
                                    <option value="equal">Igual</option>
                                    <option value="percentage">Percentual</option>
                                    <option value="fixed">Valor fixo</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Valor da cota</Field.Label>
                            <Input
                                type="number"
                                value={shareValue}
                                disabled={shareType === "equal"}
                                onChange={(e) => setShareValue(e.target.value)}
                                placeholder={shareType === "percentage" ? "Ex: 40" : "Ex: 200"}
                            />
                        </Field.Root>
                        <Box alignSelf="end">
                            <Button colorPalette="primary" onClick={addMember} disabled={loading}>
                                <UserPlus size={16} />
                                Adicionar membro
                            </Button>
                        </Box>
                    </SimpleGrid>
                </Card.Body>
            </Card.Root>

            <Card.Root>
                <Card.Body>
                    <Table.Root>
                        <Table.Header>
                            <Table.Row>
                                <Table.ColumnHeader>Usuário</Table.ColumnHeader>
                                <Table.ColumnHeader>Cota</Table.ColumnHeader>
                                <Table.ColumnHeader>Status</Table.ColumnHeader>
                                <Table.ColumnHeader>Ações</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {group.members.map((member) => (
                                <Table.Row key={member.user_id}>
                                    <Table.Cell>
                                        {member.user_id}
                                        {member.user_id === group.owner_id && (
                                            <Badge ml={2} colorPalette="purple">Dono</Badge>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell>
                                        {member.share_type === "equal"
                                            ? "Igual"
                                            : member.share_type === "percentage"
                                                ? `${member.share_value}%`
                                                : formatCurrency(member.share_value ?? 0)}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge colorPalette={member.active ? "green" : "gray"}>
                                            {member.active ? "Ativo" : "Removido"}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {member.active && member.user_id !== group.owner_id && (
                                            <Button size="sm" variant="outline" colorPalette="danger" onClick={() => removeMember(member.user_id)} disabled={loading}>
                                                <UserMinus size={14} />
                                                Remover
                                            </Button>
                                        )}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Card.Body>
            </Card.Root>
        </Stack>
    )
}

function ExpensesTab({ group }: { group: ExpenseGroup }) {
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const [splitType, setSplitType] = useState<SplitType>("equal");
    const [loading, setLoading] = useState(false);
    const tableRef = useRef<DataTableHandle>(null);

    function clearForm() {
        setDescription("");
        setAmount(0);
        setSplitType("equal");
    }

    async function store() {
        if (!description.trim() || amount <= 0) {
            swal("Erro!", "Informe descrição e um valor positivo", "error");
            return;
        }
        setLoading(true);
        try {
            await createGroupExpense(group.id, { description, amount, split_type: splitType });
            swal("Sucesso!", "Despesa lançada e dividida entre os membros!", "success");
            clearForm();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível lançar a despesa (confira se as cotas dos membros estão configuradas)", "error");
        } finally {
            setLoading(false);
        }
    }

    function voidExpense(item: GroupExpense) {
        swal({
            title: "Confirmação",
            text: "Anular esta despesa?",
            icon: "warning",
            dangerMode: true,
            buttons: ["Cancelar", "Anular"],
        }).then(async (willVoid) => {
            if (willVoid) {
                setLoading(true);
                try {
                    await voidGroupExpense(group.id, item.id);
                    swal("Sucesso!", "Despesa anulada com sucesso!", "success");
                    tableRef.current?.refetch();
                } catch (error) {
                    swal("Erro!", "Não foi possível anular a despesa", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    }

    const columns: DataTableColumn<GroupExpense>[] = [
        { key: "description", header: "Descrição", sortable: true },
        { key: "amount", header: "Valor", sortable: true, render: (row) => formatCurrency(row.amount) },
        { key: "paid_by", header: "Pago por" },
        { key: "expense_date", header: "Data", render: (row) => new Date(row.expense_date).toLocaleDateString('pt-BR') },
        { key: "status", header: "Status", render: (row) => <Badge colorPalette={row.status === "active" ? "green" : "gray"}>{row.status === "active" ? "Ativa" : "Anulada"}</Badge> },
    ];

    const actions: DataTableAction<GroupExpense>[] = [
        { label: "Anular", icon: <Trash2 size={16} />, variant: "danger", onClick: voidExpense, isDisabled: (row) => row.status !== "active" },
    ];

    return (
        <Stack gap={4}>
            <Card.Root>
                <Card.Body>
                    <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
                        <Field.Root>
                            <Field.Label>Descrição</Field.Label>
                            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Conta de luz" />
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Valor</Field.Label>
                            <Input type="number" step="0.01" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Tipo de divisão</Field.Label>
                            <NativeSelect.Root>
                                <NativeSelect.Field value={splitType} onChange={(e) => setSplitType(e.target.value as SplitType)}>
                                    <option value="equal">Igual entre todos</option>
                                    <option value="percentage">Percentual configurado por membro</option>
                                    <option value="fixed">Valor fixo configurado por membro</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                            </NativeSelect.Root>
                        </Field.Root>
                        <Box alignSelf="end">
                            <Button colorPalette="primary" onClick={store} disabled={loading}>
                                <Save size={16} />
                                Lançar despesa
                            </Button>
                        </Box>
                    </SimpleGrid>
                </Card.Body>
            </Card.Root>

            <Card.Root>
                <Card.Body>
                    <DataTable<GroupExpense>
                        ref={tableRef}
                        columns={columns}
                        actions={actions}
                        rowKey={(row) => row.id}
                        emptyMessage="Nenhuma despesa lançada"
                        errorMessage="Não foi possível carregar as despesas"
                        onDataLoading={(params) => getGroupExpenses(group.id, params)}
                    />
                </Card.Body>
            </Card.Root>
        </Stack>
    )
}

function BalancesTab({ group }: { group: ExpenseGroup }) {
    const [balances, setBalances] = useState<GroupBalance[]>([]);
    const [suggestions, setSuggestions] = useState<SettlementSuggestion[]>([]);
    const [toUserId, setToUserId] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);
    const tableRef = useRef<DataTableHandle>(null);

    async function loadBalances() {
        try {
            const [balanceData, suggestionData] = await Promise.all([
                getGroupBalances(group.id),
                getSettlementSuggestions(group.id),
            ]);
            setBalances(balanceData);
            setSuggestions(suggestionData);
        } catch (error) {
            swal("Erro!", "Não foi possível carregar os saldos", "error");
        }
    }

    useEffect(() => {
        loadBalances();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [group.id]);

    async function settle() {
        if (!toUserId.trim() || amount <= 0) {
            swal("Erro!", "Informe para quem pagou e um valor positivo", "error");
            return;
        }
        setLoading(true);
        try {
            await recordSettlement(group.id, { to_user_id: Number(toUserId), amount, note: note || undefined });
            swal("Sucesso!", "Acerto registrado com sucesso!", "success");
            setToUserId("");
            setAmount(0);
            setNote("");
            loadBalances();
            tableRef.current?.refetch();
        } catch (error) {
            swal("Erro!", "Não foi possível registrar o acerto", "error");
        } finally {
            setLoading(false);
        }
    }

    const settlementColumns: DataTableColumn<ExpenseSettlement>[] = [
        { key: "from_user_id", header: "De" },
        { key: "to_user_id", header: "Para" },
        { key: "amount", header: "Valor", render: (row) => formatCurrency(row.amount) },
        { key: "note", header: "Nota", render: (row) => row.note ?? "-" },
        { key: "settled_at", header: "Data", render: (row) => new Date(row.settled_at).toLocaleDateString('pt-BR') },
    ];

    return (
        <Stack gap={4}>
            <Card.Root>
                <Card.Body>
                    <Heading size="md" mb={3}>Saldo por membro</Heading>
                    <Stack gap={2}>
                        {balances.map((b) => (
                            <Flex key={b.user_id} justify="space-between">
                                <Text>Usuário {b.user_id}</Text>
                                <Text fontWeight="bold" color={b.balance > 0 ? "green.solid" : b.balance < 0 ? "red.solid" : "fg.default"}>
                                    {b.balance > 0 ? "a receber " : b.balance < 0 ? "a pagar " : ""}
                                    {formatCurrency(Math.abs(b.balance))}
                                </Text>
                            </Flex>
                        ))}
                        {balances.length === 0 && <Text color="fg.muted">Nenhum saldo pendente</Text>}
                    </Stack>
                </Card.Body>
            </Card.Root>

            <Card.Root>
                <Card.Body>
                    <Heading size="md" mb={3}>Sugestão de acerto</Heading>
                    <Stack gap={2}>
                        {suggestions.map((s, idx) => (
                            <Text key={idx}>
                                Usuário {s.from_user_id} deve pagar {formatCurrency(s.amount)} para o usuário {s.to_user_id}
                            </Text>
                        ))}
                        {suggestions.length === 0 && <Text color="fg.muted">Tudo certo, ninguém deve nada</Text>}
                    </Stack>
                </Card.Body>
            </Card.Root>

            <Card.Root>
                <Card.Body>
                    <Heading size="md" mb={3}>Registrar acerto</Heading>
                    <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
                        <Field.Root>
                            <Field.Label>Paguei para (ID)</Field.Label>
                            <Input value={toUserId} onChange={(e) => setToUserId(e.target.value)} placeholder="Ex: 101" />
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Valor</Field.Label>
                            <Input type="number" step="0.01" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
                        </Field.Root>
                        <Field.Root>
                            <Field.Label>Nota</Field.Label>
                            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: Pix" />
                        </Field.Root>
                        <Box alignSelf="end">
                            <Button colorPalette="primary" onClick={settle} disabled={loading}>
                                <Save size={16} />
                                Registrar
                            </Button>
                        </Box>
                    </SimpleGrid>
                </Card.Body>
            </Card.Root>

            <Card.Root>
                <Card.Body>
                    <DataTable<ExpenseSettlement>
                        ref={tableRef}
                        columns={settlementColumns}
                        rowKey={(row) => row.id}
                        emptyMessage="Nenhum acerto registrado"
                        errorMessage="Não foi possível carregar os acertos"
                        onDataLoading={(params) => getSettlements(group.id, params)}
                    />
                </Card.Body>
            </Card.Root>
        </Stack>
    )
}

export default function PageSharedExpenseGroupDetail() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [group, setGroup] = useState<ExpenseGroup | null>(null);
    const [loading, setLoading] = useState(true);

    async function loadGroup() {
        try {
            const data = await getExpenseGroup(params.id);
            setGroup(data);
        } catch (error) {
            swal("Erro!", "Não foi possível carregar o grupo", "error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadGroup();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    if (loading) {
        return (
            <Container maxW="6xl" py={8}>
                <Text>Carregando...</Text>
            </Container>
        )
    }

    if (!group) {
        return (
            <Container maxW="6xl" py={8}>
                <Text>Grupo não encontrado</Text>
            </Container>
        )
    }

    return (
        <Container maxW="6xl" py={8}>
            <HStack mb={2}>
                <Button variant="ghost" size="sm" onClick={() => router.push('/shared-expense-group')}>
                    <ArrowLeft size={16} />
                    Voltar
                </Button>
            </HStack>
            <Box mb={6}>
                <Heading size="5xl">{group.name}</Heading>
                {group.description && <Text color="fg.muted">{group.description}</Text>}
            </Box>

            <Tabs.Root defaultValue="members">
                <Tabs.List mb={4}>
                    <Tabs.Trigger value="members">Membros</Tabs.Trigger>
                    <Tabs.Trigger value="expenses">Despesas</Tabs.Trigger>
                    <Tabs.Trigger value="balances">Saldos</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="members">
                    <MembersTab group={group} onChanged={loadGroup} />
                </Tabs.Content>
                <Tabs.Content value="expenses">
                    <ExpensesTab group={group} />
                </Tabs.Content>
                <Tabs.Content value="balances">
                    <BalancesTab group={group} />
                </Tabs.Content>
            </Tabs.Root>
        </Container>
    )
}
