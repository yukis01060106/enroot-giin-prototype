"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const weekdayJa = ["日", "月", "火", "水", "木", "金", "土"];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildWeeks(focusedMonth: Date): Date[][] {
  const year = focusedMonth.getFullYear();
  const month = focusedMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstOfMonth.getDay());
  const weeks: Date[][] = [];
  let cursor = start;
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(cursor);
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** table_calendarの代替として自前実装した月表示カレンダー。calendar_view.dart相当。 */
export function MonthCalendar({
  focusedMonth,
  selectedDay,
  hasEvents,
  onSelectDay,
  onChangeMonth,
}: {
  focusedMonth: Date;
  selectedDay: Date;
  hasEvents: (day: Date) => boolean;
  onSelectDay: (day: Date) => void;
  onChangeMonth: (month: Date) => void;
}) {
  const weeks = buildWeeks(focusedMonth);
  const today = new Date();

  return (
    <div className="rounded-card bg-white py-2 shadow-card">
      <div className="flex items-center justify-between px-3 py-2">
        <button
          aria-label="前の月"
          onClick={() => onChangeMonth(new Date(focusedMonth.getFullYear(), focusedMonth.getMonth() - 1, 1))}
          className="p-2 text-text-secondary"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold">
          {focusedMonth.getFullYear()}年{focusedMonth.getMonth() + 1}月
        </span>
        <button
          aria-label="次の月"
          onClick={() => onChangeMonth(new Date(focusedMonth.getFullYear(), focusedMonth.getMonth() + 1, 1))}
          className="p-2 text-text-secondary"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 px-1 text-center text-xs">
        {weekdayJa.map((w, i) => (
          <div
            key={w}
            className={`py-1 ${i === 0 ? "text-error" : i === 6 ? "text-primary-blue" : "text-text-secondary"}`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 px-1">
        {weeks.flat().map((day, i) => {
          const inMonth = day.getMonth() === focusedMonth.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDay);
          const weekday = day.getDay();
          // 土日は数字を色分け（日本のカレンダーUIの慣習）。選択中/今日はそちらの
          // 色を優先し、月外の日はどのみち薄グレーのままにする。
          const weekendColor =
            inMonth && !isSelected && !isToday ? (weekday === 0 ? "text-error" : weekday === 6 ? "text-primary-blue" : "") : "";
          return (
            <button
              key={i}
              onClick={() => onSelectDay(day)}
              className="flex flex-col items-center gap-0.5 py-1"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                  isSelected
                    ? "bg-brand-green font-bold text-white"
                    : isToday
                      ? "bg-light-green text-white"
                      : inMonth
                        ? weekendColor || "text-text-primary"
                        : "text-text-secondary/40"
                }`}
              >
                {day.getDate()}
              </span>
              <span className={`h-1 w-1 rounded-full ${hasEvents(day) ? "bg-accent-crimson" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
