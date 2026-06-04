import { useId, useMemo } from "react";

import { HedgeColors } from "~/constants/brand";
import type { BalanceChartPoint } from "~/lib/portfolio/balance-history";

type PortfolioChartProps = {
  data: BalanceChartPoint[];
  height?: number;
  lineColor?: string;
  compact?: boolean;
};

function buildPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
}

function buildAreaPath(points: { x: number; y: number }[], baseline: number): string {
  if (points.length === 0) return "";
  const line = buildPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x.toFixed(2)} ${baseline.toFixed(2)} L ${first.x.toFixed(2)} ${baseline.toFixed(2)} Z`;
}

export function PortfolioChart({
  data,
  height = 168,
  lineColor = HedgeColors.primary,
  compact = false,
}: PortfolioChartProps) {
  const gradientId = useId();
  const chartHeight = compact ? 56 : height;
  const paddingTop = 12;
  const paddingBottom = compact ? 8 : 20;
  const drawable = chartHeight - paddingTop - paddingBottom;

  const { linePath, areaPath } = useMemo(() => {
    const values = data.map((d) => d.value).filter((v) => Number.isFinite(v));
    if (values.length < 2) return { linePath: "", areaPath: "" };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const width = 1000;
    const step = width / (values.length - 1);

    const pts = values.map((value, index) => ({
      x: index * step,
      y: paddingTop + drawable - ((value - min) / span) * drawable,
    }));

    const baseline = paddingTop + drawable;
    return {
      linePath: buildPath(pts),
      areaPath: buildAreaPath(pts, baseline),
    };
  }, [data, drawable, paddingTop]);

  if (!linePath) {
    return <div className="portfolio-chart portfolio-chart--empty" style={{ height: chartHeight }} />;
  }

  return (
    <div className="portfolio-chart" style={{ height: chartHeight }}>
      <svg
        viewBox={`0 0 1000 ${chartHeight}`}
        preserveAspectRatio="none"
        className="portfolio-chart__svg"
        role="img"
        aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={compact ? 2 : 2.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}
