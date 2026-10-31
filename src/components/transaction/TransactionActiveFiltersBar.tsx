"use client"
import { X } from 'react-feather';
import { HStack, Text } from "@chakra-ui/react";
import { Button } from "tikin-uai";
import StatusBadge from "@/components/StatusBadge";
import type { TransactionFilters } from "@/lib/types/transaction";
import type { Category } from "@/lib/types/category";
import type { Subcategory } from "@/lib/types/subcategory";
import type { BankAccount } from "@/lib/types/bank-account";
import { formatDateBR } from "@/lib/utils/date";

type TransactionActiveFiltersBarProps = {
    filters: TransactionFilters;
    categories: Category[];
    subcategories: Subcategory[];
    accounts: BankAccount[];
    onClear: () => void;
};

export default function TransactionActiveFiltersBar({
    filters,
    categories,
    subcategories,
    accounts,
    onClear,
}: TransactionActiveFiltersBarProps) {
    const accountLabel = filters.account_id
        ? accounts.find((a) => a.id === filters.account_id)?.description
        : undefined;

    const subcategory = filters.subcategory_id
        ? subcategories.find((s) => s.id === filters.subcategory_id)
        : undefined;
    const category = filters.category_id
        ? categories.find((c) => c.id === filters.category_id)
        : subcategory
            ? categories.find((c) => c.id === subcategory.categoryId)
            : undefined;

    return (
        <HStack gap={2} mb={4} flexWrap="wrap">
            <Text fontSize="sm" color="fg.muted">Filtros aplicados:</Text>

            {filters.from && filters.to && (
                <StatusBadge status="info" variant="outline">
                    Período: {formatDateBR(filters.from)} – {formatDateBR(filters.to)}
                </StatusBadge>
            )}

            {filters.type && (
                <StatusBadge status={filters.type === 'EXPENSE' ? "danger" : "success"} variant="outline">
                    Tipo: {filters.type === 'EXPENSE' ? "Despesa" : "Receita"}
                </StatusBadge>
            )}

            {accountLabel && (
                <StatusBadge status="primary" variant="outline">
                    Conta: {accountLabel}
                </StatusBadge>
            )}

            {category && (
                <StatusBadge status="primary" variant="outline">
                    Categoria: {category.name}{subcategory ? ` / ${subcategory.name}` : ""}
                </StatusBadge>
            )}

            <Button size="sm" variant="ghost" onClick={onClear}>
                <X size={14} />
                Limpar filtros
            </Button>
        </HStack>
    );
}
