"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, AlarmClock, CalendarClock, BellOff } from "lucide-react";
import { useOverdueTodos, useReminderPersons, useTodaySchedules, daysSinceLastContact } from "@/store/appStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatHM } from "@/lib/formatDate";

/**
 * ホーム画面のベルアイコンから遷移する「お知らせ」画面。
 * このアプリはプッシュ通知の基盤を持たない静的SPAのため、過去の通知履歴を
 * 装うのではなく「今すぐ確認した方がよいこと」をその場で集計して見せる
 * （期限切れToDo・そろそろ連絡・本日の予定）。誠実さを優先した設計。
 */
export default function NotificationsPage() {
  const router = useRouter();
  const overdueTodos = useOverdueTodos();
  const reminderPersons = useReminderPersons();
  const todaySchedules = useTodaySchedules();

  const isEmpty = overdueTodos.length === 0 && reminderPersons.length === 0 && todaySchedules.length === 0;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">お知らせ</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {isEmpty ? (
          <EmptyState icon={BellOff} message="現在お知らせはありません" actionHint="のんびり過ごせそうですね" />
        ) : (
          <>
            {overdueTodos.length > 0 && (
              <>
                <h2 className="mb-2 text-lg font-bold text-error">期限切れのやること</h2>
                <div className="mb-6 flex flex-col gap-2">
                  {overdueTodos.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => router.push("/todo")}
                      className="flex items-center gap-3 rounded-card border-l-4 border-l-error bg-white p-3 text-left shadow-card"
                    >
                      <AlarmClock size={20} className="shrink-0 text-error" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{t.title}</p>
                        {t.dueDate && (
                          <p className="text-sm text-text-secondary">
                            期限 {new Date(t.dueDate).getMonth() + 1}/{new Date(t.dueDate).getDate()}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {reminderPersons.length > 0 && (
              <>
                <h2 className="mb-2 text-lg font-bold">そろそろ連絡</h2>
                <div className="mb-6 flex flex-col gap-2">
                  {reminderPersons.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => router.push(`/contacts?id=${p.id}`)}
                      className="flex items-center gap-3 rounded-card bg-white p-3 text-left shadow-card"
                    >
                      <Clock size={20} className="shrink-0 text-warning" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{p.name}さんに連絡</p>
                        <p className="text-sm text-text-secondary">最終接触から{daysSinceLastContact(p)}日</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {todaySchedules.length > 0 && (
              <>
                <h2 className="mb-2 text-lg font-bold">本日のご予定</h2>
                <div className="flex flex-col gap-2">
                  {todaySchedules.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => router.push("/calendar")}
                      className="flex items-center gap-3 rounded-card bg-white p-3 text-left shadow-card"
                    >
                      <CalendarClock size={20} className="shrink-0 text-primary-blue" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{s.title}</p>
                        <p className="text-sm text-text-secondary">{formatHM(new Date(s.startAt))}〜</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
