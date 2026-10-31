import { session } from "@/lib/auth/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
    constructor(message: string, public status?: number, public body?: unknown) {
        super(message);
    }
}

type RequestOptions = {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    // Auth endpoints never trigger the 401 -> refresh -> retry flow.
    skipAuthRefresh?: boolean;
};

function appendQueryParam(params: URLSearchParams, key: string, value: unknown) {
    if (value === undefined || value === null || value === "") return;
    if (typeof value === "object" && !Array.isArray(value)) {
        for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
            appendQueryParam(params, `${key}[${nestedKey}]`, nestedValue);
        }
        return;
    }
    params.append(key, String(value));
}

function buildQueryString(query?: Record<string, unknown>): string {
    if (!query) return "";
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        appendQueryParam(params, key, value);
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
}

async function parseError(response: Response): Promise<ApiError> {
    let body: unknown;
    try {
        body = await response.json();
    } catch {
        // response had no JSON body
    }
    return new ApiError(`Request failed: ${response.status}`, response.status, body);
}

function send(path: string, options: RequestOptions): Promise<Response> {
    const token = session.getAccessToken();
    return fetch(`${API_BASE_URL}${path}`, {
        method: options.method ?? "GET",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            ...options.headers,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
}

// Single-flight: parallel 401s share one refresh request. A rejection (401/403) ends the
// session; network errors and 5xx propagate without ending it.
export function refreshSession(): Promise<string> {
    const running = session.getRefreshPromise();
    if (running) return running;

    const promise = (async () => {
        let response: Response;
        try {
            response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: "{}",
            });
        } catch {
            throw new ApiError("Connection error while renewing the session");
        }
        if (response.status === 401 || response.status === 403) {
            session.end();
            throw await parseError(response);
        }
        if (!response.ok) throw await parseError(response);

        const { accessToken, user } = await response.json();
        session.setAccessToken(accessToken);
        if (user) session.setUser(user);
        return accessToken as string;
    })().finally(() => session.setRefreshPromise(null));

    session.setRefreshPromise(promise);
    return promise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    let response = await send(path, options);

    if (response.status === 401 && !options.skipAuthRefresh && !path.startsWith("/auth/")) {
        await refreshSession();
        response = await send(path, options);
        if (response.status === 401) {
            session.end();
        }
    }

    if (!response.ok) {
        throw await parseError(response);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

export const http = {
    get: <T>(path: string, query?: Record<string, unknown>) => request<T>(`${path}${buildQueryString(query)}`),
    post: <T>(path: string, body: unknown, options?: Pick<RequestOptions, "skipAuthRefresh">) =>
        request<T>(path, { method: "POST", body, ...options }),
    patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body }),
    delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
};
