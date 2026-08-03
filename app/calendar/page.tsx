"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, MapPin, Video, CalendarX2 } from "lucide-react";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { AddScheduleDialog } from "@/components/calendar/AddScheduleDialog";
import { EmptyState } from "@/components/ui/EmptyState";
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
  const today = new Date();
  const isTodaySelected = isSameDay(selectedDay, today);

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-lg font-bold">カレンダー</h1>
        {!isTodaySelected && (
          <button
            onClick={() => {
              setFocusedMonth(today);
              setSelectedDay(today);
            }}
            className="rounded-chip bg-white/20 px-3 py-1.5 text-sm font-semibold"
          >
            今日
          </button>
        )}
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
          <EmptyState icon={CalendarX2} message="この日の予定はありません" />
        ) : (
          <div className="flex flex-col gap-2">
            {selectedSchedules.map((s) => (
              <div key={s.id} className="flex items-start gap-3 rounded-card bg-white p-3 shadow-card">
                <div className="pt-0.5 text-right">
                  <p className="font-bold text-brand-green">{formatHM(new Date(s.startAt))}</p>
                  {s.endAt && <p className="text-xs text-text-secondary">〜{formatHM(new Date(s.endAt))}</p>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate">{s.title}</p>
                  {s.location && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-secondary">
                      <MapPin size={12} className="shrink-0" />
                      {s.location}
                    </p>
                  )}
                </div>
                {s.meetingUrl && (
                  <button
                    onClick={() => window.open(s.meetingUrl, "_blank", "noopener,noreferrer")}
                    aria-label="オンライン会議に参加"
                    className="flex shrink-0 items-center gap-1 rounded-chip bg-accent-indigo/12 px-2 py-1 text-xs font-semibold text-accent-indigo"
                  >
                    <Video size={13} />
                    参加
                  </button>
                )}
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
