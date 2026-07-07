const API_BASE_URL = "http://localhost:8081";

export class ApiError extends Error {
    constructor(message: string, public status?: number, public body?: unknown) {
        super(message);
    }
}

type RequestOptions = {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method ?? "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 1",
            ...options.headers,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
        let body: unknown;
        try {
            body = await response.json();
        } catch {
            // response had no JSON body
        }
        throw new ApiError(`Request failed: ${response.status}`, response.status, body);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

export const http = {
    get: <T>(path: string, query?: Record<string, unknown>) => request<T>(`${path}${buildQueryString(query)}`),
    post: <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body }),
    patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body }),
    delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
};
