import { toaster } from "tikin-uai";

const ERROR_DURATION_MS = 8000;

export function notifySuccess(message: string) {
  toaster.create({ title: message, type: "success" });
}

export function notifyError(message: string) {
  toaster.create({ title: message, type: "error", duration: ERROR_DURATION_MS });
}

export function notifyWarning(message: string) {
  toaster.create({ title: message, type: "warning" });
}
