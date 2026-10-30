"use client"
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Upload } from 'react-feather';
import swal from 'sweetalert';
import { Button, PageHeader } from "tikin-uai";
import { Alert, Card, Container, Field, HStack, Input, NativeSelect, SimpleGrid, Stack, Table, Text } from "@chakra-ui/react";
import StatementReviewTable from "@/components/transaction/StatementReviewTable";
import { getBankAccounts } from "@/lib/api/bank-account";
import { getCategories } from "@/lib/api/category";
import { getSubcategories } from "@/lib/api/subcategory";
import {
    getImportedKeys,
    getSettlementCandidates,
    saveStatementItems,
    type SaveResult,
} from "@/lib/api/statement-import";
import { loadCategoryRules, saveCategoryRules, withCategoryRule, type CategoryRule } from "@/lib/statement/category-rules";
import { classifyLines } from "@/lib/statement/classify";
import { keyStatementLines } from "@/lib/statement/import-key";
import { picpayAdapter } from "@/lib/statement/picpay";
import {
    buildReviewRows,
    isSaved,
    netBalanceEffect,
    toSaveItems,
    validateRows,
    type ReviewRow,
} from "@/lib/statement/review";
import { StatementFormatError, type StatementRowError } from "@/lib/statement/types";
import type { BankAccount } from "@/lib/types/bank-account";
import type { Category } from "@/lib/types/category";
import type { Subcategory } from "@/lib/types/subcategory";
import type { Transaction } from "@/lib/types/transaction";
import { useFormatCurrency } from "@/lib/hooks/useFormatCurrency";
import { formatDateBR } from "@/lib/utils/date";
import { getErrorMessage } from "@/lib/utils/api-error";

type Step = "setup" | "review" | "done";

const HOLDER_KEY = "statement-holder-name";
const ACCOUNT_KEY = "statement-account-id";

function remembered(key: string): string {
    try {
        return localStorage.getItem(key) ?? "";
    } catch {
        return "";
    }
}

function remember(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // storage unavailable: the choice just isn't remembered
    }
}

export default function PageStatementImport() {
    const router = useRouter();
    const formatCurrency = useFormatCurrency();

    const [step, setStep] = useState<Step>("setup");
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [rules, setRules] = useState<CategoryRule[]>([]);

    const [file, setFile] = useState<File | null>(null);
    const [fileInputKey, setFileInputKey] = useState<number>(0);
    const [accountId, setAccountId] = useState<string>("");
    const [holderName, setHolderName] = useState<string>("");
    const [fileError, setFileError] = useState<string>("");

    const [rows, setRows] = useState<ReviewRow[]>([]);
    const [candidates, setCandidates] = useState<Transaction[]>([]);
    const [rowErrors, setRowErrors] = useState<StatementRowError[]>([]);
    const [result, setResult] = useState<SaveResult | null>(null);

    useEffect(() => {
        setHolderName(remembered(HOLDER_KEY));
        setAccountId(remembered(ACCOUNT_KEY));
        setRules(loadCategoryRules());

        (async () => {
            try {
                const [categoriesResponse, subcategoriesResponse, accountsResponse] = await Promise.all([
                    getCategories({ page: 1, pageSize: 100 }),
                    getSubcategories({ page: 1, pageSize: 100 }),
                    getBankAccounts({ page: 1, pageSize: 100 }),
                ]);
                setCategories(categoriesResponse.data);
                setSubcategories(subcategoriesResponse.data);
                setAccounts(accountsResponse.data);
            } catch (error) {
                setFileError(getErrorMessage(error, "Não foi possível carregar contas e categorias."));
            }
        })();
    }, []);

    const accountName = accounts.find((account) => account.id === accountId)?.description ?? "";
    const validation = useMemo(() => validateRows(rows, accountId), [rows, accountId]);
    const incomplete = validation.filter(Boolean).length;
    const selected = rows.filter((row) => isSaved(row.choice)).length;
    const netEffect = netBalanceEffect(rows);

    async function readStatement() {
        if (!file || !accountId) return;
        setLoading(true);
        setFileError("");
        try {
            const { lines, errors } = picpayAdapter.parse(await file.text());
            if (lines.length === 0) {
                setFileError("Nenhuma linha válida foi encontrada no arquivo.");
                setRowErrors(errors);
                return;
            }

            const dates = lines.map((line) => line.date).sort();
            const [from, to] = [dates[0], dates[dates.length - 1]];
            const [importedKeys, existing] = await Promise.all([
                getImportedKeys(accountId, from, to),
                getSettlementCandidates(accountId, from, to),
            ]);

            const classified = classifyLines(keyStatementLines(lines, importedKeys), {
                accountId,
                holderName,
                transactions: existing,
                rules,
            });

            remember(HOLDER_KEY, holderName);
            remember(ACCOUNT_KEY, accountId);
            setCandidates(existing);
            setRows(buildReviewRows(classified, subcategories));
            setRowErrors(errors);
            setStep("review");
        } catch (error) {
            setFileError(
                error instanceof StatementFormatError
                    ? error.message
                    : getErrorMessage(error, "Não foi possível ler o extrato e consultar as transações."),
            );
        } finally {
            setLoading(false);
        }
    }

    function changeRow(index: number, patch: Partial<ReviewRow>) {
        setRows((current) =>
            current.map((row, i) => {
                if (i !== index) return row;
                const next = { ...row, ...patch };
                // A single candidate is the only sensible pick, so choosing "Dar baixa" selects it.
                if (patch.choice === "settle" && !next.settleId && next.candidateIds.length === 1) {
                    next.settleId = next.candidateIds[0];
                }
                return next;
            }),
        );
    }

    function reset() {
        setStep("setup");
        setRows([]);
        setCandidates([]);
        setRowErrors([]);
        setResult(null);
        setFile(null);
        setFileInputKey((key) => key + 1);
    }

    function confirmImport() {
        if (incomplete > 0 || selected === 0) return;

        swal({
            title: "Confirmar importação",
            text: `${selected} linha(s) serão gravadas e o saldo de ${accountName} mudará ${formatCurrency(netEffect)}. Deseja continuar?`,
            icon: "question",
            buttons: ["Cancelar", "Confirmar"],
        }).then(async (willProceed) => {
            if (!willProceed) return;

            let nextRules = rules;
            rows.forEach((row) => {
                if (row.choice === "create" && row.saveRule && row.subcategoryId) {
                    nextRules = withCategoryRule(nextRules, row.line.counterpart, row.subcategoryId);
                }
            });
            if (nextRules !== rules) {
                saveCategoryRules(nextRules);
                setRules(nextRules);
            }

            setSaving(true);
            try {
                setResult(await saveStatementItems(accountId, toSaveItems(rows, candidates)));
                setStep("done");
            } finally {
                setSaving(false);
            }
        });
    }

    async function retryFailures() {
        if (!result || result.failures.length === 0) return;
        setSaving(true);
        try {
            const retried = await saveStatementItems(accountId, result.failures.map((failure) => failure.item));
            setResult({
                created: result.created + retried.created,
                settled: result.settled + retried.settled,
                transferred: result.transferred + retried.transferred,
                failures: retried.failures,
            });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Container maxW="6xl" py={8}>
            <PageHeader
                title="Importar extrato"
                subtitle="Leia o CSV do PicPay, confira os lançamentos e grave só o que estiver certo"
                mb={6}
                actions={
                    <Button variant="outline" onClick={() => router.push("/transaction")} disabled={saving}>
                        <ArrowLeft size={16} />
                        Transações
                    </Button>
                }
            />

            {step === "setup" && (
                <Card.Root>
                    <Card.Body>
                        <Stack gap={4}>
                            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                                <Field.Root>
                                    <Field.Label>Arquivo do extrato (CSV)</Field.Label>
                                    <Input
                                        key={fileInputKey}
                                        type="file"
                                        accept=".csv,text/csv"
                                        onChange={(e) => {
                                            setFile(e.target.files?.[0] ?? null);
                                            setFileError("");
                                        }}
                                    />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Conta do extrato</Field.Label>
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
                            <Field.Root>
                                <Field.Label>Seu nome como aparece no extrato</Field.Label>
                                <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Ex.: Maria da Silva" />
                                <Field.HelperText>
                                    Lançamentos com esse nome são tratados como possíveis transferências entre as suas contas, e não como receita ou despesa.
                                </Field.HelperText>
                            </Field.Root>

                            {fileError && (
                                <Alert.Root status="error">
                                    <Alert.Indicator />
                                    <Alert.Title>{fileError}</Alert.Title>
                                </Alert.Root>
                            )}
                            <RowErrorList errors={rowErrors} />

                            <HStack>
                                <Button colorPalette="primary" onClick={readStatement} disabled={!file || !accountId || loading}>
                                    <Upload size={16} />
                                    {loading ? "Lendo..." : "Ler extrato"}
                                </Button>
                            </HStack>
                        </Stack>
                    </Card.Body>
                </Card.Root>
            )}

            {step === "review" && (
                <Stack gap={4}>
                    <Card.Root>
                        <Card.Body>
                            <HStack justify="space-between" wrap="wrap" gap={4}>
                                <Stack gap={1}>
                                    <Text fontWeight="medium">{rows.length} lançamento(s) em {accountName}</Text>
                                    <Text fontSize="sm" color="text.muted">
                                        {selected} para gravar • {rows.filter((row) => row.choice === "imported").length} já importado(s)
                                        {incomplete > 0 && ` • ${incomplete} incompleto(s)`}
                                    </Text>
                                    <Text fontSize="sm" color="text.muted">
                                        Ao gravar, o saldo da conta muda {formatCurrency(netEffect)}. Se o saldo atual já inclui esse período, ele será contado em dobro.
                                    </Text>
                                </Stack>
                                <HStack>
                                    <Button variant="outline" onClick={reset} disabled={saving}>Cancelar</Button>
                                    <Button colorPalette="primary" onClick={confirmImport} disabled={saving || incomplete > 0 || selected === 0}>
                                        <Check size={16} />
                                        {saving ? "Gravando..." : "Confirmar importação"}
                                    </Button>
                                </HStack>
                            </HStack>
                        </Card.Body>
                    </Card.Root>

                    <RowErrorList errors={rowErrors} />

                    <StatementReviewTable
                        rows={rows}
                        errors={validation}
                        transactions={candidates}
                        categories={categories}
                        subcategories={subcategories}
                        accounts={accounts}
                        accountId={accountId}
                        onChange={changeRow}
                    />
                </Stack>
            )}

            {step === "done" && result && (
                <Stack gap={4}>
                    <Card.Root>
                        <Card.Body>
                            <Stack gap={2}>
                                <Text fontWeight="medium">
                                    {result.failures.length === 0 ? "Importação concluída" : "Importação concluída com falhas"}
                                </Text>
                                <Text>
                                    {result.created} criada(s) • {result.settled} baixa(s) • {result.transferred} transferência(s)
                                    {result.failures.length > 0 && ` • ${result.failures.length} com falha`}
                                </Text>
                                <HStack mt={2}>
                                    {result.failures.length > 0 && (
                                        <Button colorPalette="primary" onClick={retryFailures} disabled={saving}>
                                            {saving ? "Gravando..." : "Tentar de novo as que falharam"}
                                        </Button>
                                    )}
                                    <Button variant="outline" onClick={reset} disabled={saving}>Nova importação</Button>
                                    <Button variant="outline" onClick={() => router.push("/transaction")} disabled={saving}>Ver transações</Button>
                                </HStack>
                            </Stack>
                        </Card.Body>
                    </Card.Root>

                    {result.failures.length > 0 && (
                        <Card.Root>
                            <Card.Body>
                                <Table.Root size="sm">
                                    <Table.Header>
                                        <Table.Row>
                                            <Table.ColumnHeader>Data</Table.ColumnHeader>
                                            <Table.ColumnHeader>Lançamento</Table.ColumnHeader>
                                            <Table.ColumnHeader textAlign="end">Valor</Table.ColumnHeader>
                                            <Table.ColumnHeader>Motivo</Table.ColumnHeader>
                                        </Table.Row>
                                    </Table.Header>
                                    <Table.Body>
                                        {result.failures.map(({ item, message }) => (
                                            <Table.Row key={item.line.key}>
                                                <Table.Cell>{formatDateBR(item.line.date)}</Table.Cell>
                                                <Table.Cell>{item.line.counterpart}</Table.Cell>
                                                <Table.Cell textAlign="end">{formatCurrency(Math.abs(item.line.amount))}</Table.Cell>
                                                <Table.Cell color="red.solid">{message}</Table.Cell>
                                            </Table.Row>
                                        ))}
                                    </Table.Body>
                                </Table.Root>
                            </Card.Body>
                        </Card.Root>
                    )}
                </Stack>
            )}
        </Container>
    );
}

function RowErrorList({ errors }: { errors: StatementRowError[] }) {
    if (errors.length === 0) return null;
    return (
        <Alert.Root status="warning">
            <Alert.Indicator />
            <Alert.Content>
                <Alert.Title>{errors.length} linha(s) do arquivo foram ignoradas por estarem inválidas</Alert.Title>
                <Alert.Description>
                    {errors.map((error) => `Linha ${error.rowIndex}: ${error.message}`).join(" • ")}
                </Alert.Description>
            </Alert.Content>
        </Alert.Root>
    );
}
