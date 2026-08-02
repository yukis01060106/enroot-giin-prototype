"use client";

import { useRouter } from "next/navigation";
import { Mic, Edit, Camera } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { showToast } from "@/lib/notReady";

export function RecordBottomSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();

  function goVoice() {
    onOpenChange(false);
    router.push("/record?mode=voice");
  }
  function goText() {
    onOpenChange(false);
    router.push("/record?mode=text");
  }
  function notReadyPhoto() {
    onOpenChange(false);
    showToast("写真入力はAPIキー設定後に有効になります（プロトタイプでは「文字で入力」をお試しください）");
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col gap-4 pb-2">
        <button
          onClick={goVoice}
          className="flex h-tap-target items-center justify-center gap-3 rounded-input bg-brand-green text-lg font-bold text-white"
        >
          <Mic size={28} />
          おしてはなす
        </button>
        <button
          onClick={goText}
          className="flex h-tap-target items-center justify-center gap-3 rounded-input bg-primary-blue text-lg font-bold text-white"
        >
          <Edit size={28} />
          文字で入力
        </button>
        <button
          onClick={notReadyPhoto}
          className="flex h-tap-target items-center justify-center gap-3 rounded-input bg-primary-blue text-lg font-bold text-white"
        >
          <Camera size={28} />
          写真を撮る
        </button>
      </div>
    </BottomSheet>
  );
}
