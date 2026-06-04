import { DUSDC_DECIMALS } from '~/constants/sui';
import { PREDICT_FLOAT_SCALING, PREDICT_QUANTITY_UNIT } from '~/constants/predict';

const QUOTE_SCALE = 10 ** DUSDC_DECIMALS;

export function formatPredictPrice(raw: number): string {
  const value = Number(raw) / Number(PREDICT_FLOAT_SCALING);
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPredictStrike(raw: bigint | number): string {
  const value = Number(typeof raw === 'bigint' ? raw : BigInt(Math.trunc(raw))) / Number(PREDICT_FLOAT_SCALING);
  if (!Number.isFinite(value)) return '—';
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatExpiryCountdown(expiryMs: number, nowMs = Date.now()): string {
  const remaining = expiryMs - nowMs;
  if (remaining <= 0) return 'Expired';

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Short window label for market titles (ticks with expiry). */
export function formatMarketWindowLabel(expiryMs: number, nowMs = Date.now()): string {
  const remaining = expiryMs - nowMs;
  if (remaining <= 0) return '0m';

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  const mins = minutes + (seconds > 0 ? 1 : 0);
  return `${Math.max(1, mins)}m`;
}

export function underlyingPairLabel(asset: string): string {
  const base = asset.toUpperCase();
  return `${base}/DUSDC`;
}

export function formatPredictQuote(raw: number | null | undefined): string {
  if (raw == null || !Number.isFinite(raw)) return '—';
  const value = raw / QUOTE_SCALE;
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function formatPredictOdds(raw: number | null | undefined): string {
  if (raw == null || !Number.isFinite(raw)) return '—';
  const pct = (raw / Number(PREDICT_FLOAT_SCALING)) * 100;
  return `${pct.toFixed(1)}%`;
}

export function truncateAddress(address: string, head = 6, tail = 4): string {
  if (address.length <= head + tail + 2) return address;
  return `${address.slice(0, head + 2)}…${address.slice(-tail)}`;
}

/** Human-readable contract lots (raw quantity / PREDICT_QUANTITY_UNIT). */
export function formatPositionQuantity(raw: number): string {
  const lots = raw / Number(PREDICT_QUANTITY_UNIT);
  if (!Number.isFinite(lots)) return '—';
  if (lots >= 10) return lots.toFixed(0);
  if (lots >= 1) return lots.toFixed(2).replace(/\.?0+$/, '');
  return lots.toFixed(4);
}

export function formatRelativeTime(ms: number, nowMs = Date.now()): string {
  const diff = Math.max(0, nowMs - ms);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatPredictTimestamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** Minutes from a short window label (`5m`, `1h`, `2d`). */
export function parseWindowMinutes(windowLabel: string): number {
  const minutes = windowLabel.match(/^(\d+)m$/);
  if (minutes) return Math.max(1, Number(minutes[1]));

  const hours = windowLabel.match(/^(\d+)h$/);
  if (hours) return Math.max(1, Number(hours[1])) * 60;

  const days = windowLabel.match(/^(\d+)d$/);
  if (days) return Math.max(1, Number(days[1])) * 24 * 60;

  return 5;
}

const ET_TIMEZONE = 'America/New_York';

function formatEtTime(d: Date): string {
  return d
    .toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: ET_TIMEZONE,
    })
    .replace(':00', '')
    .replace(' AM', 'AM')
    .replace(' PM', 'PM');
}

/** e.g. "May 20, 11–11:05AM ET" for the active window ending at expiry. */
export function formatMarketWindowRange(expiryMs: number, windowLabel: string): string {
  const minutes = parseWindowMinutes(windowLabel);
  const end = new Date(expiryMs);
  const start = new Date(expiryMs - minutes * 60_000);
  const datePart = start.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: ET_TIMEZONE,
  });
  return `${datePart}, ${formatEtTime(start)}–${formatEtTime(end)} ET`;
}
