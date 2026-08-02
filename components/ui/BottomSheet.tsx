"use client";

import { Drawer } from "vaul";

/**
 * Flutter版の showModalBottomSheet 相当。7箇所（メモ入力・即時会議リンク・
 * テンプレート作成 等）全てがこれを使う共通部品。
 */
export function BottomSheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90vh] w-full max-w-[480px] flex-col rounded-t-sheet bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] outline-none">
          <Drawer.Handle className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-neutral-gray" />
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
