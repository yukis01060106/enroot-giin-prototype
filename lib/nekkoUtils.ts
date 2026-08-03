/**
 * 「ねっこの会 〜議員の和〜」関連ユーティリティ。lib/shared/utils/nekko_utils.dart の移植。
 * 固定運営（毎月第3木曜 19:30〜20:30）前提のモック情報のみ扱う。
 */

export const nekkoThemeExamples = [
  "議員になって一番驚いたこと",
  "地元の人に言われて嬉しかった一言",
  "一般質問のネタ、どう見つけてる？",
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
  return `NK-${String(hash % 1_000_000).padStart(6, "0")}`;
}

// 第1回の開催月（固定の起点）。以前は過去の回を「5, 4, 3」と決め打ちしていたため、
// アプリを開く月が変わっても表示が5/4/3のまま動かず、実際の開催回数とずれていく
// バグがあった（参加者に確認されやすい数字なので実績と揃える）。この起点からの
// 月数で回数を算出することで、時間が経っても正しく回数が増えていくようにする。
const NEKKO_FIRST_MEETUP_YEAR = 2026;
const NEKKO_FIRST_MEETUP_MONTH = 2; // 0始まり: 2026年3月を第1回とする

function meetingNumberFor(meetupDate: Date): number {
  const monthsSinceFirst =
    (meetupDate.getFullYear() - NEKKO_FIRST_MEETUP_YEAR) * 12 + (meetupDate.getMonth() - NEKKO_FIRST_MEETUP_MONTH);
  return monthsSinceFirst + 1;
}

export function pastMeetups(nextMeetup: Date): { no: number; date: Date }[] {
  const list: { no: number; date: Date }[] = [];
  let cursor = new Date(nextMeetup.getFullYear(), nextMeetup.getMonth() - 1, 1);
  for (let i = 0; i < 3; i++) {
    const date = nextNekkoMeetup(cursor);
    list.push({ no: meetingNumberFor(date), date });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
  }
  return list;
}
