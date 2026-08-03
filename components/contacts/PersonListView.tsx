"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Briefcase, Mic, Users, Search, X, UserPlus } from "lucide-react";
import { useAppStore, useReminderPersons, daysSinceLastContact } from "@/store/appStore";
import { PersonTile } from "@/components/contacts/PersonTile";
import { PersonFormDialog } from "@/components/contacts/PersonFormDialog";
import { EmptyState } from "@/components/ui/EmptyState";

/** 名刺管理タブ「名刺一覧」サブタブ。goen_view.dart の _buildPersonList 相当。 */
export function PersonListView() {
  const router = useRouter();
  const persons = useAppStore((s) => s.persons);
  const reminderPersons = useReminderPersons();
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of persons) for (const t of p.tags) set.add(t);
    return [...set].sort();
  }, [persons]);

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = persons.filter((p) => {
      if (activeTag && !p.tags.includes(activeTag)) return false;
      if (q && !p.name.toLowerCase().includes(q) && !(p.organization ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }, [persons, activeTag, query]);

  return (
    <div className="p-4">
      <div className="flex gap-2">
        <button
          className="h-tap-target flex flex-1 items-center justify-center gap-2 rounded-input border border-primary-blue font-semibold text-primary-blue"
          onClick={() => router.push("/contacts/scan")}
        >
          <Briefcase size={18} />
          名刺を撮影
        </button>
        <button
          className="h-tap-target flex flex-1 items-center justify-center gap-2 rounded-input border border-primary-blue font-semibold text-primary-blue"
          onClick={() => router.push("/contacts/voice")}
        >
          <Mic size={18} />
          声で追加
        </button>
      </div>
      <button
        onClick={() => setAddDialogOpen(true)}
        className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 text-sm font-semibold text-text-secondary"
      >
        <UserPlus size={15} />
        または手動で追加
      </button>

      {reminderPersons.length > 0 && (
        <>
          <h2 className="mb-2 mt-3 text-lg font-bold">そろそろ連絡</h2>
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

      <div className="relative mt-5">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="名前・所属で検索"
          className="h-tap-target w-full rounded-input bg-neutral-gray py-2 pl-10 pr-9 outline-none focus:ring-2 focus:ring-brand-green"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="検索をクリア"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-secondary"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
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

      <PersonFormDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} editingPerson={null} />
    </div>
  );
}
