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

/** Visual order of the validated fields (type first, then name, amount, account, ..., date); the first invalid one receives focus. */
export const TRANSACTION_FIELD_ORDER: TransactionFieldKey[] = ["name", "amount", "account", "date"];

/**
 * The due date field shows for any unpaid income and for an unpaid expense registered as a scheduled bill.
 * `isBill` is only editable while the type is expense, so it must not hide the field of an income.
 * Also decides whether `due_date` is sent, so what is shown and what is saved never diverge.
 */
export function isDueDateVisible(values: Pick<TransactionFormValues, "paid" | "type" | "isBill">): boolean {
    return !values.paid && (values.type === "INCOME" || values.isBill);
}

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
