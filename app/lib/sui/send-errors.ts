export class SendTokenError extends Error {
  code:
    | 'INVALID_ADDRESS'
    | 'NO_BALANCE'
    | 'INSUFFICIENT_BALANCE'
    | 'NO_SUI_GAS'
    | 'SEND_FAILED';

  constructor(code: SendTokenError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

/** @deprecated Use SendTokenError */
export const SendDusdcError = SendTokenError;
