"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ConfirmDialog, { type ConfirmTone } from "./ConfirmDialog";

export interface ConfirmOptions {
  title: string;
  text?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // Options are kept after closing so the text doesn't change during the exit animation.
  const [options, setOptions] = useState<ConfirmOptions>({ title: "" });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    resolve?.(value);
  }, []);

  const confirm = useCallback<ConfirmFn>((next) => {
    // A pending confirmation is answered "no" when a new one replaces it.
    resolverRef.current?.(false);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setOptions(next);
      setOpen(true);
    });
  }, []);

  // Never leave a promise hanging if the provider goes away.
  useEffect(() => () => {
    resolverRef.current?.(false);
    resolverRef.current = null;
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={open}
        title={options.title}
        text={options.text}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        tone={options.tone}
        onResult={settle}
      />
    </ConfirmContext.Provider>
  );
}
