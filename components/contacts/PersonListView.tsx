"use client";

import { useMemo, useState } from "react";
import { Briefcase, Mic, Users } from "lucide-react";
import { useAppStore, useReminderPersons, daysSinceLastContact } from "@/store/appStore";
import { PersonTile } from "@/components/contacts/PersonTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { showNotReady } from "@/lib/notReady";

/** 名刺管理タブ「名刺一覧」サブタブ。goen_view.dart の _buildPersonList 相当。 */
export function PersonListView() {
  const persons = useAppStore((s) => s.persons);
  const reminderPersons = useReminderPersons();
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of persons) for (const t of p.tags) set.add(t);
    return [...set].sort();
  }, [persons]);

  const sorted = useMemo(() => {
    const filtered = activeTag ? persons.filter((p) => p.tags.includes(activeTag)) : persons;
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }, [persons, activeTag]);

  return (
    <div className="p-4">
      <div className="flex gap-2">
        <button
          className="h-tap-target flex flex-1 items-center justify-center gap-2 rounded-input border border-primary-blue font-semibold text-primary-blue"
          onClick={() => showNotReady("名刺を撮影")}
        >
          <Briefcase size={18} />
          名刺を撮影
        </button>
        <button
          className="h-tap-target flex flex-1 items-center justify-center gap-2 rounded-input border border-primary-blue font-semibold text-primary-blue"
          onClick={() => showNotReady("声で追加")}
        >
          <Mic size={18} />
          声で追加
        </button>
      </div>

      {reminderPersons.length > 0 && (
        <>
          <h2 className="mb-2 mt-5 text-lg font-bold">そろそろ連絡</h2>
          {reminderPersons.map((p) => (
            <PersonTile
              key={p.id}
              person={p}
              subtitle={`最終接触から${daysSinceLastContact(p)}日`}
              accentColor="text-warning"
              accentBg="bg-warning/15"
            />
          ))}
        </>
      )}

      {allTags.length > 0 && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTag(null)}
            className={`shrink-0 rounded-chip px-3 py-1.5 text-sm font-semibold ${
              activeTag === null ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
            }`}
          >
            すべて
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`shrink-0 rounded-chip px-3 py-1.5 text-sm font-semibold ${
                activeTag === tag ? "bg-brand-green text-white" : "bg-white text-text-secondary shadow-card"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <h2 className="mb-2 mt-5 text-lg font-bold">全件一覧（{sorted.length}件）</h2>
      {sorted.length === 0 ? (
        <EmptyState icon={Users} message="該当する人物がいません" />
      ) : (
        sorted.map((p) => <PersonTile key={p.id} person={p} />)
      )}
    </div>
  );
}
