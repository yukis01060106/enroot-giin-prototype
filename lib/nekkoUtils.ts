/**
 * 「ねっこの会 〜議員の和〜」関連ユーティリティ。lib/shared/utils/nekko_utils.dart の移植。
 * 固定運営（毎月第3木曜 19:30〜20:30）前提のモック情報のみ扱う。
 */

export const nekkoThemeExamples = [
  "議員になって一番驚いたこと",
  "地元の人に言われて嬉しかった一言",
  "議会中の眠気対策、みんなどうしてる？",
  "視察で食べた美味しいもの自慢",
  "住民さんから届いた変わった相談",
  "休みの日、何してる？",
] as const;

function thirdThursdayOf(year: number, month: number): Date {
  // monthは0始まり(JSのDate準拠)で渡す
  const date = new Date(year, month, 1);
  let thursdayCount = 0;
  while (true) {
    if (date.getDay() === 4 /* Thursday */) {
      thursdayCount++;
      if (thursdayCount === 3) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 19, 30);
      }
    }
    date.setDate(date.getDate() + 1);
  }
}

/** 次回開催日時（毎月第3木曜19:30）。今月分が既に過ぎていれば翌月分を返す。 */
export function nextNekkoMeetup(now: Date = new Date()): Date {
  const thisMonth = thirdThursdayOf(now.getFullYear(), now.getMonth());
  if (thisMonth.getTime() > now.getTime()) return thisMonth;
  return thirdThursdayOf(now.getFullYear(), now.getMonth() + 1);
}

/** 開催日時から、決め打ちのローテーションでテーマ例を1つ選ぶ。 */
export function themeFor(meetupAt: Date): string {
  const index = (meetupAt.getMonth() + 1) % nekkoThemeExamples.length;
  return nekkoThemeExamples[index];
}

/** 会員証に表示する会員番号。氏名から決め打ちで導出する（本物の会員DBは持たない）。 */
export function nekkoMemberNumber(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return String(100 + (hash % 900)).padStart(3, "0");
}

export function pastMeetups(nextMeetup: Date): { no: number; date: Date }[] {
  const list: { no: number; date: Date }[] = [];
  let cursor = new Date(nextMeetup.getFullYear(), nextMeetup.getMonth() - 1, 1);
  for (let i = 0; i < 3; i++) {
    list.push({ no: 5 - i, date: nextNekkoMeetup(cursor) });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
  }
  return list;
}
