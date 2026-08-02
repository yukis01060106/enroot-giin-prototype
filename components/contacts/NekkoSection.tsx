"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { nextNekkoMeetup, themeFor, pastMeetups } from "@/lib/nekkoUtils";
import { formatMD, formatMDWeekdayTime } from "@/lib/formatDate";
import { useAppStore } from "@/store/appStore";
import { showToast } from "@/lib/notReady";
import { BottomSheet } from "@/components/ui/BottomSheet";

/** ご縁タブ内「ねっこの会」セクション。nekko_section_view.dart の移植。 */
export function NekkoSection() {
  const meetupAt = nextNekkoMeetup();
  const theme = themeFor(meetupAt);
  const nekkoRsvpFor = useAppStore((s) => s.nekkoRsvpFor);
  const setNekkoRsvp = useAppStore((s) => s.setNekkoRsvp);
  const [detailOpen, setDetailOpen] = useState(false);

  const rsvped = nekkoRsvpFor === meetupAt.toISOString();

  function toggleRsvp() {
    if (rsvped) {
      setNekkoRsvp(null);
      showToast("参加登録を取り消しました");
    } else {
      setNekkoRsvp(meetupAt.toISOString());
      showToast("参加登録しました。当日はZoomリンクをお知らせします");
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <h1 className="text-xl font-bold">ねっこの会 〜議員の和〜</h1>

      <section>
        <h2 className="mb-2 font-bold">📅 次回のねっこの会</h2>
        <div className="rounded-card bg-gradient-primary p-4 shadow-raised text-white">
          <p className="text-lg font-bold">{formatMDWeekdayTime(meetupAt)}〜</p>
          <p className="mt-1 text-sm text-white/70">テーマ：{theme}</p>
          <div className="mt-3 flex gap-2">
            <button
              className={`flex h-tap-target flex-1 items-center justify-center gap-1.5 rounded-input border font-semibold ${
                rsvped ? "border-transparent bg-white text-brand-green" : "border-light-green"
              }`}
              onClick={toggleRsvp}
            >
              {rsvped && <Check size={18} />}
              {rsvped ? "参加登録済み" : "参加する"}
            </button>
            <button
              className="h-tap-target flex-1 rounded-input border border-white/40 font-semibold"
              onClick={() => setDetailOpen(true)}
            >
              詳しく見る
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-bold">💬 前回のおしゃべりメモ</h2>
        <div className="rounded-card bg-white p-3 shadow-card">
          前回のねっこの会では「視察で食べた美味しいもの自慢」が盛り上がりました。各地の名物グルメの話に花が咲き、次回は現地訪問の相談も出ています。
        </div>
      </section>

      <section>
        <h2 className="mb-2 font-bold">📋 過去のねっこの会</h2>
        <div className="flex flex-col gap-2">
          {pastMeetups(meetupAt).map((m) => (
            <div
              key={m.no}
              className="flex items-center justify-between rounded-card bg-white px-3 py-2.5 shadow-card"
            >
              <span>第{m.no}回</span>
              <span className="text-text-secondary">{formatMD(m.date)}</span>
            </div>
          ))}
        </div>
      </section>

      <BottomSheet open={detailOpen} onOpenChange={setDetailOpen}>
        <h2 className="mb-3 text-lg font-bold">ねっこの会について</h2>
        <div className="flex flex-col gap-3 text-sm leading-relaxed">
          <p>
            <span className="font-bold">日時：</span>
            {formatMDWeekdayTime(meetupAt)}〜（約1時間）
          </p>
          <p>
            <span className="font-bold">テーマ：</span>
            {theme}
          </p>
          <p>
            <span className="font-bold">開催形式：</span>
            オンライン（Zoom）。カメラ・マイクは任意、聞くだけの参加も歓迎です。
          </p>
          <p>
            毎月第3木曜19:30〜20:30に開催している、近隣自治体の若手議員同士の気軽な座談会です。テーマに沿って近況を話したり、他の議員の活動について気軽に聞いたりする場になっています。
          </p>
        </div>
        <button
          onClick={() => {
            toggleRsvp();
            setDetailOpen(false);
          }}
          className={`mt-4 h-tap-target w-full rounded-input font-bold ${
            rsvped ? "border border-neutral-gray text-text-secondary" : "bg-brand-green text-white"
          }`}
        >
          {rsvped ? "参加登録を取り消す" : "この回に参加登録する"}
        </button>
      </BottomSheet>
    </div>
  );
}
