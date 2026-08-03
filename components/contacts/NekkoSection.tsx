"use client";

import { useRef, useState } from "react";
import { Check, Camera, Sprout } from "lucide-react";
import { nextNekkoMeetup, themeFor, pastMeetups, nekkoMemberNumber } from "@/lib/nekkoUtils";
import { formatMD, formatMDWeekdayTime } from "@/lib/formatDate";
import { useAppStore } from "@/store/appStore";
import { showToast } from "@/lib/notReady";
import { BottomSheet } from "@/components/ui/BottomSheet";

const NEKKO_SCHEDULE_TITLE = "ねっこの会 〜議員の和〜";

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
      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-white/70 bg-white/15 shadow-card"
    >
      <input ref={inputRef} type="file" accept="image/*" onChange={onFileSelected} className="hidden" />
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-white/80">
          <Camera size={26} />
          <span className="text-[10px] font-semibold">写真を追加</span>
        </span>
      )}
      <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-brand-green shadow-card">
        <Camera size={13} />
      </span>
    </button>
  );
}

/** 会員証と同じ見た目の枠を共有するための土台（装飾円・斜めのシャイン等）。 */
function MembershipCardFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-blue via-primary-blue to-brand-green p-5 text-white shadow-raised">
      <div className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute inset-y-0 right-10 w-24 -skew-x-12 bg-white/5" />
      {children}
    </div>
  );
}

/** 未入会状態。会員証の位置に表示する入会案内カード。 */
function NekkoJoinCard({ onJoin }: { onJoin: () => void }) {
  return (
    <MembershipCardFrame>
      <div className="relative flex items-center gap-1.5">
        <Sprout size={17} />
        <span className="text-xs font-bold tracking-[0.15em]">ねっこの会</span>
      </div>
      <p className="relative mt-3 text-lg font-bold leading-snug">
        近隣自治体の若手議員同士の、気軽なオンライン座談会
      </p>
      <p className="relative mt-1.5 text-sm text-white/85">
        入会するとデジタル会員証が発行され、開催案内が届くようになります。
      </p>
      <button
        onClick={onJoin}
        className="relative mt-4 flex h-tap-target w-full items-center justify-center gap-2 rounded-input bg-white font-bold text-brand-green"
      >
        <Sprout size={18} />
        ねっこの会に参加する
      </button>
    </MembershipCardFrame>
  );
}

function NekkoMembershipCard() {
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const meetupAt = nextNekkoMeetup();

  return (
    <MembershipCardFrame>
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sprout size={17} />
          <span className="text-xs font-bold tracking-[0.15em]">ねっこの会</span>
        </div>
        <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold tracking-widest">
          MEMBER CARD
        </span>
      </div>

      <div className="relative mt-5 flex items-center gap-4">
        <MembershipCardAvatar
          photoUrl={profile.avatarPhotoUrl}
          onPick={(dataUrl) => updateProfile((p) => ({ ...p, avatarPhotoUrl: dataUrl }))}
        />
        <div className="min-w-0">
          {/* 会員証の名義は氏名のみ（「先生」は呼びかけの言葉のため名義欄には入れない）。
              肩書はこの下の議会名で足りる。 */}
          <p className="truncate text-2xl font-bold">{profile.displayName}</p>
          <p className="truncate text-sm text-white/85">{profile.councilName}</p>
        </div>
      </div>

      <div className="relative mt-5 flex items-end justify-between border-t border-white/25 pt-3">
        <div>
          <p className="text-[10px] tracking-widest text-white/60">MEMBER NO.</p>
          <p className="font-mono text-base tracking-wider">{nekkoMemberNumber(profile.displayName)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] tracking-widest text-white/60">次回開催</p>
          <p className="text-sm font-semibold">{formatMD(meetupAt)}</p>
        </div>
      </div>
    </MembershipCardFrame>
  );
}

/** ご縁タブ内「ねっこの会」セクション。nekko_section_view.dart の移植。 */
export function NekkoSection() {
  const meetupAt = nextNekkoMeetup();
  const theme = themeFor(meetupAt);
  const profile = useAppStore((s) => s.profile);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const nekkoRsvpFor = useAppStore((s) => s.nekkoRsvpFor);
  const setNekkoRsvp = useAppStore((s) => s.setNekkoRsvp);
  const schedules = useAppStore((s) => s.schedules);
  const addSchedule = useAppStore((s) => s.addSchedule);
  const removeSchedule = useAppStore((s) => s.removeSchedule);
  const [detailOpen, setDetailOpen] = useState(false);

  const joined = !!profile.nekkoMemberSince;
  const rsvped = nekkoRsvpFor === meetupAt.toISOString();
  const existingSchedule = schedules.find(
    (s) => s.title === NEKKO_SCHEDULE_TITLE && s.startAt === meetupAt.toISOString()
  );

  function handleJoin() {
    updateProfile((p) => ({ ...p, nekkoMemberSince: new Date().toISOString() }));
    showToast("ねっこの会に参加しました。会員証を発行しました");
  }

  // 「参加する」を押すだけでRSVPと同時にカレンダーへの予定登録まで完結させる
  // （コミュニティに入ると段取りも勝手に整う、という体験にするため）。
  // 取り消し時は追加した予定も一緒に消す（RSVPを取り消したのに予定だけ
  // カレンダーに残る、という食い違いを避ける）。
  function toggleRsvp() {
    if (rsvped) {
      setNekkoRsvp(null);
      if (existingSchedule) removeSchedule(existingSchedule.id);
      showToast("参加登録を取り消しました");
    } else {
      setNekkoRsvp(meetupAt.toISOString());
      if (!existingSchedule) {
        addSchedule({
          title: NEKKO_SCHEDULE_TITLE,
          location: "オンライン（Zoom）",
          startAt: meetupAt.toISOString(),
          endAt: new Date(meetupAt.getTime() + 3600000).toISOString(),
        });
      }
      showToast("参加登録しました。カレンダーにも予定を追加しました");
    }
  }

  return (
    <div className="flex flex-col gap-5 p-4">
      <h1 className="text-xl font-bold">ねっこの会 〜議員の和〜</h1>

      {joined ? <NekkoMembershipCard /> : <NekkoJoinCard onJoin={handleJoin} />}

      <section>
        <h2 className="mb-2 text-lg font-bold">次回のねっこの会</h2>
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

      {joined && (
        <section>
          <h2 className="mb-2 text-lg font-bold">前回のおしゃべりメモ</h2>
          <div className="rounded-card bg-white p-3 shadow-card">
            前回は視察報告書のまとめ方が話題になりました。他市の事例をどう一般質問につなげるか、具体的な書き方を持ち寄る流れになっています。
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-bold">過去のねっこの会</h2>
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
