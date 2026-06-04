import { PREDICT_FLOAT_SCALING } from '~/constants/predict';

export function alignStrikeToGrid(
  spotRaw: number,
  minStrike: number,
  tickSize: number
): bigint {
  const min = BigInt(minStrike);
  const tick = BigInt(tickSize);
  const spot = BigInt(Math.max(spotRaw, 0));

  if (tick <= 0n) {
    return spot;
  }

  if (spot < min) {
    return min;
  }

  const relative = spot - min;
  const tickIndex = relative / tick;
  return min + tickIndex * tick;
}

export function strikeBandAroundAtm(
  atmStrike: bigint,
  tickSize: number,
  steps = 2
): { lower: bigint; higher: bigint }[] {
  const tick = BigInt(tickSize);
  const bands: { lower: bigint; higher: bigint }[] = [];

  for (let i = 1; i <= steps; i += 1) {
    const lower = atmStrike - tick * BigInt(i);
    const higher = atmStrike + tick * BigInt(i);
    if (lower > 0n && higher > lower) {
      bands.push({ lower, higher });
    }
  }

  if (bands.length === 0) {
    bands.push({ lower: atmStrike - tick, higher: atmStrike + tick });
  }

  return bands;
}

export function spotFromRaw(raw: number): number {
  return raw / Number(PREDICT_FLOAT_SCALING);
}
