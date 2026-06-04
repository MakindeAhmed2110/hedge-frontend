export class SwapError extends Error {
  constructor(
    readonly code:
      | 'INVALID_AMOUNT'
      | 'NO_PAY_BALANCE'
      | 'INSUFFICIENT_PAY'
      | 'NO_DEEP'
      | 'INSUFFICIENT_DEEP'
      | 'NO_SUI_GAS'
      | 'QUOTE_FAILED'
      | 'BELOW_MIN'
      | 'SWAP_FAILED',
    message: string
  ) {
    super(message);
    this.name = 'SwapError';
  }
}
