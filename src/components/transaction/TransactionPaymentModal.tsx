"use client"
import { useEffect, useState } from "react";
import { notifyError, notifySuccess } from "@/lib/ui/notify";
import { Button } from "tikin-uai";
import { Dialog, Field, Input, Portal, Stack, Text } from "@chakra-ui/react";
import { payTransaction } from "@/lib/api/transaction";
import type { Transaction } from "@/lib/types/transaction";
import { useFormatCurrency } from "@/lib/hooks/useFormatCurrency";
import MoneyInput from "@/components/common/MoneyInput";
import { todayLocalISO } from "@/lib/utils/date";
import { getErrorMessage } from "@/lib/utils/api-error";

type TransactionPaymentModalProps = {
    transaction: Transaction | null;
    onClose: () => void;
    onSaved: () => void;
};

export default function TransactionPaymentModal({ transaction, onClose, onSaved }: TransactionPaymentModalProps) {
    const formatCurrency = useFormatCurrency();
    const [paymentDate, setPaymentDate] = useState<string>("");
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!transaction) return;
        setPaidAmount(transaction.amount);
        setPaymentDate(todayLocalISO());
    }, [transaction]);

    async function confirmPayment() {
        if (!transaction) return;
        setLoading(true);
        try {
            await payTransaction(transaction.id, { payment_date: paymentDate, paid_amount: paidAmount });
            notifySuccess("Pagamento registrado com sucesso!");
            onSaved();
            onClose();
        } catch (error) {
            const message = getErrorMessage(error, "Não foi possível registrar o pagamento", {
                404: "Transação não encontrada. Ela pode ter sido excluída.",
                409: "Esta transação já foi paga.",
            });
            notifyError(message);
            onSaved();
            onClose();
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog.Root open={!!transaction} onOpenChange={(e) => { if (!e.open) onClose(); }}>
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title>Registrar Pagamento</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <Text mb={4}>
                                <strong>Transação:</strong> {transaction?.name}<br />
                                <strong>Valor Original:</strong> {transaction ? formatCurrency(transaction.amount) : ''}
                            </Text>
                            <Stack gap={4}>
                                <Field.Root>
                                    <Field.Label>Data do Pagamento</Field.Label>
                                    <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
                                </Field.Root>
                                <Field.Root>
                                    <Field.Label>Valor Pago</Field.Label>
                                    <MoneyInput
                                        value={paidAmount}
                                        onValueChange={setPaidAmount}
                                    />
                                </Field.Root>
                            </Stack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
                            <Button colorPalette="primary" onClick={confirmPayment} disabled={loading}>Confirmar Pagamento</Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
