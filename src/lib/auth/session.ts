export type SessionUser = {
    id: number;
    name?: string | null;
    email: string;
    picture?: string | null;
};

type SessionEndedListener = () => void;

let accessToken: string | null = null;
let currentUser: SessionUser | null = null;
let refreshPromise: Promise<string> | null = null;
const listeners = new Set<SessionEndedListener>();

export const session = {
    getAccessToken: () => accessToken,
    setAccessToken: (token: string | null) => {
        accessToken = token;
    },
    getUser: () => currentUser,
    setUser: (user: SessionUser | null) => {
        currentUser = user;
    },
    getRefreshPromise: () => refreshPromise,
    setRefreshPromise: (promise: Promise<string> | null) => {
        refreshPromise = promise;
    },
    clear: () => {
        accessToken = null;
        currentUser = null;
        refreshPromise = null;
    },
    // Clears local state and tells subscribers (AuthContext) that the session is over.
    end: () => {
        session.clear();
        listeners.forEach((listener) => listener());
    },
    onEnded: (listener: SessionEndedListener) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },
};
