"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowLeft, Search as SearchIcon, SearchX, User, FileText, CalendarClock, SquareCheck } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { EmptyState } from "@/components/ui/EmptyState";
import { recordCategoryLabels } from "@/types/models";

function ResultTile({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: typeof User;
  title: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className="mb-2 flex w-full items-center gap-3 rounded-card bg-white p-3 text-left shadow-card"
    >
      <Icon size={20} className="shrink-0 text-text-secondary" />
      <div className="min-w-0">
        <p className="line-clamp-2">{title}</p>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
      </div>
    </Comp>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const persons = useAppStore((s) => s.persons);
  const records = useAppStore((s) => s.records);
  const schedules = useAppStore((s) => s.schedules);
  const todos = useAppStore((s) => s.todos);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query) return null;
    const q = query.toLowerCase();
    const match = (text: string) => text.toLowerCase().includes(q);
    return {
      persons: persons.filter((p) => match(p.name) || match(p.organization ?? "")),
      records: records.filter((r) => match(r.content)),
      schedules: schedules.filter((s) => match(s.title)),
      todos: todos.filter((t) => match(t.title)),
    };
  }, [query, persons, records, schedules, todos]);

  const hasAnyResult =
    results && (results.persons.length || results.records.length || results.schedules.length || results.todos.length);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-gradient-primary px-2 text-white">
        <button onClick={() => router.push("/")} aria-label="戻る" className="rounded-full p-2">
          <ArrowLeft size={20} />
        </button>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="記録・人・予定を検索"
          className="h-10 flex-1 rounded-input bg-white/20 px-3 text-white placeholder-white/70 outline-none"
        />
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {!query ? (
          <EmptyState icon={SearchIcon} message="キーワードを入力すると、記録・人・予定・やることを横断して検索します" />
        ) : !hasAnyResult ? (
          <EmptyState icon={SearchX} message="該当する結果が見つかりません" />
        ) : (
          <>
            {results!.persons.length > 0 && (
              <>
                <h2 className="py-2 text-lg font-bold">人（{results!.persons.length}件）</h2>
                {results!.persons.map((p) => (
                  <ResultTile
                    key={p.id}
                    icon={User}
                    title={p.name}
                    subtitle={p.organization}
                    onClick={() => router.push(`/contacts?id=${p.id}`)}
                  />
                ))}
              </>
            )}
            {results!.records.length > 0 && (
              <>
                <h2 className="py-2 text-lg font-bold">記録（{results!.records.length}件）</h2>
                {results!.records.map((r) => (
                  <ResultTile
                    key={r.id}
                    icon={FileText}
                    title={r.content}
                    subtitle={r.categories.map((c) => recordCategoryLabels[c]).join(" / ")}
                  />
                ))}
              </>
            )}
            {results!.schedules.length > 0 && (
              <>
                <h2 className="py-2 text-lg font-bold">予定（{results!.schedules.length}件）</h2>
                {results!.schedules.map((s) => (
                  <ResultTile
                    key={s.id}
                    icon={CalendarClock}
                    title={s.title}
                    subtitle={s.location}
                    onClick={() => router.push("/calendar")}
                  />
                ))}
              </>
            )}
            {results!.todos.length > 0 && (
              <>
                <h2 className="py-2 text-lg font-bold">やること（{results!.todos.length}件）</h2>
                {results!.todos.map((t) => (
                  <ResultTile key={t.id} icon={SquareCheck} title={t.title} onClick={() => router.push("/todo")} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
