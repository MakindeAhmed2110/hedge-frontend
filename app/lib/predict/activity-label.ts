import { PREDICT_PACKAGE_ID } from '~/constants/predict';
import type { SuiTransactionBlock, SuiTransactionEvent } from '~/lib/sui/rpc';

export type ActivityDisplayLabel =
  | 'send'
  | 'receive'
  | 'predict'
  | 'withdrawal'
  | 'close';

const PREDICT_PKG = PREDICT_PACKAGE_ID.toLowerCase();
const PREDICT_PKG_NO_PREFIX = PREDICT_PKG.replace(/^0x/, '');

type MoveCallRef = {
  package?: string;
  module: string;
  function: string;
};

function normalizePkgId(pkg: string | undefined): string {
  if (!pkg) return '';
  const lower = pkg.toLowerCase();
  return lower.startsWith('0x') ? lower : `0x${lower}`;
}

function isPredictPackage(pkg: string | undefined): boolean {
  if (!pkg) {
    return true;
  }
  const normalized = normalizePkgId(pkg);
  return normalized === PREDICT_PKG || normalized.endsWith(PREDICT_PKG_NO_PREFIX);
}

/** Collect MoveCall targets from programmable transaction JSON (`showInput: true`). */
export function extractMoveCalls(tx: SuiTransactionBlock): MoveCallRef[] {
  const calls: MoveCallRef[] = [];

  const visit = (node: unknown): void => {
    if (node == null || typeof node !== 'object') {
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    const record = node as Record<string, unknown>;
    const moveCall = record.MoveCall;
    if (moveCall && typeof moveCall === 'object') {
      const mc = moveCall as Record<string, unknown>;
      const moduleName = mc.module;
      const functionName = mc.function;
      if (typeof moduleName === 'string' && typeof functionName === 'string') {
        calls.push({
          package: typeof mc.package === 'string' ? mc.package : undefined,
          module: moduleName.toLowerCase(),
          function: functionName.toLowerCase(),
        });
      }
    }

    Object.values(record).forEach(visit);
  };

  visit(tx.transaction);
  return calls;
}

function hasMoveCall(
  tx: SuiTransactionBlock,
  module: string,
  functions: string[],
  options?: { requirePredictPackage?: boolean }
): boolean {
  return extractMoveCalls(tx).some((call) => {
    if (call.module !== module || !functions.includes(call.function)) {
      return false;
    }
    if (options?.requirePredictPackage === false) {
      return true;
    }
    return isPredictPackage(call.package);
  });
}

function txEvents(tx: SuiTransactionBlock): SuiTransactionEvent[] {
  if (tx.events?.length) {
    return tx.events;
  }
  const effects = tx as SuiTransactionBlock & {
    effects?: { events?: SuiTransactionEvent[] | null } | null;
  };
  return effects.effects?.events ?? [];
}

function eventType(event: SuiTransactionEvent): string {
  return (event.type ?? '').toLowerCase();
}

function txEventTypes(tx: SuiTransactionBlock): string[] {
  return txEvents(tx).map(eventType);
}

function eventFromPredictPackage(type: string): boolean {
  return type.includes(PREDICT_PKG_NO_PREFIX) || type.includes(PREDICT_PKG);
}

export function txHasPredictMint(tx: SuiTransactionBlock): boolean {
  if (
    txEventTypes(tx).some(
      (type) =>
        eventFromPredictPackage(type) &&
        (type.includes('::positionminted') || type.includes('::rangeminted'))
    )
  ) {
    return true;
  }
  return hasMoveCall(tx, 'predict', ['mint', 'mint_range']);
}

export function txHasPredictRedeem(tx: SuiTransactionBlock): boolean {
  if (
    txEventTypes(tx).some(
      (type) =>
        eventFromPredictPackage(type) &&
        (type.includes('::positionredeemed') || type.includes('::rangeredeemed'))
    )
  ) {
    return true;
  }
  return hasMoveCall(tx, 'predict', ['redeem', 'redeem_range', 'redeem_permissionless']);
}

/** Wallet receive from `predict_manager::withdraw` (DUSDC moved to wallet coins). */
export function txIsPredictManagerWithdraw(tx: SuiTransactionBlock): boolean {
  if (txHasPredictRedeem(tx)) {
    return false;
  }
  return hasMoveCall(tx, 'predict_manager', ['withdraw']);
}

export function resolveActivityDisplayLabel(
  tx: SuiTransactionBlock,
  direction: 'receive' | 'send'
): ActivityDisplayLabel {
  if (direction === 'send') {
    if (txHasPredictMint(tx)) {
      return 'predict';
    }
    return 'send';
  }

  if (txHasPredictRedeem(tx)) {
    return 'close';
  }

  if (txIsPredictManagerWithdraw(tx)) {
    return 'withdrawal';
  }

  return 'receive';
}
