"use client";

import { useRef, type ReactNode } from "react";
import { Dialog, Portal } from "@chakra-ui/react";
import { Button } from "tikin-uai";

export type ConfirmTone = "default" | "danger";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  text?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  /** Called with `true` when confirmed, `false` for cancel, Esc or backdrop click. */
  onResult: (confirmed: boolean) => void;
}

export default function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  onResult,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const danger = tone === "danger";

  return (
    <Dialog.Root
      open={open}
      role={danger ? "alertdialog" : "dialog"}
      initialFocusEl={() => (danger ? cancelRef.current : confirmRef.current)}
      onOpenChange={(e) => {
        if (!e.open) onResult(false);
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            {text ? <Dialog.Body>{text}</Dialog.Body> : null}
            <Dialog.Footer>
              <Button ref={cancelRef} variant="outline" onClick={() => onResult(false)}>
                {cancelLabel}
              </Button>
              <Button
                ref={confirmRef}
                colorPalette={danger ? "danger" : "primary"}
                onClick={() => onResult(true)}
              >
                {confirmLabel}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
