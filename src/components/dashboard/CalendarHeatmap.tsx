"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Card, Flex, Heading, HStack, Text } from "@chakra-ui/react";
import type { DailySummaryEntry } from "@/lib/types/transaction";
import { useFormatCurrency } from "@/lib/hooks/useFormatCurrency";
import { formatDateBR, todayLocalISO } from "@/lib/utils/date";
import {
    HEATMAP_LEVELS,
    buildYearWeeks,
    levelFor,
    monthLabelForWeek,
    quantileThresholds,
    weekIndexOf,
} from "@/lib/utils/heatmap";

type Metric = "expenses" | "income" | "count";

const METRICS: { key: Metric; label: string; color: string }[] = [
    { key: "expenses", label: "Despesas", color: "status.danger" },
    { key: "income", label: "Receitas", color: "status.success" },
    { key: "count", label: "Quantidade", color: "brand.primary" },
];

// Opacity steps of the metric's own color; level 0 ("no movement") uses the neutral surface.
const LEVEL_OPACITY = [25, 45, 70, 100];

const WEEKDAY_INITIALS = ["D", "S", "T", "Q", "Q", "S", "S"];

const CELL = 12;
const GAP = 3;

interface CalendarHeatmapProps {
    year: number;
    entries: DailySummaryEntry[];
    loading?: boolean;
    error?: boolean;
}

export default function CalendarHeatmap({ year, entries, loading = false, error = false }: CalendarHeatmapProps) {
    const router = useRouter();
    const formatCurrency = useFormatCurrency();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [metric, setMetric] = useState<Metric>("expenses");
    const [hoveredDay, setHoveredDay] = useState<string | null>(null);

    const weeks = useMemo(() => buildYearWeeks(year), [year]);
    const today = todayLocalISO();
    const byDay = useMemo(() => new Map(entries.map((entry) => [entry.date, entry])), [entries]);
    const active = METRICS.find((item) => item.key === metric) ?? METRICS[0];

    const thresholds = useMemo(
        () => quantileThresholds(entries.map((entry) => entry[metric])),
        [entries, metric],
    );

    // On narrow screens the year overflows the card: open on the current month.
    useEffect(() => {
        const container = scrollRef.current;
        if (!container || loading) return;
        const currentIndex = weekIndexOf(weeks, today);
        if (currentIndex < 0) return;
        container.scrollLeft = Math.max(0, (currentIndex - 2) * (CELL + GAP));
    }, [weeks, today, loading]);

    const formatValue = (entry: DailySummaryEntry | undefined, key: Metric) => {
        const value = entry?.[key] ?? 0;
        return key === "count" ? String(value) : formatCurrency(value);
    };

    const describeDay = (day: string) => {
        const entry = byDay.get(day);
        return `${formatDateBR(day)} · Despesas ${formatValue(entry, "expenses")} · Receitas ${formatValue(entry, "income")} · ${entry?.count ?? 0} transações`;
    };

    return (
        <Card.Root mb={6}>
            <Card.Body>
                <Flex justify="space-between" align="center" wrap="wrap" gap={3} mb={4}>
                    <Heading size="md">Calendário de Transações {year}</Heading>
                    <HStack gap={1} role="group" aria-label="Métrica do calendário">
                        {METRICS.map((item) => (
                            <Button
                                key={item.key}
                                size="xs"
                                variant={metric === item.key ? "solid" : "outline"}
                                aria-pressed={metric === item.key}
                                onClick={() => setMetric(item.key)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </HStack>
                </Flex>

                {error ? (
                    <Text color="text.muted">Não foi possível carregar o calendário de transações.</Text>
                ) : loading ? (
                    <Text color="text.muted">Carregando...</Text>
                ) : (
                    <>
                        <Text color="text.muted" fontSize="sm" mb={3} minH="20px" aria-live="polite">
                            {hoveredDay ? describeDay(hoveredDay) : "Passe o cursor sobre um dia para ver os detalhes."}
                        </Text>

                        <Flex gap={2}>
                        {/* Outside the scroll area so the initials stay visible while the year scrolls. */}
                        <Box
                            display="grid"
                            gridTemplateRows={`16px repeat(7, ${CELL}px)`}
                            gap={`${GAP}px`}
                            pb={2}
                            aria-hidden="true"
                        >
                            <Box />
                            {WEEKDAY_INITIALS.map((initial, index) => (
                                <Text key={index} fontSize="10px" lineHeight={`${CELL}px`} color="text.muted">
                                    {index % 2 === 0 ? initial : ""}
                                </Text>
                            ))}
                        </Box>

                        <Box ref={scrollRef} overflowX="auto" pb={2} flex="1" minW={0}>
                            <Box
                                display="grid"
                                gridTemplateRows={`16px repeat(7, ${CELL}px)`}
                                gridAutoFlow="column"
                                gridAutoColumns={`${CELL}px`}
                                gap={`${GAP}px`}
                                w="max-content"
                            >
                                {weeks.flatMap((week, weekIndex) => [
                                    <Text
                                        key={`label-${weekIndex}`}
                                        fontSize="10px"
                                        lineHeight="16px"
                                        color="text.muted"
                                        whiteSpace="nowrap"
                                        overflow="visible"
                                    >
                                        {monthLabelForWeek(week)}
                                    </Text>,
                                    ...week.map((day, dayIndex) => {
                                        if (!day) return <Box key={`empty-${weekIndex}-${dayIndex}`} />;

                                        if (day > today) {
                                            return (
                                                <Box
                                                    key={day}
                                                    borderRadius="2px"
                                                    borderWidth="1px"
                                                    borderStyle="dashed"
                                                    borderColor="text.muted"
                                                    opacity={0.35}
                                                />
                                            );
                                        }

                                        const level = levelFor(byDay.get(day)?.[metric] ?? 0, thresholds);
                                        return (
                                            <Box
                                                key={day}
                                                as="button"
                                                borderRadius="2px"
                                                cursor="pointer"
                                                bg={level === 0 ? "bg.subtle" : `${active.color}/${LEVEL_OPACITY[level - 1]}`}
                                                borderWidth="1px"
                                                borderColor="transparent"
                                                _hover={{ borderColor: "text.muted" }}
                                                _focusVisible={{ outline: "2px solid", outlineColor: "brand.primary" }}
                                                aria-label={describeDay(day)}
                                                onMouseEnter={() => setHoveredDay(day)}
                                                onMouseLeave={() => setHoveredDay(null)}
                                                onFocus={() => setHoveredDay(day)}
                                                onBlur={() => setHoveredDay(null)}
                                                onClick={() => router.push(`/transaction?from=${day}&to=${day}`)}
                                            />
                                        );
                                    }),
                                ])}
                            </Box>
                        </Box>
                        </Flex>

                        <HStack gap={1} mt={3} justify="flex-end" color="text.muted" fontSize="xs">
                            <Text>Menos</Text>
                            <Box w={`${CELL}px`} h={`${CELL}px`} borderRadius="2px" bg="bg.subtle" />
                            {Array.from({ length: HEATMAP_LEVELS }, (_, i) => (
                                <Box
                                    key={i}
                                    w={`${CELL}px`}
                                    h={`${CELL}px`}
                                    borderRadius="2px"
                                    bg={`${active.color}/${LEVEL_OPACITY[i]}`}
                                />
                            ))}
                            <Text>Mais</Text>
                        </HStack>
                    </>
                )}
            </Card.Body>
        </Card.Root>
    );
}
