"use client"
import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Box } from "@chakra-ui/react"
import Sidebar from "@/components/Sidebar"
import FloatingActionButton from "@/components/FloatingActionButton"
import AuthGate, { PUBLIC_PATHS } from "@/components/AuthGate"

export default function AuthShell({ children }: { children: ReactNode }) {
    const pathname = usePathname()

    if (PUBLIC_PATHS.includes(pathname)) {
        return <AuthGate>{children}</AuthGate>
    }

    return (
        <AuthGate>
            <Sidebar />
            {/* ml uses literal px, not the "sidebar"/"sidebar-mini" tokens: those are sizes-scale tokens and margin props read from the spacing scale, so the token names don't resolve here */}
            <Box bg="bg.canvas" ml={{ base: 0, md: "72px", lg: "260px" }}>
                {children}
            </Box>
            <FloatingActionButton />
        </AuthGate>
    )
}
