"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { showToast } from "@/lib/notReady";

const durations = [30, 60, 90];

function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CreateMeetingPage() {
  const router = useRouter();
  const addMeeting = useAppStore((s) => s.addMeeting);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => toDateInputValue(new Date(Date.now() + 86400000)));
  const [time, setTime] = useState("14:00");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [provider, setProvider] = useState<"google_meet" | "zoom">("google_meet");
  const [memo, setMemo] = useState("");

  const canCreate = title.trim() !== "";

  function create() {
    if (!canCreate) return;
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    const startAt = new Date(year, month - 1, day, hour, minute);
    const endAt = new Date(startAt.getTime() + durationMinutes * 60000);
    const meeting = addMeeting({
      title: title.trim(),
      provider,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    });
    router.push("/meetings");
    showToast(`会議を作成しました。リンク: ${meeting.meetingUrl}`);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-primary-blue px-2 text-white">
        <button onClick={() => router.push("/meetings")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">新しい会議を作成</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-2 font-bold">タイトル *</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例：会派定例ミーティング"
          className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
        />

        <p className="mb-2 mt-4 font-bold">日時 *</p>
        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-tap-target flex-1 rounded-input border border-neutral-gray bg-white px-3"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-tap-target flex-1 rounded-input border border-neutral-gray bg-white px-3"
          />
        </div>

        <p className="mb-2 mt-4 font-bold">所要時間</p>
        <div className="flex gap-2">
          {durations.map((d) => (
            <button
              key={d}
              onClick={() => setDurationMinutes(d)}
              className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
                durationMinutes === d ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
              }`}
            >
              {d}分
            </button>
          ))}
        </div>

        <p className="mb-2 mt-4 font-bold">会議ツール</p>
        <div className="flex gap-2">
          <button
            onClick={() => setProvider("google_meet")}
            className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
              provider === "google_meet" ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
            }`}
          >
            Google Meet（推奨）
          </button>
          <button
            onClick={() => setProvider("zoom")}
            className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
              provider === "zoom" ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
            }`}
          >
            Zoom
          </button>
        </div>

        <p className="mb-2 mt-4 font-bold">メモ</p>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          placeholder="次回の議題について…"
          className="w-full rounded-input border border-neutral-gray bg-white p-3 outline-none focus:ring-2 focus:ring-brand-green"
        />

        <button
          onClick={create}
          disabled={!canCreate}
          className="mt-6 h-tap-target w-full rounded-input bg-brand-green font-bold text-white disabled:opacity-40"
        >
          作成する
        </button>
      </div>
    </div>
  );
}
