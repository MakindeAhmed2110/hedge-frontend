import { DeepBookConfig, DeepBookContract } from '@mysten/deepbook-v3';
import { Transaction } from '@mysten/sui/transactions';

import {
  DEEPBOOK_DEEP_COIN_TYPE,
  DEEPBOOK_POOL_KEY,
  SWAP_MIN_DBUSDC_AMOUNT,
  SWAP_MIN_SUI_AMOUNT,
  type SwapTokenConfig,
} from '~/constants/swap';
import { SUI_GAS_RESERVE_MIST } from '~/constants/send-tokens';
import type { SwapQuote } from '~/lib/deepbook/swap-quote';
import { fetchSuiBalanceMist } from '~/lib/sui/balances';
import { prepareCoinForAmount, PrepareCoinError } from '~/lib/sui/prepare-coin';
import type { PrivySignRawHash } from '~/lib/sui/privy-sign';
import { signAndExecuteTransaction } from '~/lib/sui/privy-sign';
import { SwapError } from '~/lib/sui/swap-errors';
import { parseAmountToRaw } from '~/lib/sui/balances';
import type { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';

export { SwapError } from '~/lib/sui/swap-errors';

export async function executeDeepbookSwap({
  senderAddress,
  payToken,
  payAmountInput,
  quote,
  publicKey,
  publicKeyFromPrivy,
  signRawHash,
  getAccessToken,
}: {
  senderAddress: string;
  payToken: SwapTokenConfig;
  payAmountInput: string;
  quote: SwapQuote;
  publicKey?: Ed25519PublicKey;
  publicKeyFromPrivy?: string | null;
  signRawHash: PrivySignRawHash;
  getAccessToken?: () => Promise<string | null>;
}) {
  const payAmount = parseFloat(payAmountInput);
  if (!Number.isFinite(payAmount) || payAmount <= 0) {
    throw new SwapError('INVALID_AMOUNT', 'Enter a valid amount');
  }

  if (payToken.id === 'sui' && payAmount < SWAP_MIN_SUI_AMOUNT) {
    throw new SwapError('BELOW_MIN', `Minimum swap size is ${SWAP_MIN_SUI_AMOUNT} SUI`);
  }
  if (payToken.id === 'dbusdc' && payAmount < SWAP_MIN_DBUSDC_AMOUNT) {
    throw new SwapError('BELOW_MIN', `Minimum swap size is ${SWAP_MIN_DBUSDC_AMOUNT} USDC`);
  }

  const suiMist = await fetchSuiBalanceMist(senderAddress);
  if (suiMist === 0n) {
    throw new SwapError('NO_SUI_GAS', 'You need testnet SUI for gas. Use Receive faucet first.');
  }

  const payRaw = parseAmountToRaw(payAmountInput, payToken.decimals);
  if (payToken.id === 'sui' && payRaw + SUI_GAS_RESERVE_MIST > suiMist) {
    throw new SwapError(
      'INSUFFICIENT_PAY',
      'Amount plus gas reserve exceeds your SUI balance'
    );
  }

  const deepRaw = parseAmountToRaw(
    quote.deepAmountWithBuffer.toFixed(6),
    6
  );

  const config = new DeepBookConfig({
    address: senderAddress,
    network: 'testnet',
  });
  const deepBook = new DeepBookContract(config);

  const tx = new Transaction();
  tx.setSender(senderAddress);

  try {
    const payCoin = await prepareCoinForAmount(tx, senderAddress, payToken.coinType, payRaw);

    let deepCoin;
    try {
      deepCoin = await prepareCoinForAmount(
        tx,
        senderAddress,
        DEEPBOOK_DEEP_COIN_TYPE,
        deepRaw
      );
    } catch (deepError) {
      if (deepError instanceof PrepareCoinError) {
        throw new SwapError(
          deepError.code === 'NO_COINS' ? 'NO_DEEP' : 'INSUFFICIENT_DEEP',
          deepError.code === 'NO_COINS'
            ? 'You need DEEP tokens to pay DeepBook trading fees'
            : 'Insufficient DEEP for trading fees'
        );
      }
      throw deepError;
    }

    const swapParams = {
      poolKey: DEEPBOOK_POOL_KEY,
      amount: payAmount,
      deepAmount: quote.deepAmountWithBuffer,
      minOut: quote.minReceiveAmount,
      deepCoin,
    };

    const results =
      payToken.id === 'sui'
        ? deepBook.swapExactBaseForQuote({
            ...swapParams,
            baseCoin: payCoin,
          })(tx)
        : deepBook.swapExactQuoteForBase({
            ...swapParams,
            quoteCoin: payCoin,
          })(tx);

    const [baseOut, quoteOut, deepOut] = results;
    tx.transferObjects([baseOut, quoteOut, deepOut], senderAddress);

    return await signAndExecuteTransaction({
      transaction: tx,
      senderAddress,
      publicKey,
      publicKeyFromPrivy,
      signRawHash,
      getAccessToken,
    });
  } catch (error) {
    if (error instanceof SwapError) throw error;
    if (error instanceof PrepareCoinError) {
      if (error.code === 'NO_COINS') {
        const isDeep = error.message.includes('DEEP');
        throw new SwapError(
          isDeep ? 'NO_DEEP' : 'NO_PAY_BALANCE',
          isDeep
            ? 'You need DEEP tokens to pay DeepBook trading fees'
            : `No ${payToken.symbol} balance on testnet`
        );
      }
      throw new SwapError('INSUFFICIENT_PAY', `Insufficient ${payToken.symbol} balance`);
    }

    const message = error instanceof Error ? error.message : 'Swap failed';
    throw new SwapError('SWAP_FAILED', message);
  }
}
