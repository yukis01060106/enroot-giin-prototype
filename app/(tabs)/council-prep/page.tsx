"use client";

import Link from "next/link";
import { ChevronRight, PenLine, FileText, ClipboardList, Headset, FolderArchive } from "lucide-react";
import { showNotReady } from "@/lib/notReady";

const upcomingCategories = [
  "委員会関連（議案審査・委員長報告 等）",
  "議員提出文書（意見書・決議案・条例案 等）",
  "視察・研修関連（研修報告 等）",
  "政治資金収支報告書",
  "議会だより・活動チラシ",
];

function LiveCard({
  icon: Icon,
  title,
  subtitle,
  href,
  gradient = "bg-gradient-primary",
}: {
  icon: typeof PenLine;
  title: string;
  subtitle: string;
  href: string;
  gradient?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-card ${gradient} p-4 text-white shadow-raised`}
    >
      <Icon size={32} />
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-xs text-white/70">{subtitle}</p>
      </div>
      <ChevronRight size={20} />
    </Link>
  );
}

function DisabledRow({ label, feature }: { label: string; feature: string }) {
  return (
    <button
      onClick={() => showNotReady(feature)}
      className="flex w-full items-center justify-between rounded-card bg-white px-4 py-3.5 text-text-secondary shadow-card"
    >
      {label}
      <ChevronRight size={20} />
    </button>
  );
}

export default function CouncilPrepPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center bg-gradient-primary px-4 text-white">
        <h1 className="text-lg font-bold">議会準備</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="mb-2 text-lg font-bold">つくる</h2>
        <div className="flex flex-col gap-2">
          <LiveCard
            icon={PenLine}
            title="一般質問を作る"
            subtitle="美咲と一緒に、テーマ設定から通告書まで6ステップで作成"
            href="/council-prep/general-question"
          />
          <DisabledRow label="質問通告書の作成" feature="質問通告書の作成" />
        </div>

        <h2 className="mb-2 mt-6 text-lg font-bold">報告する</h2>
        <div className="flex flex-col gap-2">
          <LiveCard
            icon={FileText}
            title="視察報告書を作る"
            subtitle="視察先・目的とメモから、報告書の草案を3ステップで作成"
            href="/council-prep/inspection-report"
            gradient="bg-gradient-teal"
          />
          <LiveCard
            icon={ClipboardList}
            title="政務活動費収支報告書を作る"
            subtitle="記録済みの経費データから収支報告書を自動集計"
            href="/council-prep/expense-report"
            gradient="bg-gradient-teal"
          />
        </div>

        <h2 className="mb-2 mt-6 text-lg font-bold">管理する</h2>
        <div className="flex flex-col gap-2">
          <LiveCard
            icon={Headset}
            title="住民相談を管理"
            subtitle="相談メモの対応状況（未対応・対応中・完了）を一覧管理"
            href="/council-prep/consultations"
            gradient="bg-gradient-indigo"
          />
          <LiveCard
            icon={FolderArchive}
            title="テンプレート管理"
            subtitle="通告書・報告書等の書式を議会ごとに保存"
            href="/council-prep/templates"
            gradient="bg-gradient-indigo"
          />
        </div>

        <div className="mt-8 flex justify-center">
          <span className="rounded-chip bg-warning/15 px-3 py-1.5 font-bold text-warning">
            その他の機能は近日公開
          </span>
        </div>

        <h2 className="mb-2 mt-4 text-lg font-bold">予定している機能</h2>
        <ul className="flex flex-col gap-1.5">
          {upcomingCategories.map((c) => (
            <li key={c} className="flex items-start gap-2 text-text-secondary">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-text-secondary" />
              {c}
            </li>
          ))}
        </ul>
        <div className="h-4" />
      </div>
    </div>
  );
}
