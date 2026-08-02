"use client";

import Link from "next/link";
import { useState } from "react";
import { RecordBottomSheet } from "@/components/RecordBottomSheet";
import {
  Search,
  Bell,
  Calendar,
  SquarePen,
  IdCard,
  Megaphone,
  Receipt,
  Trees,
  Video,
  Circle,
  Clock,
  FileText,
} from "lucide-react";
import { SecretaryAvatar } from "@/components/SecretaryAvatar";
import { greeting as buildGreeting } from "@/lib/secretaryService";
import { useAppStore, usePendingTodos, useReminderPersons, daysSinceLastContact } from "@/store/appStore";
import { recordCategoryLabels } from "@/types/models";
import { showNotReady } from "@/lib/notReady";

const featureCards = [
  { icon: Calendar, label: "カレンダー", color: "text-accent-crimson", bg: "bg-accent-crimson/12", href: "/calendar" },
  { icon: SquarePen, label: "メモ", color: "text-primary-blue", bg: "bg-primary-blue/12", href: null },
  { icon: IdCard, label: "名刺管理", color: "text-brand-green", bg: "bg-brand-green/12", href: "/contacts" },
  { icon: Megaphone, label: "発信", color: "text-accent-rose", bg: "bg-accent-rose/12", href: "/posting" },
  { icon: Receipt, label: "経費", color: "text-accent-amber", bg: "bg-accent-amber/12", href: "/expense" },
  { icon: Trees, label: "コミュニティ", color: "text-accent-teal", bg: "bg-accent-teal/12", href: "/contacts?tab=community" },
  { icon: Video, label: "オンライン会議", color: "text-accent-indigo", bg: "bg-accent-indigo/12", href: "/meetings" },
] as const;

export default function HomePage() {
  const pendingTodos = usePendingTodos().slice(0, 3);
  const reminderPersons = useReminderPersons().slice(0, 2);
  const records = useAppStore((s) => s.records).slice(0, 3);
  const greetingText = buildGreeting();
  const [recordSheetOpen, setRecordSheetOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between bg-primary-blue px-4 text-white">
        <h1 className="text-lg font-bold">ホーム</h1>
        <div className="flex items-center gap-1">
          <Link href="/search" aria-label="横断検索" className="rounded-full p-2">
            <Search size={20} />
          </Link>
          <button aria-label="通知" className="rounded-full p-2" onClick={() => showNotReady("通知")}>
            <Bell size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <Link
          href="/secretary"
          className="flex gap-3 rounded-card bg-white p-4 shadow-card"
        >
          <SecretaryAvatar size={56} />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-3 text-base text-text-primary">{greetingText}</p>
            <p className="mt-1.5 font-bold text-brand-green">美咲に相談する →</p>
          </div>
        </Link>

        <h2 className="mb-2 mt-5 text-lg font-bold">できること</h2>
        <div className="grid grid-cols-2 gap-3">
          {featureCards.map(({ icon: Icon, label, color, bg, href }) =>
            href ? (
              <Link
                key={label}
                href={href}
                className="flex items-center gap-2.5 rounded-card bg-white px-3.5 py-3 shadow-card"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-input ${bg}`}>
                  <Icon size={22} className={color} />
                </span>
                <span className="truncate font-semibold text-text-primary">{label}</span>
              </Link>
            ) : (
              <button
                key={label}
                onClick={() => setRecordSheetOpen(true)}
                className="flex items-center gap-2.5 rounded-card bg-white px-3.5 py-3 text-left shadow-card"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-input ${bg}`}>
                  <Icon size={22} className={color} />
                </span>
                <span className="truncate font-semibold text-text-primary">{label}</span>
              </button>
            )
          )}
        </div>

        {(pendingTodos.length > 0 || reminderPersons.length > 0) && (
          <>
            <div className="mb-2 mt-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">進行中</h2>
              <Link href="/todo" className="text-sm text-primary-blue">
                すべて見る
              </Link>
            </div>
            <div className="divide-y divide-neutral-gray rounded-card bg-white shadow-card">
              {pendingTodos.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <Circle size={20} className="shrink-0 text-text-secondary" />
                  <div className="min-w-0">
                    <p className="truncate">{t.title}</p>
                    {t.dueDate && (
                      <p className="text-xs text-text-secondary">
                        期限 {new Date(t.dueDate).getMonth() + 1}/{new Date(t.dueDate).getDate()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {reminderPersons.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <Clock size={20} className="shrink-0 text-warning" />
                  <div className="min-w-0">
                    <p className="truncate">{p.name}さんに連絡</p>
                    <p className="text-xs text-text-secondary">
                      最終接触から{daysSinceLastContact(p)}日
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {records.length > 0 && (
          <>
            <h2 className="mb-2 mt-6 text-lg font-bold">最近の記録</h2>
            <div className="divide-y divide-neutral-gray rounded-card bg-white shadow-card">
              {records.map((r) => (
                <div key={r.id} className="flex items-start gap-3 px-4 py-3">
                  <FileText size={20} className="mt-0.5 shrink-0 text-primary-blue" />
                  <div className="min-w-0">
                    <p className="line-clamp-2">{r.content}</p>
                    {r.categories[0] && (
                      <p className="text-xs text-text-secondary">
                        {recordCategoryLabels[r.categories[0]]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="h-4" />
      </div>
      <RecordBottomSheet open={recordSheetOpen} onOpenChange={setRecordSheetOpen} />
    </div>
  );
}
