"use client"
import { useCallback, useEffect, useState, type ReactNode } from "react";
import NextLink from "next/link";
import { ArrowDownRight, ArrowUpLeft, Calendar } from "react-feather";
import { Box, Button, Card, Flex, Heading, Link, SimpleGrid, Skeleton, Stack, Text } from "@chakra-ui/react";
import StatusBadge from "@/components/StatusBadge";
import TransactionPaymentModal from "@/components/transaction/TransactionPaymentModal";
import { TRANSACTIONS_CHANGED_EVENT } from "@/components/transaction/QuickEntryDialog";
import { getDueTransactions } from "@/lib/api/transaction";
import type { DueGroup, DueTransactions, Transaction } from "@/lib/types/transaction";
import { useFormatCurrency } from "@/lib/hooks/useFormatCurrency";
import { addDaysISO, dueStatusLabel, todayLocalISO } from "@/lib/utils/date";

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

/**
 * Net balance of a group (income − expense) over every transaction in it.
 * Older API builds don't send income/expense: fall back to the listed items,
 * which is exact only while the group fits in `items`.
 */
function groupNet(group: DueGroup): number {
    if (group.income !== undefined && group.expense !== undefined) {
        return group.income - group.expense;
    }
    return group.items.reduce((sum, t) => sum + (t.type === "INCOME" ? t.amount : -t.amount), 0);
}

type DueItem = Transaction & { overdue: boolean };

function IconTile({ bg, color, children }: { bg: string; color: string; children: ReactNode }) {
    return (
        <Flex align="center" justify="center" boxSize={9} flexShrink={0} borderRadius="md" bg={bg} color={color}>
            {children}
        </Flex>
    );
}

function WindowSelector({ value, onChange }: { value: number; onChange: (days: number) => void }) {
    return (
        <Flex gap={1} p={1} bg="bg.subtle" borderRadius="md" role="group" aria-label="Janela de vencimento">
            {WINDOW_OPTIONS.map((option) => {
                const active = option === value;
                return (
                    <Button
                        key={option}
                        size="xs"
                        variant="ghost"
                        aria-pressed={active}
                        onClick={() => onChange(option)}
                        bg={active ? "bg.surface" : "transparent"}
                        color={active ? "text.heading" : "text.muted"}
                        fontWeight={active ? "semibold" : "normal"}
                        boxShadow={active ? "xs" : "none"}
                        _hover={{ bg: active ? "bg.surface" : "bg.surface/60" }}
                    >
                        {option} dias
                    </Button>
                );
            })}
        </Flex>
    );
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

    function formatSigned(value: number) {
        return `${value < 0 ? "-" : "+"}${formatCurrency(Math.abs(value))}`;
    }

    function renderSummary(
        label: string,
        status: "danger" | "warning",
        group: DueGroup,
        href: string,
        linkLabel: string,
    ) {
        const content = (
            <Flex align="center" justify="space-between" gap={3} h="full">
                <Stack gap={1} minW={0}>
                    <Flex align="center" gap={2}>
                        <Box boxSize={2} borderRadius="full" bg={`status.${status}`} flexShrink={0} />
                        <Text fontSize="sm" color="text.muted">{label}</Text>
                    </Flex>
                    <Text fontSize="lg" fontWeight="bold" color="text.heading">
                        {formatSigned(groupNet(group))} saldo
                    </Text>
                </Stack>
                <StatusBadge status={status} flexShrink={0}>
                    {group.count} {group.count === 1 ? "conta" : "contas"}
                </StatusBadge>
            </Flex>
        );
        const tileProps = {
            borderWidth: "1px",
            borderColor: "border.default",
            borderRadius: "lg",
            px: 4,
            py: 3,
        } as const;

        if (group.count === 0) {
            return <Box {...tileProps}>{content}</Box>;
        }
        // The list shows at most 10 items per group: the tile is the way to the full period.
        return (
            <Link
                asChild
                {...tileProps}
                display="block"
                color="inherit"
                textDecoration="none"
                transition="border-color 0.15s ease"
                _hover={{ borderColor: "brand.primary", textDecoration: "none" }}
                aria-label={linkLabel}
            >
                <NextLink href={href}>{content}</NextLink>
            </Link>
        );
    }

    function renderItem(t: DueItem) {
        const isExpense = t.type === "EXPENSE";
        return (
            <Flex key={t.id} align="center" gap={3} py={3} wrap={{ base: "wrap", sm: "nowrap" }}>
                <Flex align="center" gap={3} flex="1" minW={0}>
                    {isExpense ? (
                        <IconTile bg="status.danger.subtle" color="status.danger">
                            <ArrowDownRight size={16} aria-label="Despesa" />
                        </IconTile>
                    ) : (
                        <IconTile bg="status.success.subtle" color="status.success">
                            <ArrowUpLeft size={16} aria-label="Receita" />
                        </IconTile>
                    )}
                    <Stack gap={0} minW={0}>
                        <Flex align="center" gap={2} minW={0}>
                            <Text fontWeight="semibold" color="text.heading" truncate>{t.name}</Text>
                            {t.overdue && <StatusBadge status="danger" size="sm" flexShrink={0}>Vencida</StatusBadge>}
                        </Flex>
                        <Text fontSize="sm" color={t.overdue ? "status.danger" : "text.muted"}>
                            {t.due_date ? dueStatusLabel(t.due_date, today) : ""}
                        </Text>
                    </Stack>
                </Flex>
                <Flex align="center" gap={3} flexShrink={0} ml={{ base: 12, sm: 0 }}>
                    <Text fontWeight="bold" color={isExpense ? "status.danger" : "status.success"}>
                        {isExpense ? "-" : "+"}{formatCurrency(t.amount)}
                    </Text>
                    <Button size="sm" variant="outline" minW="20" onClick={() => setPaying(t)}>
                        {isExpense ? "Pagar" : "Receber"}
                    </Button>
                </Flex>
            </Flex>
        );
    }

    const overdueFrom = data?.overdue.items[0]?.due_date ?? today;
    const overdueHref = `/transaction?from=${overdueFrom}&to=${addDaysISO(today, -1)}`;
    const upcomingHref = `/transaction?from=${today}&to=${addDaysISO(today, days)}`;

    const hasAny = !!data && (data.overdue.count > 0 || data.upcoming.count > 0);
    const items: DueItem[] = data
        ? [
            ...data.overdue.items.map((t) => ({ ...t, overdue: true })),
            ...data.upcoming.items.map((t) => ({ ...t, overdue: false })),
        ]
        : [];

    return (
        <Card.Root mb={6}>
            <Card.Body>
                <Flex align="center" justify="space-between" gap={3} mb={5} wrap="wrap">
                    <Flex align="center" gap={3}>
                        <IconTile bg="status.warning.subtle" color="status.warning">
                            <Calendar size={18} />
                        </IconTile>
                        <Stack gap={0}>
                            <Heading size="md" color="text.heading">Contas a pagar e receber</Heading>
                            <Text fontSize="sm" color="text.muted">Próximos {days} dias</Text>
                        </Stack>
                    </Flex>
                    <WindowSelector value={days} onChange={handleSelectWindow} />
                </Flex>

                {loading && !data && !error && (
                    <Stack gap={4}>
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                            <Skeleton height="72px" borderRadius="lg" />
                            <Skeleton height="72px" borderRadius="lg" />
                        </SimpleGrid>
                        <Skeleton height="48px" />
                        <Skeleton height="48px" />
                    </Stack>
                )}

                {error && (
                    <Flex align="center" gap={3} wrap="wrap">
                        <Text color="status.danger">Não foi possível carregar as contas pendentes.</Text>
                        <Button size="xs" variant="outline" onClick={() => load(days)}>Tentar novamente</Button>
                    </Flex>
                )}

                {!error && data && !hasAny && (
                    <Text color="text.muted">Nenhuma conta pendente vencida ou a vencer em {days} dias.</Text>
                )}

                {!error && data && hasAny && (
                    <Stack gap={5} opacity={loading ? 0.6 : 1} transition="opacity 0.15s ease">
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                            {renderSummary(
                                "Vencidas",
                                "danger",
                                data.overdue,
                                overdueHref,
                                `Ver todas as ${data.overdue.count} contas vencidas`,
                            )}
                            {renderSummary(
                                `A vencer em ${days} dias`,
                                "warning",
                                data.upcoming,
                                upcomingHref,
                                `Ver todas as ${data.upcoming.count} contas a vencer em ${days} dias`,
                            )}
                        </SimpleGrid>

                        <Stack gap={0}>
                            <Text
                                fontSize="xs"
                                fontWeight="semibold"
                                textTransform="uppercase"
                                letterSpacing="wider"
                                color="text.muted"
                                pb={2}
                                borderBottomWidth="1px"
                                borderColor="border.default"
                            >
                                Vencimentos
                            </Text>
                            <Stack gap={0} divideY="1px" divideColor="border.default" borderBottomWidth="1px" borderColor="border.default">
                                {items.map(renderItem)}
                            </Stack>
                        </Stack>
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
