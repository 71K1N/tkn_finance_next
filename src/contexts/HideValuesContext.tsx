"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from "react"

const STORAGE_KEY = "hideValues"

interface HideValuesContextValue {
    hidden: boolean
    toggle: () => void
}

const HideValuesContext = createContext<HideValuesContextValue | undefined>(undefined)

export function HideValuesProvider({ children }: { children: ReactNode }) {
    const [hidden, setHidden] = useState(false)

    useEffect(() => {
        if (localStorage.getItem(STORAGE_KEY) === "true") setHidden(true)
    }, [])

    function toggle() {
        setHidden((prev) => {
            const next = !prev
            localStorage.setItem(STORAGE_KEY, String(next))
            return next
        })
    }

    return <HideValuesContext.Provider value={{ hidden, toggle }}>{children}</HideValuesContext.Provider>
}

export function useHideValues() {
    const ctx = useContext(HideValuesContext)
    if (!ctx) throw new Error("useHideValues must be used within HideValuesProvider")
    return ctx
}
