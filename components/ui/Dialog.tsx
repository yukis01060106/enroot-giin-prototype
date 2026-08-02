"use client";

import * as RadixDialog from "@radix-ui/react-dialog";

/**
 * Flutter版の showDialog(AlertDialog) 相当。タグ編集・予定追加・ToDo追加・
 * ベンチマークアカウント追加の4箇所がこれを使う共通部品。
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-card bg-white p-5 shadow-raised outline-none">
          <RadixDialog.Title className="mb-4 text-lg font-bold text-text-primary">
            {title}
          </RadixDialog.Title>
          <div className="flex flex-col gap-3">{children}</div>
          {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
