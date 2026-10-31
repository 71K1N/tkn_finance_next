import { http } from "@/lib/api/http";
import { session, SessionUser } from "@/lib/auth/session";

type AuthResponse = { accessToken: string; user: SessionUser };

export async function loginWithGoogle(idToken: string): Promise<SessionUser> {
    const { accessToken, user } = await http.post<AuthResponse>("/auth/google", { credential: idToken }, { skipAuthRefresh: true });
    session.setAccessToken(accessToken);
    session.setUser(user);
    return user;
}

export function getMe(): Promise<SessionUser> {
    return http.get<SessionUser>("/auth/me");
}

export async function logout(): Promise<void> {
    try {
        await http.post<void>("/auth/logout", {}, { skipAuthRefresh: true });
    } finally {
        session.clear();
    }
}

export { refreshSession as refresh } from "@/lib/api/http";
