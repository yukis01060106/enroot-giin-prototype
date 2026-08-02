"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";

const durationOptions = [30, 60, 90];

/** オンライン会議のデフォルト設定（プロバイダ・所要時間）。/meetings/create の初期値に使う。 */
export function MeetingSettingsDialog({
  open,
  onOpenChange,
  provider,
  durationMin,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: "google_meet" | "zoom";
  durationMin: number;
  onSave: (params: { provider: "google_meet" | "zoom"; durationMin: number }) => void;
}) {
  const [localProvider, setLocalProvider] = useState(provider);
  const [localDuration, setLocalDuration] = useState(durationMin);

  // ダイアログが閉→開に切り替わったタイミングでのみ、現在の既定値を編集用stateへ
  // 反映し直す（レンダー中にsetStateする、Reactが推奨する「前回値との比較」パターン。
  // useEffectで行うとレンダーが1回余分に走るため避ける）。
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setLocalProvider(provider);
      setLocalDuration(durationMin);
    }
  }

  function save() {
    onSave({ provider: localProvider, durationMin: localDuration });
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="会議設定"
      footer={
        <>
          <button onClick={() => onOpenChange(false)} className="px-3 py-2 text-text-secondary">
            キャンセル
          </button>
          <button onClick={save} className="rounded-input bg-brand-green px-4 py-2 font-semibold text-white">
            保存
          </button>
        </>
      }
    >
      <div>
        <p className="mb-1.5 text-sm font-semibold text-text-secondary">既定の会議ツール</p>
        <div className="flex gap-2">
          <button
            onClick={() => setLocalProvider("google_meet")}
            className={`flex-1 rounded-input border-2 py-2 text-sm font-semibold ${
              localProvider === "google_meet" ? "border-brand-green bg-brand-green/10" : "border-neutral-gray"
            }`}
          >
            Google Meet
          </button>
          <button
            onClick={() => setLocalProvider("zoom")}
            className={`flex-1 rounded-input border-2 py-2 text-sm font-semibold ${
              localProvider === "zoom" ? "border-brand-green bg-brand-green/10" : "border-neutral-gray"
            }`}
          >
            Zoom
          </button>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold text-text-secondary">既定の所要時間</p>
        <div className="flex gap-2">
          {durationOptions.map((d) => (
            <button
              key={d}
              onClick={() => setLocalDuration(d)}
              className={`flex-1 rounded-input border-2 py-2 text-sm font-semibold ${
                localDuration === d ? "border-brand-green bg-brand-green/10" : "border-neutral-gray"
              }`}
            >
              {d}分
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
