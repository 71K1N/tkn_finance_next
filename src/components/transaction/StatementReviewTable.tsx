"use client"
import { Box, Checkbox, Input, NativeSelect, SimpleGrid, Stack, Table, Text } from "@chakra-ui/react";
import StatusBadge, { type BadgeStatus } from "@/components/StatusBadge";
import { useFormatCurrency } from "@/lib/hooks/useFormatCurrency";
import { availableChoices, type ReviewRow, type RowChoice } from "@/lib/statement/review";
import type { BankAccount } from "@/lib/types/bank-account";
import type { Category } from "@/lib/types/category";
import type { Subcategory } from "@/lib/types/subcategory";
import type { Transaction } from "@/lib/types/transaction";
import { formatDateBR } from "@/lib/utils/date";

const CHOICE_LABEL: Record<RowChoice, string> = {
    imported: "Já importada",
    create: "Criar transação",
    settle: "Dar baixa",
    transfer: "Transferência",
    ignore: "Ignorar",
};

const CLASSIFICATION: Record<ReviewRow["line"]["action"]["kind"], { label: string; status: BadgeStatus }> = {
    imported: { label: "Já importada", status: "neutral" },
    transfer: { label: "Possível transferência", status: "info" },
    settle: { label: "Baixa sugerida", status: "success" },
    ambiguous: { label: "Mais de uma candidata", status: "warning" },
    create: { label: "Nova", status: "primary" },
};

type StatementReviewTableProps = {
    rows: ReviewRow[];
    errors: (string | null)[];
    transactions: Transaction[];
    categories: Category[];
    subcategories: Subcategory[];
    accounts: BankAccount[];
    /** The account the statement belongs to; it can't be the other side of a transfer. */
    accountId: string;
    onChange: (index: number, patch: Partial<ReviewRow>) => void;
};

export default function StatementReviewTable({
    rows,
    errors,
    transactions,
    categories,
    subcategories,
    accounts,
    accountId,
    onChange,
}: StatementReviewTableProps) {
    const formatCurrency = useFormatCurrency();

    function details(row: ReviewRow, index: number) {
        if (row.choice === "create") {
            return (
                <Stack gap={2}>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={2}>
                        <Input size="sm" value={row.name} onChange={(e) => onChange(index, { name: e.target.value })} placeholder="Nome" />
                        <Input size="sm" value={row.description} onChange={(e) => onChange(index, { description: e.target.value })} placeholder="Descrição" />
                    </SimpleGrid>
                    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={2}>
                        <NativeSelect.Root size="sm">
                            <NativeSelect.Field
                                value={row.categoryId}
                                onChange={(e) => onChange(index, { categoryId: e.target.value, subcategoryId: "", saveRule: false })}
                            >
                                <option value="">Categoria...</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        <NativeSelect.Root size="sm">
                            <NativeSelect.Field
                                value={row.subcategoryId}
                                onChange={(e) => onChange(index, { subcategoryId: e.target.value })}
                            >
                                <option value="">Subcategoria...</option>
                                {subcategories
                                    .filter((sub) => sub.categoryId === row.categoryId)
                                    .map((sub) => (
                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                    ))}
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                        </NativeSelect.Root>
                    </SimpleGrid>
                    {row.subcategoryId && (
                        <Checkbox.Root checked={row.saveRule} onCheckedChange={(e) => onChange(index, { saveRule: !!e.checked })}>
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>Usar esta subcategoria para &quot;{row.line.counterpart}&quot;</Checkbox.Label>
                        </Checkbox.Root>
                    )}
                </Stack>
            );
        }

        if (row.choice === "settle") {
            return (
                <NativeSelect.Root size="sm">
                    <NativeSelect.Field value={row.settleId} onChange={(e) => onChange(index, { settleId: e.target.value })}>
                        <option value="">Selecione a transação...</option>
                        {row.candidateIds.map((id) => {
                            const candidate = transactions.find((transaction) => transaction.id === id);
                            return (
                                <option key={id} value={id}>
                                    {candidate
                                        ? `${candidate.name} • ${formatCurrency(candidate.amount)} • venc. ${formatDateBR(candidate.due_date)}`
                                        : id}
                                </option>
                            );
                        })}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
            );
        }

        if (row.choice === "transfer") {
            const outgoing = row.line.amount < 0;
            return (
                <NativeSelect.Root size="sm">
                    <NativeSelect.Field value={row.otherAccountId} onChange={(e) => onChange(index, { otherAccountId: e.target.value })}>
                        <option value="">{outgoing ? "Conta de destino..." : "Conta de origem..."}</option>
                        {accounts
                            .filter((account) => account.id !== accountId)
                            .map((account) => (
                                <option key={account.id} value={account.id}>{account.description}</option>
                            ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                </NativeSelect.Root>
            );
        }

        return null;
    }

    return (
        <Box overflow="auto" maxH="65vh" borderWidth="1px" rounded="md">
            <Table.Root size="sm" stickyHeader>
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader w="110px">Data</Table.ColumnHeader>
                        <Table.ColumnHeader minW="220px">Lançamento</Table.ColumnHeader>
                        <Table.ColumnHeader w="120px" textAlign="end">Valor</Table.ColumnHeader>
                        <Table.ColumnHeader w="170px">Ação</Table.ColumnHeader>
                        <Table.ColumnHeader minW="320px">Detalhes</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {rows.map((row, index) => {
                        const { line } = row;
                        const classification = CLASSIFICATION[line.action.kind];
                        const error = errors[index];
                        return (
                            <Table.Row key={line.key} bg={error ? "bg.error" : undefined} opacity={row.choice === "imported" || row.choice === "ignore" ? 0.65 : 1}>
                                <Table.Cell verticalAlign="top">
                                    <Text>{formatDateBR(line.date)}</Text>
                                    <Text fontSize="xs" color="text.muted">{line.time}</Text>
                                </Table.Cell>
                                <Table.Cell verticalAlign="top">
                                    <Text fontWeight="medium">{line.counterpart}</Text>
                                    <Text fontSize="xs" color="text.muted" mb={1}>{line.type}</Text>
                                    <StatusBadge status={classification.status} variant="surface">{classification.label}</StatusBadge>
                                </Table.Cell>
                                <Table.Cell verticalAlign="top" textAlign="end">
                                    <Text color={line.amount < 0 ? "red.solid" : "green.solid"}>{formatCurrency(Math.abs(line.amount))}</Text>
                                </Table.Cell>
                                <Table.Cell verticalAlign="top">
                                    <NativeSelect.Root size="sm" disabled={row.choice === "imported"}>
                                        <NativeSelect.Field
                                            value={row.choice}
                                            onChange={(e) => onChange(index, { choice: e.target.value as RowChoice })}
                                        >
                                            {availableChoices(row).map((choice) => (
                                                <option key={choice} value={choice}>{CHOICE_LABEL[choice]}</option>
                                            ))}
                                        </NativeSelect.Field>
                                        <NativeSelect.Indicator />
                                    </NativeSelect.Root>
                                </Table.Cell>
                                <Table.Cell verticalAlign="top">
                                    {details(row, index)}
                                    {error && <Text fontSize="xs" color="red.solid" mt={1}>{error}</Text>}
                                </Table.Cell>
                            </Table.Row>
                        );
                    })}
                </Table.Body>
            </Table.Root>
        </Box>
    );
}
