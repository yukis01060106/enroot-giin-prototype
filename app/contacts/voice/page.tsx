"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mic, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { showToast } from "@/lib/notReady";

const mockVoiceContacts = [
  {
    transcript: "田中花子さん、大牟田青年会議所の理事の方です。電話番号は090-1111-2222です。",
    name: "田中花子",
    organization: "大牟田青年会議所",
    title: "理事",
    phone: "090-1111-2222",
    email: "",
  },
  {
    transcript: "鈴木健太さん、大牟田商工会議所の事務局長さんです。",
    name: "鈴木健太",
    organization: "大牟田商工会議所",
    title: "事務局長",
    phone: "",
    email: "",
  },
  {
    transcript: "山田次郎さん、本町一丁目自治会の会長さんです。電話は090-3333-4444です。",
    name: "山田次郎",
    organization: "本町一丁目自治会",
    title: "会長",
    phone: "090-3333-4444",
    email: "",
  },
];

/**
 * 「声で追加」フロー。record/page.tsx の音声メモ（タップ開始/停止）と
 * contacts/scan/page.tsx の確認フォームを組み合わせたもの。
 * 文字起こし・人物情報の抽出はモック（本番では音声認識APIに置き換える）。
 */
export default function ContactVoiceAddPage() {
  const router = useRouter();
  const addPerson = useAppStore((s) => s.addPerson);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function start() {
    setRecording(true);
    setElapsed(0);
    timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
  }

  async function stop() {
    setRecording(false);
    if (timerRef.current) window.clearInterval(timerRef.current);
    setTranscribing(true);
    await new Promise((r) => setTimeout(r, 1300));
    const mock = mockVoiceContacts[Math.floor(Math.random() * mockVoiceContacts.length)];
    setTranscript(mock.transcript);
    setName(mock.name);
    setOrganization(mock.organization);
    setTitle(mock.title);
    setPhone(mock.phone);
    setEmail(mock.email);
    setTranscribing(false);
  }

  function toggle() {
    if (recording) stop();
    else start();
  }

  function save() {
    if (!name.trim()) return;
    const person = addPerson({
      name: name.trim(),
      organization: organization.trim() || undefined,
      title: title.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
    });
    router.push(`/contacts?id=${person.id}`);
    showToast("名刺を保存しました");
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/contacts")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">{transcript ? "内容を確認" : "声で追加"}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {!transcript ? (
          <div className="flex h-full flex-col items-center justify-center gap-8">
            {transcribing ? (
              <>
                <Loader2 size={32} className="animate-spin text-brand-green" />
                <p className="text-lg font-bold">文字に変換しています…</p>
              </>
            ) : (
              <>
                <p className="text-lg text-text-secondary">
                  {recording ? "録音中です。もう一度タップすると終了します" : "名前や所属を話してください"}
                </p>
                <button
                  onClick={toggle}
                  className={`flex h-32 w-32 items-center justify-center rounded-full transition-transform ${
                    recording ? "scale-110 bg-error" : "bg-brand-green"
                  }`}
                >
                  <Mic size={56} className="text-white" />
                </button>
                <p className="text-text-secondary">{recording ? `録音中… ${elapsed}秒` : "タップで録音開始"}</p>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-card bg-white p-3 text-sm text-text-secondary shadow-card">「{transcript}」</div>
            <div>
              <label className="mb-1 block font-semibold">名前 *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold">所属（任意）</label>
              <input
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold">役職（任意）</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold">電話番号（任意）</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold">メール（任意）</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3 outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            <button
              onClick={save}
              disabled={!name.trim()}
              className="h-tap-target rounded-input bg-brand-green font-bold text-white disabled:opacity-40"
            >
              保存する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
