"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useAppStore, planTierLabels } from "@/store/appStore";
import { planCatalog } from "@/lib/planCatalog";
import { formatYen } from "@/lib/currencyFormat";

type BillTo = "individual" | "council";

const TAX_RATE = 0.1;

/**
 * インボイス制度（適格請求書等保存方式）に対応した請求書のプレビュー・印刷。
 * 登録番号・事業者情報はプロトタイプの雛形（プレースホルダー）。実運用では
 * 実在の適格請求書発行事業者登録番号・事業者情報に差し替える必要がある。
 */
export default function InvoicePage() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const planTier = useAppStore((s) => s.planTier);
  const [billTo, setBillTo] = useState<BillTo>("individual");

  const now = new Date();
  const period = { year: now.getFullYear(), month: now.getMonth() };

  const plan = planCatalog.find((p) => p.tier === planTier) ?? planCatalog[0];
  const taxExcluded = plan.priceValue;
  const tax = Math.floor(taxExcluded * TAX_RATE);
  const taxIncluded = taxExcluded + tax;
  const invoiceNo = `INV-${period.year}${String(period.month + 1).padStart(2, "0")}-${planTier.toUpperCase()}`;
  const billToName = billTo === "individual" ? profile.displayName : profile.councilName;

  return (
    <div className="flex h-full flex-col">
      <header className="no-print flex h-14 shrink-0 items-center justify-between gap-2 bg-gradient-primary px-2 text-white">
        <div className="flex min-w-0 items-center gap-2">
          <button onClick={() => router.push("/settings/plan")} aria-label="戻る" className="shrink-0 rounded-full p-2">
            <ArrowLeft size={20} />
          </button>
          <h1 className="truncate text-lg font-bold">請求書</h1>
        </div>
        <button
          onClick={() => window.print()}
          className="flex shrink-0 items-center gap-1.5 rounded-input bg-white/15 px-3 py-1.5 text-sm font-semibold"
        >
          <Printer size={16} />
          PDF
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="no-print p-4 pb-0">
          <div className="mb-4 rounded-card border border-warning/40 bg-warning/10 p-3 text-sm leading-relaxed text-text-primary">
            これはプロトタイプ用の雛形です。登録番号・発行事業者情報はダミーです。実運用では実在の適格請求書発行事業者登録番号に差し替えてください。
          </div>
          <p className="mb-2 font-bold">宛名</p>
          <div className="flex gap-2">
            <button
              onClick={() => setBillTo("individual")}
              className={`flex-1 rounded-input border px-3 py-2.5 text-sm font-semibold ${
                billTo === "individual" ? "border-brand-green bg-brand-green/10 text-brand-green" : "border-neutral-gray text-text-secondary"
              }`}
            >
              議員個人名（{profile.displayName}）
            </button>
            <button
              onClick={() => setBillTo("council")}
              className={`flex-1 rounded-input border px-3 py-2.5 text-sm font-semibold ${
                billTo === "council" ? "border-brand-green bg-brand-green/10 text-brand-green" : "border-neutral-gray text-text-secondary"
              }`}
            >
              議会名（{profile.councilName}）
            </button>
          </div>
        </div>

        <div className="report-print-area p-6 print:p-0">
          <div className="flex items-start justify-between">
            <h1 className="text-xl font-bold">御請求書</h1>
            <div className="text-right text-sm text-text-secondary">
              <p>請求書番号：{invoiceNo}</p>
              <p>発行日：{now.getFullYear()}年{now.getMonth() + 1}月{now.getDate()}日</p>
            </div>
          </div>

          <p className="mt-6 text-lg font-bold">{billToName} 様</p>

          <p className="mt-6">
            下記の通りご請求申し上げます。
          </p>

          <table className="mt-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-text-primary text-left">
                <th className="py-2">品目</th>
                <th className="py-2 text-right">税率</th>
                <th className="py-2 text-right">金額（税抜）</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-gray">
                <td className="py-2">
                  En Root ─ 議員エディション {planTierLabels[planTier]}プラン利用料
                  <br />
                  <span className="text-xs text-text-secondary">
                    {period.year}年{period.month + 1}月分
                  </span>
                </td>
                <td className="py-2 text-right">10%</td>
                <td className="py-2 text-right">{formatYen(taxExcluded)}</td>
              </tr>
            </tbody>
          </table>

          <div className="ml-auto mt-4 flex w-56 flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span>小計（税抜）</span>
              <span>{formatYen(taxExcluded)}</span>
            </div>
            <div className="flex justify-between">
              <span>消費税（10%）</span>
              <span>{formatYen(tax)}</span>
            </div>
            <div className="flex justify-between border-t border-text-primary pt-1 font-bold">
              <span>合計（税込）</span>
              <span>{formatYen(taxIncluded)}</span>
            </div>
          </div>

          <div className="mt-8 border-t border-neutral-gray pt-4 text-xs leading-relaxed text-text-secondary">
            <p>登録番号：T0000000000000（適格請求書発行事業者登録番号・プレースホルダー）</p>
            <p className="mt-1">発行事業者：（事業者名を記載）</p>
            <p>所在地：（事業者所在地を記載）</p>
          </div>

          <p className="mt-6 text-right text-xs text-text-secondary">
            En Root ─ 議員エディション
          </p>
        </div>
      </div>
    </div>
  );
}
