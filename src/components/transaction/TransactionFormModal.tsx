"use client"
import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, Save, X, Zap } from 'react-feather';
import { notifyError, notifySuccess } from "@/lib/ui/notify";
import { useConfirm } from "@/components/common/ConfirmProvider";
import { Autocomplete, Button, Switch } from "tikin-uai";
import { Box, Dialog, Field, Input, NativeSelect, Portal, RadioCard, SegmentGroup, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { createTransaction, searchTransactionSuggestions, updateTransaction } from "@/lib/api/transaction";
import type { Transaction, TransactionDraft, TransactionKind } from "@/lib/types/transaction";
import type { Category } from "@/lib/types/category";
import type { Subcategory } from "@/lib/types/subcategory";
import type { BankAccount } from "@/lib/types/bank-account";
import MoneyInput from "@/components/common/MoneyInput";
import { projectDueDateToCurrentMonth, toDateInputFromStored, todayLocalISO } from "@/lib/utils/date";
import { accountsForType, isInvestmentAccount } from "@/lib/utils/account-type";
import { isTransfer, transferEnds } from "@/lib/utils/transfer";
import { getErrorMessage } from "@/lib/utils/api-error";
import { getLastAccountId, resolveDefaultAccountId, setLastAccountId } from "@/lib/utils/default-account";
import {
    TRANSACTION_FIELD_ORDER,
    isDueDateRequired,
    isDueDateVisible,
    validateTransaction,
    type TransactionFieldKey,
    type TransactionFormErrors,
} from "@/lib/utils/transaction-validation";

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// Options of the type selector.
// The selected option uses the soft status style (subtle background, colored text and border), like StatusBadge.
const TYPE_OPTIONS: { value: TransactionKind; label: string; status: 'danger' | 'success' | 'info' }[] = [
    { value: 'EXPENSE', label: 'Despesa', status: 'danger' },
    { value: 'INCOME', label: 'Receita', status: 'success' },
    { value: 'transfer', label: 'Transferência', status: 'info' },
];

const TRANSFER_NAME = 'Transferência';

// 422: an expense pointed at an investment account (the API has the final word on the account type).
const SAVE_ERROR_MESSAGES = {
    400: "Dados inválidos. Verifique os campos e tente novamente.",
    422: "Contas de investimento não aceitam despesas. Use uma transferência para movimentar o dinheiro.",
};

// Intent of an unpaid expense (texts and meaning are owned by TKN-16; only the presentation changed here).
const INTENT_OPTIONS = [
    {
        value: 'bill',
        icon: Calendar,
        title: 'Conta/Compromisso agendado',
        description: 'Conta fixa ou despesa planejada, com data de vencimento',
    },
    {
        value: 'purchase',
        icon: Zap,
        title: 'Compra/Gasto impulsivo',
        description: 'Compra espontânea ou despesa sem data fixa',
    },
] as const;

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
    // The category is derived from the subcategory (see `categoryId` below); `categoryPick` only holds a
    // category chosen by hand while no subcategory is selected yet.
    const [categoryPick, setCategoryPick] = useState<string>("");
    const [subcategoryId, setSubcategoryId] = useState<string>("");
    // For a transfer, the origin account.
    const [accountId, setAccountId] = useState<string>("");
    const [targetAccountId, setTargetAccountId] = useState<string>("");
    const [type, setType] = useState<TransactionKind>('EXPENSE');
    const [paid, setPaid] = useState<boolean>(false);
    const [paymentDate, setPaymentDate] = useState<string>(todayLocalISO());
    const amountInputRef = useRef<HTMLInputElement | null>(null);
    const nameInputRef = useRef<HTMLInputElement | null>(null);
    // Points at whichever date input is visible (payment date or due date, never both).
    const dateInputRef = useRef<HTMLInputElement | null>(null);
    const accountSelectRef = useRef<HTMLSelectElement | null>(null);
    const targetAccountSelectRef = useRef<HTMLSelectElement | null>(null);
    // Focusable (hidden radio) input of each type option, used for the initial focus.
    const typeInputRefs = useRef<Partial<Record<TransactionKind, HTMLInputElement | null>>>({});
    const confirm = useConfirm();
    const [isBill, setIsBill] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    // Synchronous guard: `loading` only updates on the next render, so a fast double click could slip through.
    const submittingRef = useRef<boolean>(false);
    // Errors only show after the first save attempt; they are derived, so they re-evaluate on every change.
    const [submitted, setSubmitted] = useState<boolean>(false);

    const errors = useMemo(
        () => validateTransaction({ name, amount, accountId, targetAccountId, type, paid, isBill, dueDate, paymentDate }),
        [name, amount, accountId, targetAccountId, type, paid, isBill, dueDate, paymentDate],
    );
    const transferSelected = type === 'transfer';
    // The API can't change a transfer's amount or accounts, so those fields (and the type) are locked when editing one.
    const editingTransfer = !!transaction && isTransfer(transaction);
    // An expense only offers checking accounts. When editing, the transaction's own account is kept as an option,
    // so an expense recorded before its account became an investment account still shows where it is.
    const accountOptions = useMemo(() => {
        const options = accountsForType(accounts, type);
        if (transaction && !options.some((a) => a.id === transaction.account_id)) {
            const own = accounts.find((a) => a.id === transaction.account_id);
            if (own) return [...options, own];
        }
        return options;
    }, [accounts, type, transaction]);
    const visibleErrors: TransactionFormErrors = submitted ? errors : {};
    const dueDateRequired = isDueDateRequired({ paid, type, isBill });
    // Switching the type never touches `isBill`, so the intent choice survives a round trip; this decides the field instead.
    const dueDateVisible = isDueDateVisible({ paid, type, isBill });
    const selectedTypeStatus = TYPE_OPTIONS.find((option) => option.value === type)?.status ?? 'danger';
    // Follows the selected subcategory, so it also resolves when the subcategory list arrives after the form opened.
    const categoryId = subcategories.find((s) => s.id === subcategoryId)?.categoryId ?? categoryPick;

    // Resets the form only when it opens or when the transaction/draft changes. The related lists
    // (subcategories, categories, accounts) must stay out of these dependencies: reloading them while the
    // form is open would wipe what the user typed.
    useEffect(() => {
        if (!open) return;

        setSubmitted(false);
        setPaid(false);
        setPaymentDate(todayLocalISO());

        if (transaction) {
            setName(transaction.name);
            setDescription(transaction.description);
            setAmount(transaction.amount);
            setDueDate(transaction.due_date ?? "");
            setIsBill(!!transaction.due_date);
            setSubcategoryId(transaction.subcategory_id ?? "");
            setCategoryPick("");
            setType(transaction.type);
            if (isTransfer(transaction)) {
                // Either leg may be opened; show the real direction of the money.
                const { fromId, toId } = transferEnds(transaction);
                setAccountId(fromId);
                setTargetAccountId(toId);
                setPaymentDate(toDateInputFromStored(transaction.payment_date) || todayLocalISO());
            } else {
                setAccountId(transaction.account_id);
                setTargetAccountId("");
            }
        } else if (draft) {
            setName(draft.name ?? "");
            setDescription("");
            setAmount(draft.amount ?? 0);
            setDueDate("");
            setIsBill(true);
            setSubcategoryId(draft.subcategory_id ?? "");
            setCategoryPick("");
            setAccountId(draft.account_id ?? "");
            setTargetAccountId("");
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
            setCategoryPick("");
            setSubcategoryId("");
            setAccountId("");
            setTargetAccountId("");
            setType('EXPENSE');
        }
    }, [open, transaction, draft]);

    // Pre-selects the default account on a new transaction. It only fills an empty field, so it never
    // overrides a draft/suggestion/manual choice, and it re-runs when the reset effect above re-runs
    // (it blanks the account) or when the accounts finish loading after the modal opened.
    // Declared after the reset effect so it runs after it within the same commit.
    // Only accounts allowed for the selected type are candidates (an expense never defaults to an investment account).
    useEffect(() => {
        if (!open || transaction) return;
        const defaultId = resolveDefaultAccountId(accountsForType(accounts, type), getLastAccountId());
        if (defaultId) setAccountId((current) => current || defaultId);
    }, [open, transaction, draft, accounts, type]);

    // An expense can't use an investment account: switching to expense, or a draft/suggestion bringing one,
    // clears it and falls back to the default. The account of the transaction being edited is left alone.
    useEffect(() => {
        if (!open || type !== 'EXPENSE' || !accountId) return;
        if (transaction && transaction.account_id === accountId) return;
        const selected = accounts.find((a) => a.id === accountId);
        if (!isInvestmentAccount(selected)) return;
        setAccountId(resolveDefaultAccountId(accountsForType(accounts, 'EXPENSE'), getLastAccountId()));
    }, [open, type, accountId, accounts, transaction]);

    function changeType(next: TransactionKind) {
        setType(next);
        if (next === 'transfer') setName((current) => current.trim() ? current : TRANSFER_NAME);
    }

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
        if (isTransfer(suggestion)) {
            const { fromId, toId } = transferEnds(suggestion);
            setAccountId(fromId);
            setTargetAccountId(toId);
        } else {
            setAccountId(suggestion.account_id ?? "");
        }
        setSubcategoryId(sub?.id ?? "");
        setCategoryPick("");
        setPaid(false);
        setIsBill(!!suggestion.due_date);
        setDueDate(projectDueDateToCurrentMonth(suggestion.due_date));
    }

    function focusField(field: TransactionFieldKey) {
        const refs: Record<TransactionFieldKey, { current: HTMLElement | null }> = {
            name: nameInputRef,
            amount: amountInputRef,
            date: dateInputRef,
            account: accountSelectRef,
            targetAccount: targetAccountSelectRef,
        };
        refs[field].current?.focus();
    }

    // Single entry point for saving (button today, Enter later): validate, then call the API.
    // Creating saves directly; editing still asks for confirmation first.
    function requestSave() {
        setSubmitted(true);

        const firstInvalid = TRANSACTION_FIELD_ORDER.find((field) => errors[field]);
        if (firstInvalid) {
            focusField(firstInvalid);
            return;
        }

        if (submittingRef.current) return;
        submittingRef.current = true;

        if (!transaction) {
            void store();
            return;
        }

        void confirm({ title: "Confirmar", text: "Deseja atualizar esta transação?" }).then((willProceed) => {
            if (willProceed) {
                void update();
            } else {
                submittingRef.current = false;
            }
        });
    }

    async function store() {
        setLoading(true);
        try {
            if (transferSelected) {
                await createTransaction({
                    name: name.trim(),
                    description,
                    amount,
                    payment_date: paymentDate,
                    account_id: accountId,
                    target_account_id: targetAccountId,
                    type: 'transfer',
                });
                setLastAccountId(accountId);
                notifySuccess("Transferência criada com sucesso!");
                onSaved();
                onClose();
                return;
            }
            const computedDueDate = paid ? undefined : (dueDateVisible ? (dueDate || undefined) : undefined);
            await createTransaction({
                name: name.trim(),
                description,
                amount,
                due_date: computedDueDate,
                payment_date: paid ? paymentDate : undefined,
                paid_amount: paid ? amount : undefined,
                subcategory_id: subcategoryId || undefined,
                account_id: accountId,
                type,
            });
            setLastAccountId(accountId);
            notifySuccess("Transação criada com sucesso!");
            onSaved();
            onClose();
        } catch (error) {
            const message = getErrorMessage(error, "Não foi possível criar a transação", {
                ...SAVE_ERROR_MESSAGES,
                404: "Conta ou subcategoria não encontrada.",
            });
            notifyError(message);
        } finally {
            submittingRef.current = false;
            setLoading(false);
        }
    }

    async function update() {
        if (!transaction) return;
        setLoading(true);
        try {
            if (editingTransfer) {
                // Amount and accounts can't change on a transfer; only these fields are sent.
                await updateTransaction(transaction.id, { name: name.trim(), description, payment_date: paymentDate });
                notifySuccess("Transferência atualizada com sucesso!");
                onSaved();
                onClose();
                return;
            }
            const todayISO = todayLocalISO();
            const computedDueDate = paid ? todayISO : (dueDateVisible ? (dueDate || undefined) : undefined);
            await updateTransaction(transaction.id, {
                name: name.trim(),
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
                ...SAVE_ERROR_MESSAGES,
                404: "Transação não encontrada. Ela pode ter sido excluída.",
            });
            notifyError(message);
        } finally {
            submittingRef.current = false;
            setLoading(false);
        }
    }

    return (
        <Dialog.Root
            open={open}
            onOpenChange={(e) => { if (!e.open) onClose(); }}
            // Focus starts on the selected type option. The type comes from the props, not the state: this runs
            // before the reset effect applies it. A draft without an amount asks for it, so it lands on the amount.
            initialFocusEl={() => {
                if (!transaction && draft && draft.amount == null) return amountInputRef.current;
                const initialType = transaction?.type ?? draft?.type ?? 'EXPENSE';
                return typeInputRefs.current[initialType] ?? null;
            }}
        >
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>{transaction ? 'Editar Transação' : 'Nova Transação'}</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Stack gap={4}>
                                <Field.Root>
                                    <Field.Label>Tipo</Field.Label>
                                    <SegmentGroup.Root
                                        value={type}
                                        onValueChange={(e) => { if (e.value) changeType(e.value as TransactionKind); }}
                                        disabled={editingTransfer}
                                        w="full"
                                        css={{
                                            "--segment-indicator-bg": `colors.status.${selectedTypeStatus}.subtle`,
                                            "--segment-indicator-shadow": `inset 0 0 0 1px var(--chakra-colors-status-${selectedTypeStatus})`,
                                        }}
                                    >
                                        <SegmentGroup.Indicator />
                                        {TYPE_OPTIONS.map((option) => (
                                            <SegmentGroup.Item
                                                key={option.value}
                                                value={option.value}
                                                // An income/expense can't become a transfer (or back): that's a different record in the API.
                                                disabled={!!transaction && !editingTransfer && option.value === 'transfer'}
                                                flex="1"
                                                cursor="pointer"
                                                fontWeight="medium"
                                                _checked={{ color: `status.${option.status}` }}
                                                // The recipe only rings on :focus-visible; the initial programmatic focus
                                                // after a mouse click would not match it, so ring on any focus.
                                                css={{ "&:has(input:focus)": { focusRing: "outside" } }}
                                            >
                                                <SegmentGroup.ItemText>{option.label}</SegmentGroup.ItemText>
                                                <SegmentGroup.ItemHiddenInput
                                                    ref={(el: HTMLInputElement | null) => { typeInputRefs.current[option.value] = el; }}
                                                />
                                            </SegmentGroup.Item>
                                        ))}
                                    </SegmentGroup.Root>
                                </Field.Root>

                                <Field.Root required invalid={!!visibleErrors.name}>
                                    <Field.Label>Nome <Field.RequiredIndicator /></Field.Label>
                                    {transaction ? (
                                        <Input ref={nameInputRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da transação" />
                                    ) : (
                                        <Autocomplete<Transaction>
                                            ref={nameInputRef}
                                            invalid={!!visibleErrors.name}
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
                                    <Field.ErrorText>{visibleErrors.name}</Field.ErrorText>
                                </Field.Root>

                                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                    <Field.Root required invalid={!!visibleErrors.amount}>
                                        <Field.Label>Valor <Field.RequiredIndicator /></Field.Label>
                                        <MoneyInput
                                            value={amount}
                                            onValueChange={setAmount}
                                            inputRef={amountInputRef}
                                            disabled={editingTransfer}
                                        />
                                        <Field.ErrorText>{visibleErrors.amount}</Field.ErrorText>
                                    </Field.Root>
                                    <Field.Root required invalid={!!visibleErrors.account} disabled={editingTransfer}>
                                        <Field.Label>{transferSelected ? 'Conta de origem' : 'Conta'} <Field.RequiredIndicator /></Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field ref={accountSelectRef} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                                                <option value="">Selecione...</option>
                                                {accountOptions.map((account) => (
                                                    <option key={account.id} value={account.id}>{account.description}</option>
                                                ))}
                                            </NativeSelect.Field>
                                            <NativeSelect.Indicator />
                                        </NativeSelect.Root>
                                        <Field.ErrorText>{visibleErrors.account}</Field.ErrorText>
                                    </Field.Root>
                                </SimpleGrid>

                                {transferSelected && (
                                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                        <Field.Root required invalid={!!visibleErrors.targetAccount} disabled={editingTransfer}>
                                            <Field.Label>Conta de destino <Field.RequiredIndicator /></Field.Label>
                                            <NativeSelect.Root>
                                                <NativeSelect.Field
                                                    ref={targetAccountSelectRef}
                                                    value={targetAccountId}
                                                    onChange={(e) => setTargetAccountId(e.target.value)}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {accounts.map((account) => (
                                                        <option key={account.id} value={account.id}>{account.description}</option>
                                                    ))}
                                                </NativeSelect.Field>
                                                <NativeSelect.Indicator />
                                            </NativeSelect.Root>
                                            <Field.ErrorText>{visibleErrors.targetAccount}</Field.ErrorText>
                                        </Field.Root>
                                        <Field.Root required invalid={!!visibleErrors.date}>
                                            <Field.Label>Data da transferência <Field.RequiredIndicator /></Field.Label>
                                            <Input ref={dateInputRef} type="date" value={paymentDate} max={todayLocalISO()} onChange={(e) => setPaymentDate(e.target.value)} />
                                            <Field.ErrorText>{visibleErrors.date}</Field.ErrorText>
                                        </Field.Root>
                                    </SimpleGrid>
                                )}
                                {editingTransfer && (
                                    <Text fontSize="sm" color="text.muted">
                                        Para mudar valor ou contas, exclua e crie a transferência de novo.
                                    </Text>
                                )}

                                {/* Kept as its own row so TKN-15 can swap it for a single combobox. */}
                                {!transferSelected && (
                                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                    <Field.Root>
                                        <Field.Label>Categoria</Field.Label>
                                        <NativeSelect.Root>
                                            <NativeSelect.Field
                                                value={categoryId}
                                                onChange={(e) => {
                                                    setCategoryPick(e.target.value);
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
                                )}

                                {!transferSelected && (
                                    <Switch
                                        checked={paid}
                                        onCheckedChange={(e) => setPaid(e.checked)}
                                        label={type === 'INCOME' ? 'Já foi recebida' : 'Já foi paga'}
                                    />
                                )}

                                {!paid && type === 'EXPENSE' && (
                                    <RadioCard.Root
                                        size="sm"
                                        value={isBill ? "bill" : "purchase"}
                                        onValueChange={(e) => setIsBill(e.value === "bill")}
                                    >
                                        <RadioCard.Label>Qual é o tipo desta transação?</RadioCard.Label>
                                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                                            {INTENT_OPTIONS.map((option) => {
                                                const checked = (option.value === "bill") === isBill;
                                                const Icon = option.icon;
                                                return (
                                                    <RadioCard.Item
                                                        key={option.value}
                                                        value={option.value}
                                                        cursor="pointer"
                                                        _checked={{
                                                            borderColor: "brand.primary",
                                                            bg: "brand.primary.subtle",
                                                            boxShadow: "0 0 0 1px var(--chakra-colors-brand-primary)",
                                                        }}
                                                    >
                                                        <RadioCard.ItemHiddenInput />
                                                        <RadioCard.ItemControl alignItems="flex-start" gap={3}>
                                                            <Box pt="0.5" color={checked ? "brand.primary" : "text.muted"}>
                                                                <Icon size={18} />
                                                            </Box>
                                                            <RadioCard.ItemContent>
                                                                <RadioCard.ItemText fontWeight="medium">{option.title}</RadioCard.ItemText>
                                                                <RadioCard.ItemDescription color="text.muted">{option.description}</RadioCard.ItemDescription>
                                                            </RadioCard.ItemContent>
                                                        </RadioCard.ItemControl>
                                                    </RadioCard.Item>
                                                );
                                            })}
                                        </SimpleGrid>
                                    </RadioCard.Root>
                                )}

                                {paid && !transferSelected && (
                                    <Field.Root required invalid={!!visibleErrors.date}>
                                        <Field.Label>Data do pagamento <Field.RequiredIndicator /></Field.Label>
                                        <Input ref={dateInputRef} type="date" value={paymentDate} max={todayLocalISO()} onChange={(e) => setPaymentDate(e.target.value)} />
                                        <Field.ErrorText>{visibleErrors.date}</Field.ErrorText>
                                    </Field.Root>
                                )}
                                {dueDateVisible && (
                                    <Field.Root required={dueDateRequired} invalid={!!visibleErrors.date}>
                                        <Field.Label>Data Vencimento <Field.RequiredIndicator /></Field.Label>
                                        <Input ref={dateInputRef} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                                        <Field.ErrorText>{visibleErrors.date}</Field.ErrorText>
                                    </Field.Root>
                                )}

                                <Field.Root>
                                    <Field.Label>Descrição</Field.Label>
                                    <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição" />
                                </Field.Root>
                            </Stack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Stack direction="row" gap={2}>
                                <Button variant="outline" onClick={onClose} disabled={loading}>
                                    <X size={16} />
                                    Cancelar
                                </Button>
                                <Button colorPalette="primary" onClick={requestSave} disabled={loading}>
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
