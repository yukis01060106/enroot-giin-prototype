"use client";

import { nextNekkoMeetup, themeFor, pastMeetups } from "@/lib/nekkoUtils";
import { formatMD, formatMDWeekdayTime } from "@/lib/formatDate";
import { showNotReady } from "@/lib/notReady";

/** ご縁タブ内「ねっこの会」セクション。nekko_section_view.dart の移植。 */
export function NekkoSection() {
  const meetupAt = nextNekkoMeetup();
  const theme = themeFor(meetupAt);

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
              className="h-tap-target flex-1 rounded-input border border-light-green font-semibold"
              onClick={() => showNotReady("Zoom参加登録")}
            >
              参加する
            </button>
            <button
              className="h-tap-target flex-1 rounded-input border border-white/40 font-semibold"
              onClick={() => showNotReady("詳細表示")}
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
    </div>
  );
}
