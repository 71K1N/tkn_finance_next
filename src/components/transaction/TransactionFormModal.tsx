"use client"
import { useEffect, useRef, useState } from "react";
import { Save, X } from 'react-feather';
import swal from 'sweetalert';
import { notifyError, notifySuccess } from "@/lib/ui/notify";
import { Autocomplete, Button, Radio, RadioGroup, Switch } from "tikin-uai";
import { Box, Dialog, Field, Input, NativeSelect, Portal, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { createTransaction, searchTransactionSuggestions, updateTransaction } from "@/lib/api/transaction";
import type { Transaction, TransactionDraft, TransactionType } from "@/lib/types/transaction";
import type { Category } from "@/lib/types/category";
import type { Subcategory } from "@/lib/types/subcategory";
import type { BankAccount } from "@/lib/types/bank-account";
import MoneyInput from "@/components/common/MoneyInput";
import { projectDueDateToCurrentMonth, todayLocalISO } from "@/lib/utils/date";
import { getErrorMessage } from "@/lib/utils/api-error";

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type TransactionFormModalProps = {
    open: boolean;
    transaction: Transaction | null;
    /** Starting values for a new transaction (e.g. parsed from free text); ignored when editing. */
    draft?: TransactionDraft | null;
    categories: Category[];
    subcategories: Subcategory[];
    accounts: BankAccount[];
    onClose: () => void;
    onSaved: () => void;
};

export default function TransactionFormModal({
    open,
    transaction,
    draft = null,
    categories,
    subcategories,
    accounts,
    onClose,
    onSaved,
}: TransactionFormModalProps) {
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);
    const [dueDate, setDueDate] = useState<string>("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [subcategoryId, setSubcategoryId] = useState<string>("");
    const [accountId, setAccountId] = useState<string>("");
    const [type, setType] = useState<TransactionType>('EXPENSE');
    const [paid, setPaid] = useState<boolean>(false);
    const [paymentDate, setPaymentDate] = useState<string>(todayLocalISO());
    const amountInputRef = useRef<HTMLInputElement | null>(null);
    const [isBill, setIsBill] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!open) return;

        setPaid(false);
        setPaymentDate(todayLocalISO());

        if (transaction) {
            setName(transaction.name);
            setDescription(transaction.description);
            setAmount(transaction.amount);
            setDueDate(transaction.due_date ?? "");
            setIsBill(!!transaction.due_date);
            setSubcategoryId(transaction.subcategory_id ?? "");
            const sub = subcategories.find((s) => s.id === transaction.subcategory_id);
            setCategoryId(sub?.categoryId ?? "");
            setAccountId(transaction.account_id);
            setType(transaction.type);
        } else if (draft) {
            const sub = subcategories.find((s) => s.id === draft.subcategory_id);
            setName(draft.name ?? "");
            setDescription("");
            setAmount(draft.amount ?? 0);
            setDueDate("");
            setIsBill(true);
            setSubcategoryId(sub?.id ?? "");
            setCategoryId(sub?.categoryId ?? "");
            setAccountId(draft.account_id ?? "");
            setType(draft.type);
            // The sentence describes something that already happened, so it starts as paid on the stated day.
            setPaid(true);
            setPaymentDate(draft.payment_date);
        } else {
            setName("");
            setDescription("");
            setAmount(0);
            setDueDate("");
            setIsBill(true);
            setCategoryId("");
            setSubcategoryId("");
            setAccountId("");
            setType('EXPENSE');
        }
    }, [open, transaction, draft, subcategories]);

    function categoryOf(suggestion: Transaction): Category | undefined {
        const sub = subcategories.find((s) => s.id === suggestion.subcategory_id);
        return categories.find((c) => c.id === sub?.categoryId);
    }

    // Everything filled here is only a starting point; the user can still edit each field.
    function applySuggestion(suggestion: Transaction) {
        const sub = subcategories.find((s) => s.id === suggestion.subcategory_id);

        setName(suggestion.name);
        setDescription(suggestion.description ?? "");
        setAmount(suggestion.amount);
        setType(suggestion.type);
        setAccountId(suggestion.account_id ?? "");
        setSubcategoryId(sub?.id ?? "");
        setCategoryId(sub?.categoryId ?? "");
        setPaid(false);
        setIsBill(!!suggestion.due_date);
        setDueDate(projectDueDateToCurrentMonth(suggestion.due_date));
    }

    function handleSubmit() {
        swal({
            title: "Confirmar",
            text: transaction ? "Deseja atualizar esta transação?" : "Deseja criar uma nova transação?",
            icon: "question",
            buttons: ["Cancelar", "Confirmar"],
        }).then((willProceed) => {
            if (willProceed) {
                transaction ? update() : store();
            }
        });
    }

    async function store() {
        setLoading(true);
        try {
            const computedDueDate = paid ? undefined : (isBill ? (dueDate || undefined) : undefined);
            await createTransaction({
                name,
                description,
                amount,
                due_date: computedDueDate,
                payment_date: paid ? paymentDate : undefined,
                paid_amount: paid ? amount : undefined,
                subcategory_id: subcategoryId || undefined,
                account_id: accountId,
                type,
            });
            notifySuccess("Transação criada com sucesso!");
            onSaved();
            onClose();
        } catch (error) {
            const message = getErrorMessage(error, "Não foi possível criar a transação", {
                400: "Dados inválidos. Verifique os campos e tente novamente.",
                404: "Conta ou subcategoria não encontrada.",
            });
            notifyError(message);
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        if (!transaction) return;
        setLoading(true);
        try {
            const todayISO = todayLocalISO();
            const computedDueDate = paid ? todayISO : (isBill ? (dueDate || undefined) : undefined);
            await updateTransaction(transaction.id, {
                name,
                description,
                amount,
                due_date: computedDueDate,
                payment_date: paid ? paymentDate : undefined,
                paid_amount: paid ? amount : undefined,
                subcategory_id: subcategoryId || undefined,
                account_id: accountId,
                type,
            });
            notifySuccess("Transação atualizada com sucesso!");
            onSaved();
            onClose();
        } catch (error) {
            const message = getErrorMessage(error, "Não foi possível atualizar a transação", {
                400: "Dados inválidos. Verifique os campos e tente novamente.",
                404: "Transação não encontrada. Ela pode ter sido excluída.",
            });
            notifyError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog.Root
            open={open}
            onOpenChange={(e) => { if (!e.open) onClose(); }}
            // A draft without an amount asks for it: land on the amount field instead of the first one.
            initialFocusEl={() => (!transaction && draft && draft.amount == null ? amountInputRef.current : null)}
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>{transaction ? 'Editar Transação' : 'Nova Transação'}</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                <Field.Root>
                                    <Field.Label>Nome</Field.Label>
                                    {transaction ? (
                                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da transação" />
                                    ) : (
                                        <Autocomplete<Transaction>
                                            value={name}
                                            onValueChange={setName}
                                            onSelect={applySuggestion}
                                            onSearch={searchTransactionSuggestions}
                                            itemToString={(item) => item.name}
                                            renderItem={(item) => (
                                                <Box>
                                                    <Text fontWeight="medium">{item.name}</Text>
                                                    <Text fontSize="xs" color="text.muted">
                                                        {currencyFormatter.format(item.amount)}
                                                        {categoryOf(item) && ` • ${categoryOf(item)?.name}`}
                                                    </Text>
                                                </Box>
                                            )}
                                            placeholder="Nome da transação"
                                            loadingMessage="Buscando..."
                                            emptyMessage="Nenhuma transação anterior encontrada"
                                        />
                                    )}
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Descrição</Field.Label>
                                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />
                                </Field.Root>
                            </SimpleGrid>

                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={4}>
                                <Field.Root>
                                    <Field.Label>Valor</Field.Label>
                                    <MoneyInput
                                        value={amount}
                                        onValueChange={setAmount}
                                        inputRef={amountInputRef}
                                    />
                                </Field.Root>
                                {paid && (
                                    <Field.Root>
                                        <Field.Label>Data do pagamento</Field.Label>
                                        <Input type="date" value={paymentDate} max={todayLocalISO()} onChange={(e) => setPaymentDate(e.target.value)} />
                                    </Field.Root>
                                )}
                                {!paid && isBill && (
                                    <Field.Root>
                                        <Field.Label>Data Vencimento</Field.Label>
                                        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                                    </Field.Root>
                                )}
                            </SimpleGrid>

                            <Switch
                                mt={4}
                                checked={paid}
                                onCheckedChange={(e) => setPaid(e.checked)}
                                label={type === 'INCOME' ? 'Já foi recebida' : 'Já foi paga'}
                            />

                            {!paid && type === 'EXPENSE' && (
                                <Field.Root mt={4}>
                                    <Field.Label>Qual é o tipo desta transação?</Field.Label>
                                    <RadioGroup value={isBill ? "bill" : "purchase"} onValueChange={(e) => setIsBill(e.value === "bill")}>
                                        <Stack gap={2}>
                                            <Radio value="bill" label="📅 Conta/Compromisso agendado - É uma conta fixa ou despesa planejada com data de vencimento" />
                                            <Radio value="purchase" label="⚡ Compra/Gasto impulsivo - É uma compra espontânea ou despesa sem data fixa" />
                                        </Stack>
                                    </RadioGroup>
                                </Field.Root>
                            )}

                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={4}>
                                <Field.Root>
                                    <Field.Label>Tipo</Field.Label>
                                    <RadioGroup value={type} onValueChange={(e) => setType(e.value as TransactionType)}>
                                        <Stack direction="row" gap={4}>
                                            <Radio value="EXPENSE" label="Despesa" />
                                            <Radio value="INCOME" label="Receita" />
                                        </Stack>
                                    </RadioGroup>
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
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Stack direction="row" gap={2}>
                                <Button variant="outline" onClick={onClose} disabled={loading}>
                                    <X size={16} />
                                    Cancelar
                                </Button>
                                <Button colorPalette="primary" onClick={handleSubmit} disabled={loading}>
                                    <Save size={16} />
                                    {transaction ? 'Atualizar' : 'Salvar'}
                                </Button>
                            </Stack>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
