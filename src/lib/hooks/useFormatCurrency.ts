"use client"
import { useHideValues } from "@/contexts/HideValuesContext"
import { formatCurrency } from "@/lib/utils/currency"

const MASKED_VALUE = "R$ ••••"

export function useFormatCurrency() {
    const { hidden } = useHideValues()
    return (value: number) => (hidden ? MASKED_VALUE : formatCurrency(value))
}
