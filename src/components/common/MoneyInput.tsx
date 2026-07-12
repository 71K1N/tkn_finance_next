"use client"
import { Input } from "@chakra-ui/react";
import { NumericFormat } from "react-number-format";

type MoneyInputProps = {
    value: number;
    onValueChange: (value: number) => void;
    allowNegative?: boolean;
    placeholder?: string;
    disabled?: boolean;
};

export default function MoneyInput({
    value,
    onValueChange,
    allowNegative = false,
    placeholder,
    disabled,
}: MoneyInputProps) {
    return (
        <NumericFormat
            customInput={Input}
            value={value}
            onValueChange={(values) => onValueChange(values.floatValue ?? 0)}
            thousandSeparator="."
            decimalSeparator=","
            prefix="R$ "
            decimalScale={2}
            allowNegative={allowNegative}
            placeholder={placeholder}
            disabled={disabled}
        />
    );
}
