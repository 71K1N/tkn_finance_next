"use client"
import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, X } from "react-feather";
import { notifyWarning } from "@/lib/ui/notify";
import { Button } from "tikin-uai";
import { Dialog, Field, Input, Portal, Stack, Text } from "@chakra-ui/react";
import TransactionFormModal from "@/components/transaction/TransactionFormModal";
import { parseTransactionText } from "@/lib/api/transaction";
import { getCategories } from "@/lib/api/category";
import { getSubcategories } from "@/lib/api/subcategory";
import { getBankAccounts } from "@/lib/api/bank-account";
import { ApiError } from "@/lib/api/http";
import type { TransactionDraft } from "@/lib/types/transaction";
import type { Category } from "@/lib/types/category";
import type { Subcategory } from "@/lib/types/subcategory";
import type { BankAccount } from "@/lib/types/bank-account";
import { todayLocalISO } from "@/lib/utils/date";

/** Fired after a transaction is saved from here, so open lists can refetch. */
export const TRANSACTIONS_CHANGED_EVENT = "transactions:changed";

type QuickEntryDialogProps = {
    open: boolean;
    onClose: () => void;
};

export default function QuickEntryDialog({ open, onClose }: QuickEntryDialogProps) {
    const [text, setText] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [draft, setDraft] = useState<TransactionDraft | null>(null);
    const [formOpen, setFormOpen] = useState<boolean>(false);

    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const relatedLoaded = useRef<boolean>(false);

    // The form's selects need these lists; load them once, the first time the dialog opens.
    useEffect(() => {
        if (!open) return;
        setText("");
        if (relatedLoaded.current) return;
        relatedLoaded.current = true;
        Promise.all([
            getCategories({ page: 1, pageSize: 100 }),
            getSubcategories({ page: 1, pageSize: 100 }),
            getBankAccounts({ page: 1, pageSize: 100 }),
        ])
            .then(([categoriesResponse, subcategoriesResponse, accountsResponse]) => {
                setCategories(categoriesResponse.data);
                setSubcategories(subcategoriesResponse.data);
                setAccounts(accountsResponse.data);
            })
            .catch(() => {
                relatedLoaded.current = false;
            });
    }, [open]);

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const sentence = text.trim();
        if (!sentence || loading) return;

        setLoading(true);
        let result: TransactionDraft;
        let warning: string | null = null;
        try {
            result = await parseTransactionText(sentence);
        } catch (error) {
            // Entering a transaction must never depend on the parser: fall back to a form that only carries the text.
            result = {
                name: sentence,
                amount: null,
                type: "EXPENSE",
                payment_date: todayLocalISO(),
                subcategory_id: null,
                account_id: null,
            };
            warning =
                error instanceof ApiError && error.status === 429
                    ? "Limite de uso do texto rápido atingido. Preencha os campos manualmente."
                    : "Não foi possível preencher automaticamente. Preencha os campos manualmente.";
        } finally {
            setLoading(false);
        }

        setDraft(result);
        setFormOpen(true);
        onClose();
        if (warning) notifyWarning(warning);
    }

    function handleSaved() {
        window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
    }

    return (
        <>
            <Dialog.Root open={open} onOpenChange={(e) => { if (!e.open && !loading) onClose(); }}>
                <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <form onSubmit={handleSubmit}>
                                <Dialog.Header>
                                    <Dialog.Title>Texto rápido</Dialog.Title>
                                </Dialog.Header>
                                <Dialog.Body>
                                    <Field.Root>
                                        <Field.Label>O que você gastou ou recebeu?</Field.Label>
                                        <Input
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            placeholder="mercado 87,50 ontem"
                                            maxLength={200}
                                            autoComplete="off"
                                            enterKeyHint="send"
                                            // 16px keeps iOS from zooming the page when the field is focused.
                                            fontSize="16px"
                                            disabled={loading}
                                        />
                                    </Field.Root>
                                    <Text fontSize="xs" color="text.muted" mt={2}>
                                        Você confere e escolhe entre pago e planejado antes de salvar.
                                    </Text>
                                </Dialog.Body>
                                <Dialog.Footer>
                                    <Stack direction="row" gap={2}>
                                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                            <X size={16} />
                                            Cancelar
                                        </Button>
                                        <Button type="submit" colorPalette="primary" disabled={loading || !text.trim()} loading={loading}>
                                            <Send size={16} />
                                            Continuar
                                        </Button>
                                    </Stack>
                                </Dialog.Footer>
                            </form>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            <TransactionFormModal
                open={formOpen}
                transaction={null}
                draft={draft}
                categories={categories}
                subcategories={subcategories}
                accounts={accounts}
                onClose={() => setFormOpen(false)}
                onSaved={handleSaved}
            />
        </>
    );
}
