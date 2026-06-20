import { useEffect, useRef, useState } from "react";

import { spotFromRaw } from "~/lib/predict/strike";
import type { PredictPlayCard } from "~/lib/predict/types";

export type LiveChartPoint = { value: number; timestamp: number };

const MAX_POINTS = 80;
const TICK_MS = 1000;

/** Seed a gentle, smoothly-trending price history around the forward price. */
function seedSeries(spot: number, forward: number): LiveChartPoint[] {
  const now = Date.now();
  const series: LiveChartPoint[] = [];
  let value = spot;
  let velocity = 0;

  for (let i = 0; i < MAX_POINTS; i += 1) {
    const t = i / (MAX_POINTS - 1);
    const anchor = spot + (forward - spot) * t;
    // momentum + mean reversion toward the drifting anchor
    velocity += (Math.random() - 0.5) * spot * 0.00018;
    velocity += (anchor - value) * 0.08;
    velocity *= 0.82;
    value += velocity;
    series.push({ value, timestamp: now - (MAX_POINTS - i) * TICK_MS });
  }

  return series;
}

export function useLiveMarketChart(card: PredictPlayCard | null) {
  const [series, setSeries] = useState<LiveChartPoint[]>([]);
  const velocityRef = useRef(0);

  useEffect(() => {
    if (!card || card.spot <= 0) {
      setSeries([]);
      return;
    }

    const spot = spotFromRaw(card.spot);
    const forward = spotFromRaw(card.forward);
    velocityRef.current = 0;
    setSeries(seedSeries(spot, forward));
  }, [card]);

  useEffect(() => {
    if (!card || card.spot <= 0) return;

    const spot = spotFromRaw(card.spot);
    const forward = spotFromRaw(card.forward);

    const id = window.setInterval(() => {
      setSeries((previous) => {
        if (previous.length === 0) return previous;

        const last = previous[previous.length - 1]!.value;
        // velocity-driven random walk that gently reverts to the forward price
        velocityRef.current += (Math.random() - 0.5) * spot * 0.00016;
        velocityRef.current += (forward - last) * 0.06;
        velocityRef.current *= 0.84;
        const nextValue = last + velocityRef.current;

        const next: LiveChartPoint = { value: nextValue, timestamp: Date.now() };
        const tail = previous.length >= MAX_POINTS ? previous.slice(1) : previous;
        return [...tail, next];
      });
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [card]);

  return series;
}
