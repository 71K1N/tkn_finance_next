import type { TransactionType } from "@/lib/types/transaction";

export type TransactionFieldKey = "name" | "amount" | "date" | "account";

export type TransactionFormValues = {
    name: string;
    amount: number;
    accountId: string;
    type: TransactionType;
    paid: boolean;
    isBill: boolean;
    dueDate: string;
    paymentDate: string;
};

export type TransactionFormErrors = Partial<Record<TransactionFieldKey, string>>;

/** Visual order of the fields; the first invalid one receives focus. */
export const TRANSACTION_FIELD_ORDER: TransactionFieldKey[] = ["name", "amount", "date", "account"];

/** The due date is only mandatory for an unpaid expense registered as a scheduled bill. */
export function isDueDateRequired(values: Pick<TransactionFormValues, "paid" | "type" | "isBill">): boolean {
    return !values.paid && values.type === "EXPENSE" && values.isBill;
}

export function validateTransaction(values: TransactionFormValues): TransactionFormErrors {
    const errors: TransactionFormErrors = {};

    if (!values.name.trim()) {
        errors.name = "Informe o nome da transação";
    }

    if (!(values.amount > 0)) {
        errors.amount = "O valor deve ser maior que zero";
    }

    if (values.paid) {
        if (!values.paymentDate) errors.date = "Informe a data do pagamento";
    } else if (isDueDateRequired(values) && !values.dueDate) {
        errors.date = "Informe a data de vencimento";
    }

    if (!values.accountId) {
        errors.account = "Selecione uma conta";
    }

    return errors;
}
