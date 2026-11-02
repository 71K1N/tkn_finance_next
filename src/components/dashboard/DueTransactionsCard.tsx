"use client"
import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { Calendar } from "react-feather";
import { Button, Card, Flex, Heading, Link, Skeleton, Stack, Text } from "@chakra-ui/react";
import StatusBadge from "@/components/StatusBadge";
import TransactionPaymentModal from "@/components/transaction/TransactionPaymentModal";
import { TRANSACTIONS_CHANGED_EVENT } from "@/components/transaction/QuickEntryDialog";
import { getDueTransactions } from "@/lib/api/transaction";
import type { DueGroup, DueTransactions, Transaction } from "@/lib/types/transaction";
import { useFormatCurrency } from "@/lib/hooks/useFormatCurrency";
import { addDaysISO, relativeDueLabel, todayLocalISO } from "@/lib/utils/date";

const WINDOW_OPTIONS = [7, 15, 30] as const;
const DEFAULT_WINDOW = 7;
const STORAGE_KEY = "home:due-window";

type DueTransactionsCardProps = {
    /** Called after transactions changed (a payment, or a quick entry), so the page can refresh balance/summary. */
    onChanged?: () => void;
};

function readStoredWindow(): number {
    try {
        const stored = Number(window.localStorage.getItem(STORAGE_KEY));
        return (WINDOW_OPTIONS as readonly number[]).includes(stored) ? stored : DEFAULT_WINDOW;
    } catch {
        return DEFAULT_WINDOW;
    }
}

function storeWindow(days: number) {
    try {
        window.localStorage.setItem(STORAGE_KEY, String(days));
    } catch {
        // Storage can be unavailable (private mode, blocked site data); the choice just isn't remembered.
    }
}

export default function DueTransactionsCard({ onChanged }: DueTransactionsCardProps) {
    const formatCurrency = useFormatCurrency();
    const [days, setDays] = useState<number>(DEFAULT_WINDOW);
    const [data, setData] = useState<DueTransactions | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [paying, setPaying] = useState<Transaction | null>(null);

    // The stored window is read after mount: the server render cannot know it.
    useEffect(() => {
        setDays(readStoredWindow());
    }, []);

    const load = useCallback(async (windowDays: number) => {
        setLoading(true);
        setError(false);
        try {
            setData(await getDueTransactions(windowDays));
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(days);
    }, [days, load]);

    // Quick entry and other screens can change transactions while the home is mounted.
    useEffect(() => {
        const handleChanged = () => {
            load(days);
            onChanged?.();
        };
        window.addEventListener(TRANSACTIONS_CHANGED_EVENT, handleChanged);
        return () => window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, handleChanged);
    }, [days, load, onChanged]);

    function handleSelectWindow(next: number) {
        storeWindow(next);
        setDays(next);
    }

    // TransactionPaymentModal calls onSaved after success and after a failed attempt
    // (e.g. 409 already paid), so a refresh is right in both cases.
    function handleSaved() {
        load(days);
        onChanged?.();
    }

    const today = todayLocalISO();

    function renderGroup(title: string, status: "danger" | "warning", group: DueGroup, emptyText: string, seeAllHref: string) {
        return (
            <Stack gap={2}>
                <Flex align="center" justify="space-between" gap={2} wrap="wrap">
                    <Flex align="center" gap={2}>
                        <Heading size="sm">{title}</Heading>
                        <StatusBadge status={status}>{group.count}</StatusBadge>
                    </Flex>
                    {group.count > 0 && (
                        <Text fontSize="sm" color="fg.muted">{formatCurrency(group.total)}</Text>
                    )}
                </Flex>
                {group.items.length === 0 ? (
                    <Text color="fg.muted" fontSize="sm">{emptyText}</Text>
                ) : (
                    <Stack gap={0} divideY="1px">
                        {group.items.map((t) => {
                            const isExpense = t.type === "EXPENSE";
                            return (
                                <Flex key={t.id} justify="space-between" align="center" gap={3} py={2}>
                                    <Stack gap={0} minW={0}>
                                        <Text fontWeight="semibold" truncate>{t.name}</Text>
                                        <Flex align="center" gap={1} color="fg.muted" fontSize="sm">
                                            <Calendar size={12} />
                                            <Text>{t.due_date ? relativeDueLabel(t.due_date, today) : ""}</Text>
                                        </Flex>
                                    </Stack>
                                    <Flex align="center" gap={3} flexShrink={0}>
                                        <Text fontWeight="bold" color={isExpense ? "status.danger" : "status.success"}>
                                            {isExpense ? "-" : "+"}{formatCurrency(t.amount)}
                                        </Text>
                                        <Button size="xs" variant="outline" onClick={() => setPaying(t)}>
                                            {isExpense ? "Pagar" : "Receber"}
                                        </Button>
                                    </Flex>
                                </Flex>
                            );
                        })}
                    </Stack>
                )}
                {group.count > group.items.length && (
                    <Link asChild fontSize="sm" color="brand.primary" alignSelf="flex-start">
                        <NextLink href={seeAllHref}>Ver todas ({group.count})</NextLink>
                    </Link>
                )}
            </Stack>
        );
    }

    const overdueFrom = data?.overdue.items[0]?.due_date ?? today;
    const overdueHref = `/transaction?from=${overdueFrom}&to=${addDaysISO(today, -1)}`;
    const upcomingHref = `/transaction?from=${today}&to=${addDaysISO(today, days)}`;

    return (
        <Card.Root mb={6}>
            <Card.Body>
                <Flex align="center" justify="space-between" gap={2} mb={4} wrap="wrap">
                    <Heading size="md">Contas a pagar e receber</Heading>
                    <Flex gap={1} role="group" aria-label="Janela de vencimento">
                        {WINDOW_OPTIONS.map((option) => (
                            <Button
                                key={option}
                                size="xs"
                                variant={option === days ? "solid" : "outline"}
                                aria-pressed={option === days}
                                onClick={() => handleSelectWindow(option)}
                            >
                                {option} dias
                            </Button>
                        ))}
                    </Flex>
                </Flex>

                {loading && !data && (
                    <Stack gap={2}>
                        <Skeleton height="20px" />
                        <Skeleton height="20px" width="80%" />
                    </Stack>
                )}

                {error && (
                    <Flex align="center" gap={3} wrap="wrap">
                        <Text color="status.danger">Não foi possível carregar as contas pendentes.</Text>
                        <Button size="xs" variant="outline" onClick={() => load(days)}>Tentar novamente</Button>
                    </Flex>
                )}

                {!error && data && data.overdue.count === 0 && data.upcoming.count === 0 && (
                    <Text color="fg.muted">Nenhuma conta pendente vencida ou a vencer em {days} dias.</Text>
                )}

                {!error && data && (data.overdue.count > 0 || data.upcoming.count > 0) && (
                    <Stack gap={5} opacity={loading ? 0.6 : 1}>
                        {renderGroup("Vencidas", "danger", data.overdue, "Nenhuma conta vencida.", overdueHref)}
                        {renderGroup(`A vencer em ${days} dias`, "warning", data.upcoming, "Nada a vencer neste período.", upcomingHref)}
                    </Stack>
                )}
            </Card.Body>

            <TransactionPaymentModal
                transaction={paying}
                onClose={() => setPaying(null)}
                onSaved={handleSaved}
            />
        </Card.Root>
    );
}
