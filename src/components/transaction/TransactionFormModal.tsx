"use client"
import { useEffect, useState } from "react";
import { Save, X } from 'react-feather';
import swal from 'sweetalert';
import { Button } from "tikin-ds";
import { Dialog, Field, Input, NativeSelect, Portal, SimpleGrid, Stack } from "@chakra-ui/react";
import { createTransaction, updateTransaction } from "@/lib/api/transaction";
import type { Transaction, TransactionType } from "@/lib/types/transaction";
import type { Category } from "@/lib/types/category";
import type { Subcategory } from "@/lib/types/subcategory";
import type { BankAccount } from "@/lib/types/bank-account";
import MoneyInput from "@/components/common/MoneyInput";

type TransactionFormModalProps = {
    open: boolean;
    transaction: Transaction | null;
    categories: Category[];
    subcategories: Subcategory[];
    accounts: BankAccount[];
    onClose: () => void;
    onSaved: () => void;
};

export default function TransactionFormModal({
    open,
    transaction,
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
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!open) return;

        if (transaction) {
            setName(transaction.name);
            setDescription(transaction.description);
            setAmount(transaction.amount);
            setDueDate(transaction.due_date ?? "");
            setSubcategoryId(transaction.subcategory_id ?? "");
            const sub = subcategories.find((s) => s.id === transaction.subcategory_id);
            setCategoryId(sub?.categoryId ?? "");
            setAccountId(transaction.account_id);
            setType(transaction.type);
        } else {
            setName("");
            setDescription("");
            setAmount(0);
            setDueDate("");
            setCategoryId("");
            setSubcategoryId("");
            setAccountId("");
            setType('EXPENSE');
        }
    }, [open, transaction, subcategories]);

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
            onSaved();
            onClose();
        } catch (error) {
            swal("Erro!", "Não foi possível criar a transação", "error");
        } finally {
            setLoading(false);
        }
    }

    async function update() {
        if (!transaction) return;
        setLoading(true);
        try {
            await updateTransaction(transaction.id, {
                name,
                description,
                amount,
                due_date: dueDate,
                subcategory_id: subcategoryId || undefined,
                account_id: accountId,
                type,
            });
            swal("Sucesso!", "Transação atualizada com sucesso!", "success");
            onSaved();
            onClose();
        } catch (error) {
            swal("Erro!", "Não foi possível atualizar a transação", "error");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={(e) => { if (!e.open) onClose(); }}>
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
                                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da transação" />
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
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Data Vencimento</Field.Label>
                                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                                </Field.Root>
                            </SimpleGrid>

                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={4}>
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
