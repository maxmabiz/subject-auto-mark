import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  title,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { title?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[min(640px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white shadow-xl",
          className,
        )}
        {...props}
      >
        {title ? (
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <DialogPrimitive.Title className="text-base font-semibold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-md p-1 text-slate-500 hover:bg-slate-100">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
        ) : (
          <DialogPrimitive.Title className="sr-only">对话框</DialogPrimitive.Title>
        )}
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
