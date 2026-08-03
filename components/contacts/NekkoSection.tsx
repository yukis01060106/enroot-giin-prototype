"use client";

import { useRef, useState } from "react";
import { Check, Camera } from "lucide-react";
import { nextNekkoMeetup, themeFor, pastMeetups, nekkoMemberNumber } from "@/lib/nekkoUtils";
import { formatMD, formatMDWeekdayTime } from "@/lib/formatDate";
import { useAppStore } from "@/store/appStore";
import { showToast } from "@/lib/notReady";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { fullNameWithHonorific } from "@/types/models";

/** 会員証サムネイル。タップでファイル選択→即保存（別途保存ボタンは挟まない）。 */
function MembershipCardAvatar({ photoUrl, onPick }: { photoUrl?: string; onPick: (dataUrl: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    onPick(dataUrl);
    showToast("会員証の写真を更新しました");
  }

  return (
    <button
      onClick={() => inputRef.current?.click()}
      aria-label="会員証の写真を変更"
      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/60 bg-white/15"
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={onFileSelected} className="hidden" />
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-white/70">
          <Camera size={22} />
        </span>
      )}
      <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-white text-brand-green shadow-card">
        <Camera size={11} />
      </span>
    </button>
  );
}

function NekkoMembershipCard() {
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const meetupAt = nextNekkoMeetup();

  return (
    <div className="relative overflow-hidden rounded-card bg-gradient-primary p-4 text-white shadow-raised">
      <div className="pointer-events-none absolute -right-6 -top-10 h-28 w-28 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/10" />

      <p className="relative text-xs font-semibold tracking-wide text-white/70">ねっこの会 デジタル会員証</p>

      <div className="relative mt-3 flex items-center gap-4">
        <MembershipCardAvatar
          photoUrl={profile.avatarPhotoUrl}
          onPick={(dataUrl) => updateProfile((p) => ({ ...p, avatarPhotoUrl: dataUrl }))}
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{fullNameWithHonorific(profile)}</p>
          <p className="truncate text-sm text-white/80">{profile.councilName}</p>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-xs text-white/70">
        <span>会員No. {nekkoMemberNumber(profile.displayName)}</span>
        <span>次回 {formatMD(meetupAt)}〜</span>
      </div>
    </div>
  );
}

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

      <NekkoMembershipCard />

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
