"use client"
import { ReactNode, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Center, Spinner } from "@chakra-ui/react"
import { useAuth } from "@/contexts/AuthContext"

export const PUBLIC_PATHS = ["/login"]

export default function AuthGate({ children }: { children: ReactNode }) {
    const { status, sessionExpired } = useAuth()
    const pathname = usePathname()
    const router = useRouter()
    const isPublic = PUBLIC_PATHS.includes(pathname)

    useEffect(() => {
        if (status === "unauthenticated" && !isPublic) router.replace(sessionExpired ? "/login?expired=1" : "/login")
        if (status === "authenticated" && isPublic) router.replace("/")
    }, [status, isPublic, sessionExpired, router])

    // Children render only when the state matches the route, so protected pages never
    // mount (and never fetch) before the session is confirmed.
    const allowed = (status === "authenticated" && !isPublic) || (status === "unauthenticated" && isPublic)
    if (!allowed) {
        return (
            <Center minH="100vh" bg="bg.canvas">
                <Spinner color="brand.primary" />
            </Center>
        )
    }

    return <>{children}</>
}
