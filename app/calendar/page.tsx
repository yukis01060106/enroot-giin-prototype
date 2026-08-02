"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { AddScheduleDialog } from "@/components/calendar/AddScheduleDialog";
import { useAppStore } from "@/store/appStore";
import { formatHM } from "@/lib/formatDate";

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function CalendarPage() {
  const router = useRouter();
  const schedules = useAppStore((s) => s.schedules);
  const [focusedMonth, setFocusedMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [dialogOpen, setDialogOpen] = useState(false);

  const selectedSchedules = useMemo(
    () =>
      schedules
        .filter((s) => isSameDay(new Date(s.startAt), selectedDay))
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [schedules, selectedDay]
  );

  const hasEvents = (day: Date) => schedules.some((s) => isSameDay(new Date(s.startAt), day));

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-primary-blue px-2 text-white">
        <button onClick={() => router.back()} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">カレンダー</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <MonthCalendar
          focusedMonth={focusedMonth}
          selectedDay={selectedDay}
          hasEvents={hasEvents}
          onSelectDay={setSelectedDay}
          onChangeMonth={setFocusedMonth}
        />

        <h2 className="mb-2 mt-4 text-lg font-bold">選択した日の予定</h2>
        {selectedSchedules.length === 0 ? (
          <p className="text-text-secondary">予定はありません</p>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedSchedules.map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-card bg-white p-3 shadow-card">
                <span className="font-bold text-brand-green">{formatHM(new Date(s.startAt))}</span>
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
              </div>
            ))}
          </div>
        )}
        <div className="h-20" />
      </div>

      <button
        onClick={() => setDialogOpen(true)}
        className="absolute bottom-5 right-5 flex h-14 items-center gap-2 rounded-full bg-brand-green px-5 font-bold text-white shadow-raised"
      >
        <Plus size={20} />
        予定を追加する
      </button>

      <AddScheduleDialog open={dialogOpen} onOpenChange={setDialogOpen} selectedDay={selectedDay} />
    </div>
  );
}
