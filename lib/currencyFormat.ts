/** currency_format.dart の移植。¥12,345 形式にフォーマットする。 */
export function formatYen(amount: number): string {
  return `¥${new Intl.NumberFormat("ja-JP").format(amount)}`;
}
