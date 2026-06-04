type ExecuteTransactionEffects = {
  status?: {
    status?: string;
    error?: string;
  };
};

export type ExecuteTransactionBlockResult = {
  digest?: string;
  effects?: ExecuteTransactionEffects;
};

export function assertTransactionSucceeded(result: ExecuteTransactionBlockResult) {
  const status = result.effects?.status?.status;
  if (status === 'failure') {
    throw new Error(
      result.effects?.status?.error?.trim() || 'Transaction failed on Sui testnet'
    );
  }
}
