import { ApiError } from "@/lib/api/http";

export function getErrorMessage(
    error: unknown,
    fallback: string,
    statusMessages: Partial<Record<number, string>> = {},
): string {
    if (error instanceof ApiError && error.status && statusMessages[error.status]) {
        return statusMessages[error.status]!;
    }
    return fallback;
}
