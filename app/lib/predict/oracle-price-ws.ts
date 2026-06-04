import { PREDICT_PACKAGE_ID } from '~/constants/predict';
import { SUI_TESTNET_RPC_URL } from '~/constants/sui';

const WS_URL = SUI_TESTNET_RPC_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');

const ORACLE_PRICES_EVENT = `${PREDICT_PACKAGE_ID}::oracle::OraclePricesUpdated`;

export type OraclePriceUpdate = {
  oracleId: string;
  spot: number;
  forward: number;
  timestamp: number;
};

type Subscriber = (update: OraclePriceUpdate) => void;

let socket: WebSocket | null = null;
let subscribeId: string | number | null = null;
let connectPromise: Promise<void> | null = null;
const oracleSubscribers = new Map<string, Set<Subscriber>>();
let requestId = 1;

function nextId() {
  const id = requestId;
  requestId += 1;
  return id;
}

function sendJson(payload: Record<string, unknown>) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function ensureConnected(): Promise<void> {
  if (socket?.readyState === WebSocket.OPEN && subscribeId != null) {
    return Promise.resolve();
  }
  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    socket = ws;

    ws.onopen = () => {
      const id = nextId();
      sendJson({
        jsonrpc: '2.0',
        id,
        method: 'suix_subscribeEvent',
        params: [
          {
            MoveEventType: ORACLE_PRICES_EVENT,
          },
          null,
          true,
        ],
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data)) as {
          id?: number;
          result?: string | number;
          params?: {
            subscription?: string | number;
            result?: {
              parsedJson?: {
                oracle_id?: string;
                spot?: number | string;
                forward?: number | string;
                timestamp?: number | string;
              };
            };
          };
        };

        if (data.id && data.result != null && subscribeId == null) {
          subscribeId = data.result;
          resolve();
          return;
        }

        const parsed = data.params?.result?.parsedJson;
        if (!parsed?.oracle_id) {
          return;
        }

        const update: OraclePriceUpdate = {
          oracleId: parsed.oracle_id,
          spot: Number(parsed.spot ?? 0),
          forward: Number(parsed.forward ?? 0),
          timestamp: Number(parsed.timestamp ?? Date.now()),
        };

        const listeners = oracleSubscribers.get(update.oracleId.toLowerCase());
        if (listeners) {
          listeners.forEach((listener) => listener(update));
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onerror = () => {
      connectPromise = null;
      reject(new Error('Predict price stream connection failed'));
    };

    ws.onclose = () => {
      socket = null;
      subscribeId = null;
      connectPromise = null;
    };
  });

  return connectPromise;
}

export function subscribeOraclePrices(
  oracleId: string,
  listener: Subscriber
): () => void {
  const normalized = oracleId.toLowerCase();
  let set = oracleSubscribers.get(normalized);
  if (!set) {
    set = new Set();
    oracleSubscribers.set(normalized, set);
  }
  set.add(listener);

  void ensureConnected().catch(() => {
    // polling fallback handled in hook
  });

  return () => {
    const current = oracleSubscribers.get(normalized);
    current?.delete(listener);
    if (current && current.size === 0) {
      oracleSubscribers.delete(normalized);
    }
  };
}
