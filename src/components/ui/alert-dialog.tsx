import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import type { ReactNode } from "react";
import { Button } from "./button";

export const AlertDialog = AlertDialogPrimitive.Root;
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

export function AlertDialogContent({
  title,
  description,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  danger,
}: {
  title: string;
  description: ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
      <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[min(480px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
        <AlertDialogPrimitive.Title className="text-base font-semibold">{title}</AlertDialogPrimitive.Title>
        <AlertDialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted">
          {description}
        </AlertDialogPrimitive.Description>
        <div className="mt-5 flex justify-end gap-2">
          <AlertDialogPrimitive.Cancel asChild>
            <Button variant="secondary">{cancelText}</Button>
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action asChild>
            <Button variant={danger ? "danger" : "default"} onClick={onConfirm}>
              {confirmText}
            </Button>
          </AlertDialogPrimitive.Action>
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  );
}
