/** intl(date_format)相当の小さな日本語日付フォーマッタ群。外部依存を増やさないための自前実装。 */

const weekdayJa = ["日", "月", "火", "水", "木", "金", "土"];

export function formatHM(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatMD(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatMDWeekdayTime(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日(${weekdayJa[d.getDay()]}) ${formatHM(d)}`;
}

export function formatMDWeekday(d: Date): string {
  return `${d.getMonth() + 1}月${d.getDate()}日(${weekdayJa[d.getDay()]})`;
}

export function formatYMD(d: Date): string {
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
