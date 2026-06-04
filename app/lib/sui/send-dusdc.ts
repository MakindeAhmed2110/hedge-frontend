import { SEND_TOKENS } from '~/constants/send-tokens';

import { sendCoin } from '~/lib/sui/send-coin';

export { SendTokenError, SendTokenError as SendDusdcError } from '~/lib/sui/send-errors';

type SendDusdcParams = Omit<Parameters<typeof sendCoin>[0], 'token'>;

/** @deprecated Use sendCoin */
export async function sendDusdc(params: SendDusdcParams) {
  return sendCoin({ ...params, token: SEND_TOKENS.dusdc });
}
