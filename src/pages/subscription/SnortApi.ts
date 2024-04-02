import { NDKEvent } from '@nostr-dev-kit/ndk';
import { ndk } from 'irisdb-nostr';

import { throwIfOffline, unwrap } from '@/pages/subscription/utils.ts';

export class OfflineError extends Error {}

export const ApiHost = 'https://api.snort.social';

export enum SubscriptionType {
  Supporter = 0,
  Premium = 1,
}
export interface RevenueToday {
  donations: number;
  nip5: number;
}

export interface RevenueSplit {
  pubKey: string;
  split: number;
}

export interface InvoiceResponse {
  pr: string;
}

export interface Subscription {
  id: string;
  type: SubscriptionType;
  created: number;
  expires: number;
  state: 'new' | 'expired' | 'paid';
  handle?: string;
}

export enum SubscriptionErrorCode {
  InternalError = 1,
  SubscriptionActive = 2,
  Duplicate = 3,
}

export class SubscriptionError extends Error {
  code: SubscriptionErrorCode;

  constructor(msg: string, code: SubscriptionErrorCode) {
    super(msg);
    this.code = code;
  }
}

export interface PushNotifications {
  endpoint: string;
  p256dh: string;
  auth: string;
  scope: string;
}

export interface TranslationRequest {
  text: Array<string>;
  target_lang: string;
}

export interface TranslationResponse {
  translations: Array<{
    detected_source_language: string;
    text: string;
  }>;
}

export interface RelayDistance {
  url: string;
  distance: number;
  users: number;
  country?: string;
  city?: string;
  is_paid?: boolean;
  description?: string;
}

export interface RefCodeResponse {
  code: string;
  pubkey: string;
  revShare?: number;
  leaderState?: 'pending' | 'approved';
}

export default class SnortApi {
  #url: string;

  constructor(url?: string) {
    this.#url = new URL(url ?? ApiHost).toString();
  }

  revenueSplits() {
    return this.#getJson<Array<RevenueSplit>>('api/v1/revenue/splits');
  }

  revenueToday() {
    return this.#getJson<RevenueToday>('api/v1/revenue/today');
  }

  twitterImport(username: string) {
    return this.#getJson<Array<string>>(
      `api/v1/twitter/follows-for-nostr?username=${encodeURIComponent(username)}`,
    );
  }

  createSubscription(type: number, refCode?: string) {
    return this.#getJsonAuthd<InvoiceResponse>(
      `api/v1/subscription?type=${type}&refCode=${refCode}`,
      'PUT',
    );
  }

  renewSubscription(id: string, months = 1) {
    return this.#getJsonAuthd<InvoiceResponse>(
      `api/v1/subscription/${id}/renew?months=${months}`,
      'GET',
    );
  }

  listSubscriptions() {
    return this.#getJsonAuthd<Array<Subscription>>('api/v1/subscription');
  }

  onChainDonation() {
    return this.#getJson<{ address: string }>('p/on-chain');
  }

  getPushNotificationInfo() {
    return this.#getJson<{ publicKey: string }>('api/v1/notifications/info');
  }

  registerPushNotifications(sub: PushNotifications) {
    return this.#getJsonAuthd<void>('api/v1/notifications/register', 'POST', sub);
  }

  translate(tx: TranslationRequest) {
    return this.#getJson<TranslationResponse | object>('api/v1/translate', 'POST', tx);
  }

  closeRelays(lat: number, lon: number, count = 5) {
    return this.#getJson<Array<RelayDistance>>(`api/v1/relays?count=${count}`, 'POST', {
      lat,
      lon,
    });
  }

  getRefCode() {
    return this.#getJsonAuthd<RefCodeResponse>('api/v1/referral', 'GET');
  }

  getRefCodeInfo(code: string) {
    return this.#getJson<RefCodeResponse>(`api/v1/referral/${code}`, 'GET');
  }

  applyForLeader() {
    return this.#getJsonAuthd<RefCodeResponse>('api/v1/referral/leader-apply', 'POST');
  }

  async #getJsonAuthd<T>(
    path: string,
    method?: 'GET' | string,
    body?: object,
    headers?: { [key: string]: string },
  ): Promise<T> {
    if (!ndk().signer) {
      throw new Error('Publisher not set');
    }

    const auth = new NDKEvent(ndk());
    auth.kind = 27235;
    auth.tags = [
      ['url', `${this.#url}${path}`],
      ['method', method ?? 'GET'],
    ];
    await auth.sign();
    const nostrEvent = await auth.toNostrEvent();

    return this.#getJson<T>(path, method, body, {
      ...headers,
      authorization: `Nostr ${window.btoa(JSON.stringify(nostrEvent))}`,
    });
  }

  async #getJson<T>(
    path: string,
    method?: 'GET' | string,
    body?: object,
    headers?: { [key: string]: string },
  ): Promise<T> {
    throwIfOffline();
    const rsp = await fetch(`${this.#url}${path}`, {
      method: method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        accept: 'application/json',
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...headers,
      },
    });

    if (rsp.ok) {
      const text = (await rsp.text()) as string | null;
      if ((text?.length ?? 0) > 0) {
        const obj = JSON.parse(unwrap(text));
        if ('error' in obj) {
          throw new SubscriptionError(obj.error, obj.code);
        }
        return obj as T;
      } else {
        return {} as T;
      }
    } else {
      throw new Error('Invalid response');
    }
  }
}
