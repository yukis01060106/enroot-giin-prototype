"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, IdCard, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { showToast } from "@/lib/notReady";

const mockCards = [
  { name: "田中花子", organization: "大牟田青年会議所", title: "理事", phone: "090-1111-2222", email: "" },
  { name: "鈴木健太", organization: "大牟田商工会議所", title: "事務局長", phone: "0944-11-2233", email: "" },
  { name: "山田次郎", organization: "本町一丁目自治会", title: "会長", phone: "090-3333-4444", email: "" },
];

/**
 * 名刺撮影→内容確認の2画面を1ページのローカルstepで表現する。
 * expense/scan/page.tsx（レシートOCRのモック）と同じパターン。
 */
export default function ContactScanPage() {
  const router = useRouter();
  const addPerson = useAppStore((s) => s.addPerson);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  async function startScan() {
    setScanning(true);
    // 実際にはここでカメラ撮影 → Google Cloud Vision API (OCR) を呼び出す。
    await new Promise((r) => setTimeout(r, 1400));
    const mock = mockCards[Math.floor(Math.random() * mockCards.length)];
    setName(mock.name);
    setOrganization(mock.organization);
    setTitle(mock.title);
    setPhone(mock.phone);
    setEmail(mock.email);
    setScanning(false);
    setScanned(true);
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
        <h1 className="text-lg font-bold">{scanned ? "内容を確認" : "名刺を撮影"}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {!scanned ? (
          <div className="flex h-full flex-col items-center justify-center gap-8">
            {scanning ? (
              <>
                <Loader2 size={36} className="animate-spin text-brand-green" />
                <p className="text-lg font-bold">読み取っています…</p>
              </>
            ) : (
              <>
                <div className="flex h-40 w-40 items-center justify-center rounded-card border border-text-secondary bg-neutral-gray">
                  <IdCard size={64} className="text-text-secondary" />
                </div>
                <button
                  onClick={startScan}
                  className="flex h-tap-target w-60 items-center justify-center gap-2 rounded-input bg-brand-green font-bold text-white"
                >
                  <IdCard size={20} />
                  撮影する
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
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
