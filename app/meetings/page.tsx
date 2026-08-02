"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Link2, ChevronRight, Video, PlusCircle, Settings } from "lucide-react";
import { useMeetings } from "@/store/appStore";
import { InstantMeetingSheet } from "@/components/meetings/InstantMeetingSheet";
import { formatHM, formatMDWeekdayTime } from "@/lib/formatDate";
import { showNotReady } from "@/lib/notReady";
import type { ScheduleModel } from "@/types/models";

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function MeetingCard({ meeting, showJoin, isPast = false }: { meeting: ScheduleModel; showJoin: boolean; isPast?: boolean }) {
  const start = new Date(meeting.startAt);
  const end = meeting.endAt ? new Date(meeting.endAt) : new Date(start.getTime() + 3600000);
  const now = new Date();
  const joinActive = now.getTime() >= start.getTime() - 30 * 60000 && now.getTime() <= end.getTime();
  const label = meeting.meetingProvider === "zoom" ? "Zoom" : "Google Meet";
  const dateLabel = isPast || !isToday(start) ? formatMDWeekdayTime(start) : formatHM(start);

  return (
    <div className="mb-2 rounded-card bg-white p-4 shadow-card">
      <div className="flex items-center gap-1.5">
        <Video size={16} className={isPast ? "text-text-secondary" : "text-brand-green"} />
        <span className={`font-bold ${isPast ? "text-text-secondary" : ""}`}>{dateLabel}</span>
        {isPast && <span className="ml-2 text-xs text-text-secondary">完了</span>}
      </div>
      <p className="mt-1.5 font-bold">{meeting.title}</p>
      <p className="text-text-secondary">{label}</p>
      {showJoin && (
        <button
          onClick={() => showNotReady("Google Meet/Zoomとの連携")}
          disabled={!joinActive}
          className={`mt-3 h-tap-target w-full rounded-input font-bold ${
            joinActive ? "bg-brand-green text-white" : "bg-neutral-gray text-text-secondary"
          }`}
        >
          参加する →
        </button>
      )}
    </div>
  );
}

export default function MeetingsPage() {
  const router = useRouter();
  const meetings = useMeetings();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { today, upcoming, past } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    return {
      today: meetings.filter((m) => {
        const s = new Date(m.startAt);
        return s >= todayStart && s < todayEnd;
      }),
      upcoming: meetings.filter((m) => new Date(m.startAt) >= todayEnd),
      past: meetings
        .filter((m) => {
          const s = new Date(m.startAt);
          return s < todayStart && s > weekAgo;
        })
        .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()),
    };
  }, [meetings]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between bg-primary-blue px-2 text-white">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold">オンライン会議</h1>
        </div>
        <button onClick={() => showNotReady("会議設定")} aria-label="設定" className="rounded-full p-2">
          <Settings size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center gap-3 rounded-card bg-gradient-primary p-4 text-white shadow-raised"
        >
          <Link2 size={28} />
          <div className="min-w-0 flex-1 text-left">
            <p className="font-bold">今すぐリンクを発行</p>
            <p className="text-xs text-white/70">ワンタップでリンク生成＆共有</p>
          </div>
          <ChevronRight size={20} />
        </button>

        {today.length > 0 && (
          <>
            <h2 className="mb-2 mt-6 text-lg font-bold">今日の会議</h2>
            {today.map((m) => (
              <MeetingCard key={m.id} meeting={m} showJoin />
            ))}
          </>
        )}
        {upcoming.length > 0 && (
          <>
            <h2 className="mb-2 mt-6 text-lg font-bold">予定されている会議</h2>
            {upcoming.map((m) => (
              <MeetingCard key={m.id} meeting={m} showJoin={false} />
            ))}
          </>
        )}
        {past.length > 0 && (
          <>
            <h2 className="mb-2 mt-6 text-lg font-bold">過去の会議（直近7日間）</h2>
            {past.map((m) => (
              <MeetingCard key={m.id} meeting={m} showJoin={false} isPast />
            ))}
          </>
        )}
        {today.length === 0 && upcoming.length === 0 && past.length === 0 && (
          <p className="pt-12 text-center text-text-secondary">予定されている会議はありません</p>
        )}

        <button
          onClick={() => router.push("/meetings/create")}
          className="mt-6 flex h-tap-target w-full items-center justify-center gap-2 rounded-input border border-primary-blue font-semibold text-primary-blue"
        >
          <PlusCircle size={18} />
          新しい会議を作成
        </button>
      </div>

      <InstantMeetingSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
