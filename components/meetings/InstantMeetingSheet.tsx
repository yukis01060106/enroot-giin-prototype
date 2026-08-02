"use client";

import { useState } from "react";
import { Link2, CheckCircle2, Copy } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useAppStore } from "@/store/appStore";
import type { ScheduleModel } from "@/types/models";
import { showToast } from "@/lib/notReady";

export function InstantMeetingSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const addMeeting = useAppStore((s) => s.addMeeting);
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState<"google_meet" | "zoom">("google_meet");
  const [created, setCreated] = useState<ScheduleModel | null>(null);

  function reset() {
    setTitle("");
    setProvider("google_meet");
    setCreated(null);
  }

  function issue() {
    const meeting = addMeeting({
      title: title.trim() || "クイック会議",
      provider,
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 3600000).toISOString(),
    });
    setCreated(meeting);
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex items-center gap-2">
          <Link2 size={20} className="text-brand-green" />
          <h2 className="text-lg font-bold">会議リンクを発行</h2>
        </div>

        {!created ? (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => setProvider("google_meet")}
                className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
                  provider === "google_meet" ? "bg-brand-green text-white" : "bg-neutral-gray text-text-secondary"
                }`}
              >
                Google Meet（推奨）
              </button>
              <button
                onClick={() => setProvider("zoom")}
                className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
                  provider === "zoom" ? "bg-brand-green text-white" : "bg-neutral-gray text-text-secondary"
                }`}
              >
                Zoom
              </button>
            </div>
            <div>
              <p className="mb-2 font-semibold">会議名（任意）</p>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：クイック会議"
                className="h-tap-target w-full rounded-input bg-neutral-gray px-3 outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <button onClick={issue} className="h-tap-target rounded-input bg-brand-green font-bold text-white">
              リンクを発行
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-brand-green">
              <CheckCircle2 size={20} />
              リンクが発行されました
            </div>
            <div className="rounded-input bg-neutral-gray p-3 text-primary-blue">{created.meetingUrl}</div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(created.meetingUrl ?? "");
                  showToast("リンクをコピーしました");
                }}
                className="flex h-tap-target flex-1 items-center justify-center gap-2 rounded-input border border-neutral-gray font-semibold"
              >
                <Copy size={16} />
                コピー
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="h-tap-target flex-1 rounded-input bg-brand-green font-bold text-white"
              >
                閉じる
              </button>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
