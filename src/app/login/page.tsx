"use client"
import { Suspense, useEffect, useRef, useState } from "react"
import Script from "next/script"
import { useSearchParams } from "next/navigation"
import { Box, Center, Heading, Text, VStack } from "@chakra-ui/react"
import { useAuth } from "@/contexts/AuthContext"
import { ApiError } from "@/lib/api/http"

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""

type GoogleCredentialResponse = { credential?: string }

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void
                    renderButton: (element: HTMLElement, options: Record<string, unknown>) => void
                }
            }
        }
    }
}

function LoginContent() {
    const { login } = useAuth()
    const searchParams = useSearchParams()
    const buttonRef = useRef<HTMLDivElement>(null)
    const [scriptReady, setScriptReady] = useState(false)
    const [error, setError] = useState<string | null>(
        searchParams.get("expired") ? "Sua sessão expirou. Entre novamente." : null
    )

    async function handleCredential(response: GoogleCredentialResponse) {
        if (!response.credential) {
            setError("O login não foi concluído. Tente novamente.")
            return
        }
        setError(null)
        try {
            await login(response.credential)
        } catch (err) {
            if (err instanceof ApiError && err.status === 403) {
                setError("Esta conta não está autorizada a acessar o aplicativo.")
            } else {
                setError("O login não foi concluído. Tente novamente.")
            }
        }
    }

    useEffect(() => {
        if (!scriptReady || !window.google || !buttonRef.current) return
        window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredential })
        window.google.accounts.id.renderButton(buttonRef.current, { theme: "outline", size: "large", text: "signin_with", locale: "pt-BR" })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scriptReady])

    return (
        <Center minH="100vh" bg="bg.canvas" px={4}>
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onReady={() => setScriptReady(true)}
                onError={() => setError("Não foi possível carregar o login do Google. Verifique sua conexão ou bloqueadores de conteúdo.")}
            />
            <VStack bg="bg.surface" borderRadius="lg" p={8} gap={5} maxW="sm" w="full" boxShadow="sm">
                <Heading size="lg" color="text.heading">e-TKN Fin Lite</Heading>
                <Text color="text.muted" textAlign="center">Entre com sua conta Google para continuar.</Text>
                <Box ref={buttonRef} minH="44px" />
                {error && <Text color="red.500" fontSize="sm" textAlign="center" role="alert">{error}</Text>}
            </VStack>
        </Center>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    )
}
