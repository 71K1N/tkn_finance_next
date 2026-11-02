/** Iniciais para o avatar: 2 letras com nome composto, 1 com nome simples, inicial do e-mail sem nome. */
export function getInitials(name?: string | null, email?: string | null): string {
    const words = (name ?? '').trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return (email ?? '').trim().charAt(0).toUpperCase() || '?'
    if (words.length === 1) return words[0].charAt(0).toUpperCase()
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}
