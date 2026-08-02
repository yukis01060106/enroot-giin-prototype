"use client";

import { useEffect, useState } from "react";
import { registerToastHandler } from "@/lib/notReady";

interface ToastItem {
  id: number;
  message: string;
}

let nextId = 0;

/** app/layout.tsxに一度だけマウントする、SnackBar相当のトースト表示ホスト。 */
export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    registerToastHandler((message: string) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2600);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto max-w-[90%] rounded-input bg-text-primary px-4 py-2.5 text-center text-sm text-white shadow-raised"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
