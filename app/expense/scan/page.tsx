"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, Loader2, Receipt, Sparkles, FlaskConical } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { activeExpenseCategories } from "@/types/models";
import { extractReceiptText } from "@/lib/receiptOcrService";
import { classifyReceiptText } from "@/lib/receiptClassify";
import { showToast } from "@/lib/notReady";

const mockReceipts = [
  { category: "交通費", amount: 940, store: "西鉄バス" },
  { category: "会議費", amount: 3200, store: "カフェ・ド・大牟田" },
  { category: "事務費", amount: 1580, store: "オフィスコンビニ本町店" },
];

/**
 * レシート撮影→確認の2画面をひとつのページのローカルstepで表現する
 * （Flutter版は別ルートへのpushReplacementだが、値の受け渡しが単純な
 * ローカルstateで足りるためNext.js版では1ページにまとめた）。
 *
 * 文字の読み取りはGoogle Cloud Vision（OCR）をSupabase Edge Function経由で
 * 呼び、実際に写っている文字から費目・金額・店名を推測する
 * （lib/receiptClassify.tsのキーワード一致ベースの簡易分類）。
 * Supabase未設定・Vision API未設定・呼び出し失敗時は、tts/secretary-chatと
 * 同じ方針でモックの読み取り結果にフォールバックする（クラッシュしない）。
 * どちらが使われたかは確認画面に明示し、AI分類はあくまで下書きである旨を示す。
 */
export default function ReceiptScanPage() {
  const router = useRouter();
  const addExpense = useAppStore((s) => s.addExpense);
  const profile = useAppStore((s) => s.profile);
  const activeCategories = useMemo(() => activeExpenseCategories(profile), [profile]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [usedRealOcr, setUsedRealOcr] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [store, setStore] = useState("");
  const [note, setNote] = useState("");

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    setPhotoUrl(dataUrl);
    setScanning(true);

    let ok = false;
    try {
      const base64 = dataUrl.split(",")[1] ?? "";
      const text = await extractReceiptText(base64);
      const classified = classifyReceiptText(text, activeCategories);
      setCategory(classified.category);
      setAmount(classified.amount ? String(classified.amount) : "");
      setStore(classified.store ?? "");
      setUsedRealOcr(true);
      ok = true;
    } catch {
      // Supabase未設定 or Vision API未設定 or 通信失敗。デモ用のモック結果にフォールバック。
    }

    if (!ok) {
      await new Promise((r) => setTimeout(r, 1000));
      const mock = mockReceipts[Math.floor(Math.random() * mockReceipts.length)];
      // mockReceiptsの費目名は汎用6費目セット準拠。プリセットが違っても違和感のない
      // 費目になるよう、店名+費目名のテキストを同じ分類器に通して現在の費目一覧へ寄せる。
      const classified = classifyReceiptText(`${mock.store} ${mock.category}`, activeCategories);
      setCategory(classified.category);
      setAmount(String(mock.amount));
      setStore(mock.store);
      setUsedRealOcr(false);
    }
    setScanned(true);
    setScanning(false);
  }

  function save() {
    const amountNum = parseInt(amount, 10);
    if (!amountNum || amountNum <= 0) return;
    addExpense({
      category,
      amount: amountNum,
      store: store.trim() || undefined,
      note: note.trim() || undefined,
      photoUrl: photoUrl ?? undefined,
    });
    router.push("/expense");
    showToast("経費を保存しました");
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/expense")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">{scanned ? "内容を確認" : "レシートを撮影"}</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {!scanned ? (
          <div className="flex h-full flex-col items-center justify-center gap-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onFileSelected}
              className="hidden"
            />
            {scanning ? (
              <>
                <Loader2 size={36} className="animate-spin text-brand-green" />
                <p className="text-lg font-bold">読み取っています…</p>
              </>
            ) : (
              <>
                <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-card border border-text-secondary bg-neutral-gray">
                  <Receipt size={72} className="text-text-secondary" />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-tap-target w-60 items-center justify-center gap-2 rounded-input bg-brand-green font-bold text-white"
                >
                  <Camera size={20} />
                  撮影する
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="レシート" className="h-40 w-full rounded-card object-cover shadow-card" />
            )}
            {usedRealOcr ? (
              <div className="flex items-start gap-2 rounded-input bg-brand-green/10 p-3 text-sm text-brand-green">
                <Sparkles size={16} className="mt-0.5 shrink-0" />
                <span>AIがレシートの文字を読み取り、費目・金額を自動入力しました。これはAIの生成です。最終的な内容はご自身でご確認ください。</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-input bg-warning/10 p-3 text-sm text-warning">
                <FlaskConical size={16} className="mt-0.5 shrink-0" />
                <span>読み取り機能が未設定のため、サンプルデータを表示しています。内容を書き換えて保存してください。</span>
              </div>
            )}
            <div>
              <label className="mb-1 block font-semibold">費目</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3"
              >
                {activeCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-semibold">金額（円）</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold">店名（任意）</label>
              <input
                value={store}
                onChange={(e) => setStore(e.target.value)}
                className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3"
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold">メモ（任意）</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-tap-target w-full rounded-input border border-neutral-gray bg-white px-3"
              />
            </div>
            <button onClick={save} className="h-tap-target rounded-input bg-brand-green font-bold text-white">
              保存する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
