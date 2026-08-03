"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Image as ImageIcon, Share2, MessageCircle, Eye, ListChecks, Copy, ExternalLink, X, Check, Ban } from "lucide-react";
import { SuspenseBoundary } from "@/components/SuspenseBoundary";
import { useAppStore } from "@/store/appStore";
import { suggestHashtags } from "@/lib/postingAiService";
import { showToast } from "@/lib/notReady";

/**
 * 投稿前チェックリスト。旧「炎上リスクチェック」（AIによるキーワード一致の
 * 自動安全判定）を、人間が自分の目で確認する方式に置き換えたもの。
 * AIが「安全」と誤って太鼓判を押すことの責任問題を避ける狙い。
 */
const checklistItems = [
  { id: "no-personal-attack", label: "特定の個人・団体への誹謗中傷や決めつけた表現がないか確認した" },
  { id: "facts-confirmed", label: "書いている内容の事実関係を確認済みである" },
  { id: "no-personal-info", label: "住所・電話番号など、第三者の個人情報が含まれていないか確認した" },
  { id: "no-election-law-risk", label: "投票依頼など、公職選挙法に抵触しうる表現がないか確認した" },
] as const;

function PostEditInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");
  const draft = useAppStore((s) => (draftId ? s.postDrafts.find((d) => d.id === draftId) : undefined));
  const publishPost = useAppStore((s) => s.publishPost);
  const electionDay = useAppStore((s) => s.profile.electionDay);
  // 公職選挙法は投票日当日の選挙運動を禁止している。活動報告のつもりの投稿が
  // 選挙運動と見なされるリスクを避けるため、投票日当日は投稿自体をブロックする。
  // toISOString()はUTC基準になり日本時間の日付とずれ得るため、ローカル日付から
  // YYYY-MM-DDを組み立てる（他画面のtoDateInputValueと同じ方針）。
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isElectionDay = !!electionDay && electionDay === todayStr;

  // Facebook/LINE公式は読み手も文体も違うため、下書き生成時点から別々の文面を
  // 持てるようにしている（PostDraftModel.content / lineContent）。ここでも
  // 2つを独立したstateとして編集する。
  const [facebookText, setFacebookText] = useState(draft?.content ?? "");
  const [lineText, setLineText] = useState(draft?.lineContent ?? draft?.content ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toFacebook, setToFacebook] = useState(true);
  const [toLine, setToLine] = useState(!!draft?.lineContent);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  const combinedText = `${toFacebook ? facebookText : ""}\n${toLine ? lineText : ""}`;
  const suggestedHashtags = useMemo(() => suggestHashtags(combinedText), [combinedText]);
  const allChecked = checkedItems.size === checklistItems.length;
  const canSubmit =
    (toFacebook ? facebookText.trim() !== "" : true) &&
    (toLine ? lineText.trim() !== "" : true) &&
    (toFacebook || toLine) &&
    allChecked &&
    !isElectionDay;

  const tagSuffix = useMemo(() => {
    const tags = [...selectedTags].join(" ");
    return tags ? `\n\n${tags}` : "";
  }, [selectedTags]);
  const finalFacebookContent = `${facebookText.trim()}${tagSuffix}`;
  const finalLineContent = `${lineText.trim()}${tagSuffix}`;

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    setPhotoUrl(dataUrl);
    e.target.value = "";
  }

  // FacebookはGraph APIが個人プロフィールへの投稿を許可しておらず（ページのみ）、
  // LINE公式もアプリ内からの自動投稿には別途Messaging APIの契約・実装が要る。
  // このアプリはあくまで文章を作るところまでを担い、実際の投稿はコピー＆貼り付けで
  // 各プラットフォーム側に任せる（「投稿する」ボタンで実際に投稿されるかのような
  // 誤解を避けるため）。
  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label}向けの文章をコピーしました`);
    } catch {
      showToast("コピーできませんでした。文章を選択してコピーしてください");
    }
  }

  function markAsPosted() {
    if (!canSubmit) return;
    publishPost({ toFacebook, toLine, draftId: draftId ?? undefined });
    router.push("/posting");
    showToast("投稿済みとして記録しました");
  }

  return (
    <div className="relative flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/posting")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">投稿文を作成</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {isElectionDay && (
          <div className="mb-4 flex items-start gap-2.5 rounded-card border-2 border-error bg-error/8 p-3.5 text-error">
            <Ban size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">本日は投票日のため投稿できません</p>
              <p className="mt-1 text-sm leading-relaxed">
                公職選挙法は投票日当日の選挙運動を禁止しています。活動報告のつもりの投稿でも選挙運動と見なされるおそれがあるため、投稿は翌日以降に行ってください。
              </p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onPhotoSelected}
          className="hidden"
        />
        {photoUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="" className="h-40 w-full rounded-input object-cover" />
            <button
              onClick={() => setPhotoUrl(null)}
              aria-label="写真を削除"
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-tap-target w-full items-center justify-center gap-2 rounded-input border border-neutral-gray font-semibold"
          >
            <ImageIcon size={18} />
            写真を添付
          </button>
        )}

        <h2 className="mb-1 mt-4 font-bold">配信先・文面</h2>

        <div className="rounded-card border-2 border-neutral-gray bg-white p-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={toFacebook} onChange={(e) => setToFacebook(e.target.checked)} />
            <Share2 size={20} className="text-primary-blue" />
            <span className="font-bold">Facebook</span>
          </label>
          {toFacebook && (
            <textarea
              value={facebookText}
              onChange={(e) => {
                setFacebookText(e.target.value);
                setCheckedItems(new Set());
              }}
              rows={5}
              placeholder="Facebook向けの投稿文"
              autoFocus={!draft}
              className="mt-2 w-full rounded-input border border-neutral-gray bg-white p-3 outline-none focus:ring-2 focus:ring-brand-green"
            />
          )}
        </div>

        <div className="mt-3 rounded-card border-2 border-neutral-gray bg-white p-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={toLine} onChange={(e) => setToLine(e.target.checked)} />
            <MessageCircle size={20} className="text-brand-green" />
            <span className="font-bold">LINE公式</span>
          </label>
          {toLine && (
            <textarea
              value={lineText}
              onChange={(e) => {
                setLineText(e.target.value);
                setCheckedItems(new Set());
              }}
              rows={5}
              placeholder="LINE公式向けの投稿文"
              className="mt-2 w-full rounded-input border border-neutral-gray bg-white p-3 outline-none focus:ring-2 focus:ring-brand-green"
            />
          )}
        </div>

        <h2 className="mb-2 mt-4 font-bold">おすすめハッシュタグ</h2>
        <p className="mb-2 -mt-1 text-xs text-text-secondary">選ぶと両方の文面の末尾に追加されます</p>
        <div className="flex flex-wrap gap-2">
          {suggestedHashtags.map((tag) => {
            const selected = selectedTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() =>
                  setSelectedTags((prev) => {
                    const next = new Set(prev);
                    if (next.has(tag)) next.delete(tag);
                    else next.add(tag);
                    return next;
                  })
                }
                className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
                  selected ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-card border-[1.5px] border-neutral-gray bg-white p-3 shadow-card">
          <div className="flex items-center gap-2 font-bold">
            <ListChecks size={20} className="text-primary-blue" />
            投稿前チェックリスト
          </div>
          <p className="ml-8 mt-0.5 text-xs text-text-secondary">
            すべて確認すると、コピーや記録ができるようになります
          </p>
          <div className="mt-2 flex flex-col gap-2">
            {checklistItems.map((item) => {
              const checked = checkedItems.has(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() =>
                    setCheckedItems((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    })
                  }
                  className="flex items-start gap-2.5 text-left text-sm"
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-input border-2 ${
                      checked ? "border-brand-green bg-brand-green text-white" : "border-neutral-gray"
                    }`}
                  >
                    {checked && <Check size={13} />}
                  </span>
                  <span className={checked ? "text-text-secondary line-through" : ""}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setShowPreview(true)}
          disabled={!canSubmit}
          className="mt-4 flex h-tap-target w-full items-center justify-center gap-2 rounded-input border border-neutral-gray font-semibold disabled:opacity-40"
        >
          <Eye size={18} />
          投稿イメージを見る
        </button>

        <div className="mt-3 flex flex-col gap-2">
          {toFacebook && (
            <div className="flex gap-2">
              <button
                onClick={() => copyText(finalFacebookContent, "Facebook")}
                disabled={!canSubmit}
                className="flex h-tap-target flex-1 items-center justify-center gap-2 rounded-input border border-primary-blue font-semibold text-primary-blue disabled:opacity-40"
              >
                <Copy size={18} />
                Facebook文をコピー
              </button>
              <button
                onClick={() => window.open("https://www.facebook.com/", "_blank", "noopener,noreferrer")}
                aria-label="Facebookを開く"
                className="flex h-tap-target shrink-0 items-center justify-center rounded-input border border-neutral-gray px-3.5 text-text-secondary"
              >
                <ExternalLink size={18} />
              </button>
            </div>
          )}
          {toLine && (
            <div className="flex gap-2">
              <button
                onClick={() => copyText(finalLineContent, "LINE公式")}
                disabled={!canSubmit}
                className="flex h-tap-target flex-1 items-center justify-center gap-2 rounded-input border border-brand-green font-semibold text-brand-green disabled:opacity-40"
              >
                <Copy size={18} />
                LINE公式文をコピー
              </button>
              <button
                onClick={() => window.open("https://manager.line.biz/", "_blank", "noopener,noreferrer")}
                aria-label="LINE公式アカウント管理画面を開く"
                className="flex h-tap-target shrink-0 items-center justify-center rounded-input border border-neutral-gray px-3.5 text-text-secondary"
              >
                <ExternalLink size={18} />
              </button>
            </div>
          )}
        </div>
        <p className="mt-2 text-center text-xs leading-relaxed text-text-secondary">
          コピーした文章を、開いた画面に貼り付けて投稿してください
        </p>

        <button
          onClick={markAsPosted}
          disabled={!canSubmit}
          className="mt-3 flex h-tap-target w-full items-center justify-center rounded-input bg-brand-green font-bold text-white disabled:opacity-40"
        >
          投稿済みとして記録する
        </button>
      </div>

      {showPreview && (
        <PostPreviewOverlay
          facebookContent={finalFacebookContent}
          lineContent={finalLineContent}
          photoUrl={photoUrl}
          toFacebook={toFacebook}
          toLine={toLine}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

function PostPreviewOverlay({
  facebookContent,
  lineContent,
  photoUrl,
  toFacebook,
  toLine,
  onClose,
}: {
  facebookContent: string;
  lineContent: string;
  photoUrl: string | null;
  toFacebook: boolean;
  toLine: boolean;
  onClose: () => void;
}) {
  const authorName = useAppStore((s) => s.profile.displayName);
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-scaffold-bg">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={onClose} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">投稿イメージ</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {toFacebook && (
          <SocialCard
            icon={Share2}
            iconColor="bg-primary-blue"
            label="Facebook"
            content={facebookContent}
            authorName={authorName}
            photoUrl={photoUrl}
          />
        )}
        {toLine && (
          <div className="mt-6">
            <SocialCard
              icon={MessageCircle}
              iconColor="bg-brand-green"
              label="LINE公式"
              content={lineContent}
              authorName={authorName}
              photoUrl={photoUrl}
            />
          </div>
        )}
        <p className="mt-4 text-xs text-text-secondary">
          イメージはプレビューです。実際の表示は各プラットフォームの仕様により異なる場合があります。
        </p>
      </div>
    </div>
  );
}

function SocialCard({
  icon: Icon,
  iconColor,
  label,
  content,
  authorName,
  photoUrl,
}: {
  icon: typeof Share2;
  iconColor: string;
  label: string;
  content: string;
  authorName: string;
  photoUrl: string | null;
}) {
  return (
    <div>
      <p className="mb-2 font-bold">{label}</p>
      <div className="rounded-card border-2 border-neutral-gray bg-white">
        <div className="flex items-center gap-2 p-3">
          <span className={`flex h-9 w-9 items-center justify-center rounded-full text-white ${iconColor}`}>
            <Icon size={18} />
          </span>
          <div>
            <p className="font-bold">{authorName}</p>
            <p className="text-xs text-text-secondary">今</p>
          </div>
        </div>
        <p className="whitespace-pre-wrap px-3">{content || "（本文なし）"}</p>
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="m-3 h-36 w-[calc(100%-1.5rem)] rounded object-cover" />
        ) : (
          <div className="m-3 flex h-36 items-center justify-center rounded bg-neutral-gray">
            <ImageIcon size={40} className="text-text-secondary" />
          </div>
        )}
        <hr className="border-neutral-gray" />
        <div className="flex justify-around p-2 text-text-secondary">
          <span>いいね</span>
          <span>コメント</span>
          <span>シェア</span>
        </div>
      </div>
    </div>
  );
}

export default function PostEditPage() {
  return (
    <SuspenseBoundary>
      <PostEditInner />
    </SuspenseBoundary>
  );
}
