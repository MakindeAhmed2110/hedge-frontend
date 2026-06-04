
import { DBUSDC_COIN_TYPE, DUSDC_COIN_TYPE } from '~/constants/sui';
import { SEND_TOKENS, TESTNET_SUI_COIN_TYPE, type SendTokenConfig } from '~/constants/send-tokens';
import {
  resolveActivityDisplayLabel,
  type ActivityDisplayLabel,
} from '~/lib/predict/activity-label';
import type { SuiTransactionBlock } from '~/lib/sui/rpc';
import { rpcQueryTransactionBlocks } from '~/lib/sui/rpc';

export type ActivityTransactionType = 'receive' | 'send';

export type ActivityTransaction = {
  id: string;
  digest: string;
  type: ActivityTransactionType;
  /** Subtitle on Recent Activity (Predict, Withdrawal, Send, Receive). */
  label: ActivityDisplayLabel;
  symbol: string;
  name: string;
  amount: number;
  usdValue: number | null;
  logo: string;
  counterparty?: string;
  timestamp: number;
  dateKey: string;
};

export type ActivitySection = {
  title: string;
  data: ActivityTransaction[];
};

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

function isSuiCoinType(coinType: string): boolean {
  return coinType.endsWith('::sui::SUI');
}

function resolveToken(coinType: string): SendTokenConfig | null {
  if (coinType === DUSDC_COIN_TYPE) return SEND_TOKENS.dusdc;
  if (coinType === DBUSDC_COIN_TYPE) return SEND_TOKENS.dbusdc;
  if (coinType === TESTNET_SUI_COIN_TYPE || isSuiCoinType(coinType)) return SEND_TOKENS.sui;
  return null;
}

function formatAmount(raw: bigint, decimals: number): number {
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  return Number(whole) + Number(fraction) / Number(divisor);
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDateTitle(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function findCounterparty(
  changes: SuiTransactionBlock['balanceChanges'],
  coinType: string,
  wallet: string,
  sign: 'positive' | 'negative'
): string | undefined {
  if (!changes) return undefined;

  for (const change of changes) {
    const owner = change.owner?.AddressOwner;
    if (!owner || normalizeAddress(owner) === normalizeAddress(wallet)) continue;
    if (change.coinType !== coinType) continue;

    const raw = BigInt(change.amount);
    if (sign === 'positive' && raw < 0n) return truncateAddress(owner);
    if (sign === 'negative' && raw > 0n) return truncateAddress(owner);
  }

  return undefined;
}

function parseTransaction(tx: SuiTransactionBlock, walletAddress: string): ActivityTransaction[] {
  const wallet = normalizeAddress(walletAddress);
  const changes = tx.balanceChanges ?? [];
  const timestamp = Number(tx.timestampMs ?? 0);
  const dateKey = timestamp
    ? new Date(timestamp).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const items: ActivityTransaction[] = [];
  const receiveLabel = resolveActivityDisplayLabel(tx, 'receive');
  const sendLabel = resolveActivityDisplayLabel(tx, 'send');

  for (const change of changes) {
    const owner = change.owner?.AddressOwner;
    if (!owner || normalizeAddress(owner) !== wallet) continue;

    const token = resolveToken(change.coinType);
    if (!token) continue;

    const raw = BigInt(change.amount);
    if (raw === 0n) continue;

    const type: ActivityTransactionType = raw > 0n ? 'receive' : 'send';
    const label = type === 'receive' ? receiveLabel : sendLabel;
    const absRaw = raw < 0n ? -raw : raw;
    const amount = formatAmount(absRaw, token.decimals);

    const counterparty = findCounterparty(
      changes,
      change.coinType,
      walletAddress,
      type === 'receive' ? 'positive' : 'negative'
    );

    items.push({
      id: `${tx.digest}-${change.coinType}-${type}`,
      digest: tx.digest,
      type,
      label,
      symbol: token.symbol,
      name: token.name,
      amount,
      usdValue: token.amountPrefix ? amount : null,
      logo: token.icon,
      counterparty,
      timestamp,
      dateKey,
    });
  }

  return items;
}

async function queryWalletTransactions(address: string): Promise<SuiTransactionBlock[]> {
  const [fromPage, toPage] = await Promise.all([
    rpcQueryTransactionBlocks({ FromAddress: address }, 40),
    rpcQueryTransactionBlocks({ ToAddress: address }, 40),
  ]);

  const byDigest = new Map<string, SuiTransactionBlock>();
  for (const tx of [...fromPage.data, ...toPage.data]) {
    byDigest.set(tx.digest, tx);
  }

  return [...byDigest.values()].sort(
    (a, b) => Number(b.timestampMs ?? 0) - Number(a.timestampMs ?? 0)
  );
}

export async function fetchSuiActivity(walletAddress: string): Promise<ActivityTransaction[]> {
  const blocks = await queryWalletTransactions(walletAddress);
  const transactions = blocks.flatMap((tx) => parseTransaction(tx, walletAddress));

  return transactions.sort((a, b) => b.timestamp - a.timestamp);
}

export function groupActivityByDate(transactions: ActivityTransaction[]): ActivitySection[] {
  const grouped = transactions.reduce<Record<string, ActivityTransaction[]>>((acc, tx) => {
    if (!acc[tx.dateKey]) acc[tx.dateKey] = [];
    acc[tx.dateKey].push(tx);
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([dateKey, data]) => ({
      title: formatDateTitle(dateKey),
      data,
    }));
}
