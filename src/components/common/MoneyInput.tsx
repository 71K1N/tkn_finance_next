"use client"
import type { Ref } from "react";
import { Input } from "@chakra-ui/react";
import { NumericFormat } from "react-number-format";

type MoneyInputProps = {
    value: number;
    onValueChange: (value: number) => void;
    allowNegative?: boolean;
    placeholder?: string;
    disabled?: boolean;
    inputRef?: Ref<HTMLInputElement>;
};

export default function MoneyInput({
    value,
    onValueChange,
    allowNegative = false,
    placeholder,
    disabled,
    inputRef,
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
            getInputRef={inputRef}
        />
    );
}
