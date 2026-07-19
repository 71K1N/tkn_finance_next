"use client"
import { useEffect, useState } from "react";
import { Filter, X } from 'react-feather';
import { Button, RadioGroup, Radio } from "tikin-ds";
import { Dialog, Field, Input, NativeSelect, Portal, SimpleGrid, Stack } from "@chakra-ui/react";
import type { TransactionFilters, TransactionType } from "@/lib/types/transaction";
import type { Category } from "@/lib/types/category";
import type { Subcategory } from "@/lib/types/subcategory";
import type { BankAccount } from "@/lib/types/bank-account";

type TransactionFilterModalProps = {
    open: boolean;
    filters: TransactionFilters;
    defaultFilters: TransactionFilters;
    categories: Category[];
    subcategories: Subcategory[];
    accounts: BankAccount[];
    onClose: () => void;
    onApply: (filters: TransactionFilters) => void;
};

export default function TransactionFilterModal({
    open,
    filters,
    defaultFilters,
    categories,
    subcategories,
    accounts,
    onClose,
    onApply,
}: TransactionFilterModalProps) {
    const [from, setFrom] = useState<string>("");
    const [to, setTo] = useState<string>("");
    const [type, setType] = useState<TransactionType | "">("");
    const [accountId, setAccountId] = useState<string>("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [subcategoryId, setSubcategoryId] = useState<string>("");

    useEffect(() => {
        if (!open) return;
        setFrom(filters.from ?? "");
        setTo(filters.to ?? "");
        setType(filters.type ?? "");
        setAccountId(filters.account_id ?? "");
        setSubcategoryId(filters.subcategory_id ?? "");
        const sub = subcategories.find((s) => s.id === filters.subcategory_id);
        setCategoryId(filters.category_id ?? sub?.categoryId ?? "");
    }, [open, filters, subcategories]);

    function handleClear() {
        setFrom(defaultFilters.from ?? "");
        setTo(defaultFilters.to ?? "");
        setType("");
        setAccountId("");
        setCategoryId("");
        setSubcategoryId("");
    }

    function handleApply() {
        onApply({
            from: from || undefined,
            to: to || undefined,
            type: type || undefined,
            account_id: accountId || undefined,
            category_id: categoryId || undefined,
            subcategory_id: subcategoryId || undefined,
        });
        onClose();
    }

    return (
        <Dialog.Root open={open} onOpenChange={(e) => { if (!e.open) onClose(); }}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Filtros</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                <Field.Root>
                                    <Field.Label>De</Field.Label>
                                    <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Até</Field.Label>
                                    <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                                </Field.Root>
                            </SimpleGrid>

                            <Field.Root mt={4}>
                                <Field.Label>Tipo</Field.Label>
                                <RadioGroup value={type || "ALL"} onValueChange={(e) => setType(e.value === "ALL" ? "" : e.value as TransactionType)}>
                                    <Stack direction="row" gap={4}>
                                        <Radio value="ALL" label="Todos" />
                                        <Radio value="EXPENSE" label="Despesa" />
                                        <Radio value="INCOME" label="Receita" />
                                    </Stack>
                                </RadioGroup>
                            </Field.Root>

                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} mt={4}>
                                <Field.Root>
                                    <Field.Label>Conta</Field.Label>
                                    <NativeSelect.Root>
                                        <NativeSelect.Field value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                                            <option value="">Todas</option>
                                            {accounts.map((account) => (
                                                <option key={account.id} value={account.id}>{account.description}</option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>
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
                                            <option value="">Todas</option>
                                            {categories.map((category) => (
                                                <option key={category.id} value={category.id}>{category.name}</option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Field.Root>
                            </SimpleGrid>

                            <Field.Root mt={4}>
                                <Field.Label>Subcategoria</Field.Label>
                                <NativeSelect.Root>
                                    <NativeSelect.Field value={subcategoryId} onChange={(e) => setSubcategoryId(e.target.value)}>
                                        <option value="">Todas</option>
                                        {subcategories
                                            .filter((sub) => sub.categoryId === categoryId)
                                            .map((sub) => (
                                                <option key={sub.id} value={sub.id}>{sub.name}</option>
                                            ))}
                                    </NativeSelect.Field>
                                    <NativeSelect.Indicator />
                                </NativeSelect.Root>
                            </Field.Root>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Stack direction="row" gap={2}>
                                <Button variant="outline" onClick={handleClear}>
                                    <X size={16} />
                                    Limpar
                                </Button>
                                <Button colorPalette="primary" onClick={handleApply}>
                                    <Filter size={16} />
                                    Aplicar
                                </Button>
                            </Stack>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
