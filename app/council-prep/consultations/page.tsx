"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, User, Clock, HeadphonesIcon } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMD } from "@/lib/formatDate";
import type { ConsultationStatus } from "@/types/models";

const statusLabels: Record<ConsultationStatus, string> = {
  none: "未対応",
  in_progress: "対応中",
  waiting: "保留",
  done: "完了",
};
const statusColors: Record<ConsultationStatus, string> = {
  none: "border-l-error",
  in_progress: "border-l-brand-green",
  waiting: "border-l-warning",
  done: "border-l-text-secondary",
};

export default function ConsultationsPage() {
  const router = useRouter();
  const records = useAppStore((s) => s.records);
  const persons = useAppStore((s) => s.persons);
  const updateConsultationStatus = useAppStore((s) => s.updateConsultationStatus);
  const [activeFilter, setActiveFilter] = useState<ConsultationStatus | null>(null);

  const consultations = useMemo(
    () =>
      records
        .filter((r) => r.categories.includes("consultation"))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [records]
  );
  const filtered = activeFilter ? consultations.filter((r) => r.consultationStatus === activeFilter) : consultations;
  const personById = useMemo(() => new Map(persons.map((p) => [p.id, p])), [persons]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/council-prep")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">住民相談を管理</h1>
      </header>

      {consultations.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={HeadphonesIcon}
            message="住民相談メモはまだありません"
            actionHint="ホームの「メモ」から記録すると、ここに表示されます"
          />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 p-4">
            <button
              onClick={() => setActiveFilter(null)}
              className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
                activeFilter === null ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
              }`}
            >
              すべて（{consultations.length}）
            </button>
            {(Object.keys(statusLabels) as ConsultationStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`rounded-chip px-3 py-1.5 text-sm font-semibold ${
                  activeFilter === status ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
                }`}
              >
                {statusLabels[status]}（{consultations.filter((r) => r.consultationStatus === status).length}）
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {filtered.length === 0 ? (
              <p className="pt-8 text-center text-text-secondary">該当する相談はありません</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((r) => {
                  const person = r.relatedPersonId ? personById.get(r.relatedPersonId) : undefined;
                  return (
                    <div
                      key={r.id}
                      className={`rounded-card border-l-4 bg-white p-4 shadow-card ${statusColors[r.consultationStatus]}`}
                    >
                      <p>{r.content}</p>
                      <div className="mt-2 flex items-center gap-1 text-sm text-text-secondary">
                        {person && (
                          <>
                            <User size={14} />
                            <span className="mr-3">{person.name}</span>
                          </>
                        )}
                        <Clock size={14} />
                        <span>{formatMD(new Date(r.createdAt))}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(Object.keys(statusLabels) as ConsultationStatus[]).map((status) => (
                          <button
                            key={status}
                            onClick={() => updateConsultationStatus(r.id, status)}
                            className={`rounded-chip px-2.5 py-1 text-xs font-semibold ${
                              r.consultationStatus === status
                                ? "bg-brand-green text-white"
                                : "bg-neutral-gray text-text-secondary"
                            }`}
                          >
                            {statusLabels[status]}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
