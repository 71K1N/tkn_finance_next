"use client"
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react"
import { getMe, loginWithGoogle, logout as apiLogout } from "@/lib/api/auth"
import { refreshSession } from "@/lib/api/http"
import { session, SessionUser } from "@/lib/auth/session"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
    user: SessionUser | null
    status: AuthStatus
    sessionExpired: boolean
    login: (idToken: string) => Promise<void>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null)
    const [status, setStatus] = useState<AuthStatus>("loading")
    const [sessionExpired, setSessionExpired] = useState(false)

    useEffect(() => {
        let cancelled = false

        async function restore() {
            try {
                await refreshSession()
                const me = await getMe()
                session.setUser(me)
                if (!cancelled) {
                    setUser(me)
                    setStatus("authenticated")
                }
            } catch {
                // No valid session (or API unreachable): fall back to the login page.
                session.clear()
                if (!cancelled) {
                    setUser(null)
                    setStatus("unauthenticated")
                }
            }
        }

        restore()
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        return session.onEnded(() => {
            setSessionExpired(true)
            setUser(null)
            setStatus("unauthenticated")
        })
    }, [])

    const login = useCallback(async (idToken: string) => {
        const loggedUser = await loginWithGoogle(idToken)
        setSessionExpired(false)
        setUser(loggedUser)
        setStatus("authenticated")
    }, [])

    const logout = useCallback(async () => {
        try {
            await apiLogout()
        } catch {
            // Local state is cleared regardless of the revoke result.
        }
        session.clear()
        setUser(null)
        setStatus("unauthenticated")
    }, [])

    return <AuthContext.Provider value={{ user, status, sessionExpired, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth must be used within AuthProvider")
    return ctx
}
