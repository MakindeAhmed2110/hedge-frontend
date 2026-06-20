import { useId, useMemo } from "react";

import type { LiveChartPoint } from "~/hooks/use-live-market-chart";

type MarketLiveChartProps = {
  data: LiveChartPoint[];
  priceToBeat: number;
  height?: number;
  lineColor?: string;
};

type Pt = { x: number; y: number };

/** Catmull-Rom -> cubic bezier for a smooth line through the points. */
function buildSmoothLine(points: Pt[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0]!.x.toFixed(2)} ${points[0]!.y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return d;
}

function formatAxisTime(timestampMs: number): string {
  return new Date(timestampMs).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function MarketLiveChart({
  data,
  priceToBeat,
  height = 260,
  lineColor = "#F7931A",
}: MarketLiveChartProps) {
  const gradientId = useId();
  const paddingTop = 22;
  const paddingBottom = 30;
  const paddingX = 14;
  const drawable = height - paddingTop - paddingBottom;
  const width = 1000;

  const chart = useMemo(() => {
    const values = data.map((point) => point.value).filter((value) => Number.isFinite(value));
    if (values.length < 2) return null;

    const min = Math.min(...values, priceToBeat);
    const max = Math.max(...values, priceToBeat);
    const span = max - min || 1;
    // pad the range so the line never touches the edges
    const padded = span * 0.18;
    const lo = min - padded;
    const hi = max + padded;
    const range = hi - lo || 1;
    const step = (width - paddingX * 2) / (values.length - 1);

    const toY = (value: number) => paddingTop + drawable - ((value - lo) / range) * drawable;

    const points: Pt[] = values.map((value, index) => ({
      x: paddingX + index * step,
      y: toY(value),
    }));

    const baseline = paddingTop + drawable;
    const line = buildSmoothLine(points);
    const last = points[points.length - 1]!;

    return {
      linePath: line,
      areaPath: `${line} L ${last.x.toFixed(2)} ${baseline.toFixed(2)} L ${points[0]!.x.toFixed(2)} ${baseline.toFixed(2)} Z`,
      beatY: toY(priceToBeat),
      lastPoint: last,
      yTicks: [hi - range * 0.12, priceToBeat, lo + range * 0.12],
      xLabels: [
        formatAxisTime(data[0]!.timestamp),
        formatAxisTime(data[Math.floor((data.length - 1) / 2)]!.timestamp),
        formatAxisTime(data[data.length - 1]!.timestamp),
      ],
      latest: values[values.length - 1]!,
    };
  }, [data, drawable, paddingTop, priceToBeat, width]);

  if (!chart) {
    return <div className="market-live-chart market-live-chart--empty" style={{ height }} />;
  }

  const tipLeft = (chart.lastPoint.x / width) * 100;
  const tipTop = (chart.lastPoint.y / height) * 100;
  const beatTop = (chart.beatY / height) * 100;

  return (
    <div className="market-live-chart" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="market-live-chart__svg"
        role="img"
        aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.26" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={paddingX}
          y1={chart.beatY}
          x2={width - paddingX}
          y2={chart.beatY}
          className="market-live-chart__beat"
        />

        <path d={chart.areaPath} fill={`url(#${gradientId})`} className="market-live-chart__area" />
        <path
          d={chart.linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="market-live-chart__line"
        />
      </svg>

      <div className="market-live-chart__axis market-live-chart__axis--y" aria-hidden>
        {chart.yTicks.map((tick, i) => (
          <span key={i}>${tick.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        ))}
      </div>

      <div className="market-live-chart__axis market-live-chart__axis--x" aria-hidden>
        {chart.xLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      <div
        className="market-live-chart__target"
        style={{ top: `${beatTop}%` }}
        aria-hidden>
        Target
      </div>

      <span
        className="market-live-chart__tip"
        style={{ left: `${tipLeft}%`, top: `${tipTop}%` }}
        aria-hidden
      />
      <div
        className="market-live-chart__tip-label"
        style={{ top: `${tipTop}%` }}
        aria-hidden>
        ${chart.latest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}
