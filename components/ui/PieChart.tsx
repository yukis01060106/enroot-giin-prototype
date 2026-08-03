import { formatYen } from "@/lib/currencyFormat";

/** 外部チャートライブラリに頼らない軽量な円グラフ。simple_pie_chart.dart の移植（SVG版）。 */
export const pieChartPalette = ["#2E7D32", "#1565C0", "#66BB6A", "#F57C00", "#7E57C2", "#546E7A"];

/**
 * keyOrder未指定時はdataの出現順（従来通り）。keyOrderを渡すと、その月に
 * 存在するカテゴリの組み合わせが変わっても同じカテゴリは常に同じ色になる
 * （固定リストの位置で色を決めるため、グラフ・凡例・一覧の表示で色がずれない）。
 */
export function colorForKey(key: string, keyOrder: string[]): string {
  const idx = keyOrder.indexOf(key);
  return pieChartPalette[(idx === -1 ? 0 : idx) % pieChartPalette.length];
}

export function PieChart({
  data,
  size = 120,
  keyOrder,
}: {
  data: Record<string, number>;
  size?: number;
  keyOrder?: string[];
}) {
  const entries = Object.entries(data);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  const order = keyOrder ?? entries.map(([k]) => k);

  if (total === 0) {
    return (
      <div style={{ width: size, height: size }} className="flex items-center justify-center text-sm text-text-secondary">
        データなし
      </div>
    );
  }

  const radius = size / 2;
  let cumulative = 0;
  const slices = entries.map(([key, value]) => {
    const startAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    cumulative += value;
    const endAngle = (cumulative / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = radius + radius * Math.cos(startAngle);
    const y1 = radius + radius * Math.sin(startAngle);
    const x2 = radius + radius * Math.cos(endAngle);
    const y2 = radius + radius * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const path =
      value === total
        ? `M ${radius} 0 A ${radius} ${radius} 0 1 1 ${radius - 0.01} 0 Z`
        : `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return <path key={key} d={path} fill={colorForKey(key, order)} />;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices}
    </svg>
  );
}

export function PieChartLegend({ data, keyOrder }: { data: Record<string, number>; keyOrder?: string[] }) {
  const entries = Object.entries(data);
  const order = keyOrder ?? entries.map(([k]) => k);
  return (
    <div className="flex flex-col gap-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-1.5 text-sm">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: colorForKey(key, order) }}
          />
          <span className="truncate">
            {key} {formatYen(value)}
          </span>
        </div>
      ))}
    </div>
  );
}
