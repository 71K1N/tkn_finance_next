"use client"
import { useEffect, useState } from "react";
import swal from 'sweetalert';
import { Button } from "tikin-ds";
import { Dialog, Field, Input, Portal, Stack, Text } from "@chakra-ui/react";
import { payTransaction } from "@/lib/api/transaction";
import type { Transaction } from "@/lib/types/transaction";
import { formatCurrency } from "@/lib/utils/currency";
import MoneyInput from "@/components/common/MoneyInput";

type TransactionPaymentModalProps = {
    transaction: Transaction | null;
    onClose: () => void;
    onSaved: () => void;
};

export default function TransactionPaymentModal({ transaction, onClose, onSaved }: TransactionPaymentModalProps) {
    const [paymentDate, setPaymentDate] = useState<string>("");
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!transaction) return;
        setPaidAmount(transaction.amount);
        setPaymentDate(new Date().toISOString().split('T')[0]);
    }, [transaction]);

    async function confirmPayment() {
        if (!transaction) return;
        setLoading(true);
        try {
            await payTransaction(transaction.id, { payment_date: paymentDate, paid_amount: paidAmount });
            swal("Sucesso!", "Pagamento registrado com sucesso!", "success");
            onSaved();
            onClose();
        } catch (error) {
            swal("Erro!", "Não foi possível registrar o pagamento", "error");
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
