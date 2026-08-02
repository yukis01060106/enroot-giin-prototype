"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { useAppStore } from "@/store/appStore";
import { googleCalendarService } from "@/lib/googleCalendarService";

const durationPresets = [
  { label: "30分", minutes: 30 },
  { label: "1時間", minutes: 60 },
  { label: "2時間", minutes: 120 },
] as const;

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = Math.floor(((total % 1440) + 1440) % 1440 / 60);
  const m = ((total % 60) + 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function roundedNow(): string {
  const now = new Date();
  const minute = now.getMinutes() < 30 ? 30 : 0;
  const hour = now.getMinutes() < 30 ? now.getHours() : (now.getHours() + 1) % 24;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** カレンダー「予定を追加する」ダイアログ。add_schedule_dialog.dart（本日Flutter側で再設計した版）の移植。 */
export function AddScheduleDialog({
  open,
  onOpenChange,
  selectedDay,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDay: Date;
}) {
  const addSchedule = useAppStore((s) => s.addSchedule);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState(roundedNow);
  const [endTime, setEndTime] = useState(() => fromMinutes(toMinutes(roundedNow()) + 60));

  const isValidRange = toMinutes(endTime) > toMinutes(startTime);

  function reset() {
    setTitle("");
    setLocation("");
    const s = roundedNow();
    setStartTime(s);
    setEndTime(fromMinutes(toMinutes(s) + 60));
  }

  function buildDateTime(hhmm: string): string {
    const [h, m] = hhmm.split(":").map(Number);
    return new Date(
      selectedDay.getFullYear(),
      selectedDay.getMonth(),
      selectedDay.getDate(),
      h,
      m
    ).toISOString();
  }

  function handleSave() {
    if (!title.trim() || !isValidRange) return;
    const startAt = buildDateTime(startTime);
    const endAt = buildDateTime(endTime);
    addSchedule({ title: title.trim(), location: location.trim() || undefined, startAt, endAt });
    if (googleCalendarService.isConnected()) {
      void googleCalendarService.pushEvent({
        id: "pending",
        title: title.trim(),
        location: location.trim() || undefined,
        startAt,
        endAt,
      });
    }
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="予定を追加する"
      footer={
        <>
          <button onClick={() => onOpenChange(false)} className="px-3 py-2 text-text-secondary">
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!isValidRange || !title.trim()}
            className="rounded-input bg-brand-green px-4 py-2 font-semibold text-white disabled:opacity-40"
          >
            保存
          </button>
        </>
      }
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="予定名"
        className="h-tap-target rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
      />
      <input
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="場所（任意）"
        className="h-tap-target rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
      />

      <div className="flex items-end gap-2">
        <label className="flex-1">
          <span className="mb-1 block text-xs text-text-secondary">開始</span>
          <div className="flex h-11 items-center gap-1.5 rounded-input bg-neutral-gray px-2.5">
            <Clock size={16} className="text-primary-blue" />
            <input
              type="time"
              value={startTime}
              onChange={(e) => {
                const v = e.target.value;
                setStartTime(v);
                if (toMinutes(endTime) <= toMinutes(v)) {
                  setEndTime(fromMinutes(toMinutes(v) + 60));
                }
              }}
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </div>
        </label>
        <span className="pb-3 text-text-secondary">→</span>
        <label className="flex-1">
          <span className="mb-1 block text-xs text-text-secondary">終了</span>
          <div
            className={`flex h-11 items-center gap-1.5 rounded-input bg-neutral-gray px-2.5 ${
              !isValidRange ? "ring-2 ring-error" : ""
            }`}
          >
            <Clock size={16} className="text-primary-blue" />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold outline-none"
            />
          </div>
        </label>
      </div>
      {!isValidRange && <p className="text-xs text-error">終了は開始より後の時刻にしてください</p>}

      <div className="flex gap-2">
        {durationPresets.map((preset) => (
          <button
            key={preset.label}
            onClick={() => setEndTime(fromMinutes(toMinutes(startTime) + preset.minutes))}
            className="rounded-chip border border-neutral-gray px-3 py-1 text-sm"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </Dialog>
  );
}
