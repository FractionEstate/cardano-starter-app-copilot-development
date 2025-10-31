export interface ApiSuccess<T> { readonly success: true; readonly data: T; }
export interface ApiError { readonly success: false; readonly error: string; }

export interface CardanoStatus {
  readonly success: boolean;
  readonly ready: boolean;
  readonly ogmiosReachable: boolean;
  readonly kupoReachable: boolean;
  readonly dolosGrpcReachable: boolean;
  readonly dolosRestReachable: boolean;
  readonly dolosRestHealthy: boolean;
}

export interface AddressBalanceResponse { readonly success: boolean; readonly lovelace?: string; readonly error?: string }
export interface AddressUtxosResponse { readonly success: boolean; readonly utxos?: readonly any[]; readonly error?: string }
export interface BuildUnsignedResponse { readonly success: boolean; readonly unsignedCbor?: string; readonly error?: string }

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data && (data.error || data.message)) || `HTTP ${res.status}`);
  return data as T;
}

export async function getCardanoStatus(baseUrl: string): Promise<CardanoStatus> {
  const url = `${baseUrl.replace(/\/$/, '')}/cardano/status`;
  const res = await fetch(url);
  return handle<CardanoStatus>(res);
}

export async function getAddressBalanceApi(baseUrl: string, address: string): Promise<AddressBalanceResponse> {
  const url = `${baseUrl.replace(/\/$/, '')}/cardano/address/${address}/balance`;
  const res = await fetch(url);
  return handle<AddressBalanceResponse>(res);
}

export async function getAddressUtxosApi(baseUrl: string, address: string): Promise<AddressUtxosResponse> {
  const url = `${baseUrl.replace(/\/$/, '')}/cardano/address/${address}/utxos`;
  const res = await fetch(url);
  return handle<AddressUtxosResponse>(res);
}

export interface SendAdaInput {
  readonly fromAddress: string;
  readonly toAddress: string;
  readonly lovelace: string | number | bigint;
}

export async function buildSendAdaApi(baseUrl: string, input: SendAdaInput): Promise<BuildUnsignedResponse> {
  const url = `${baseUrl.replace(/\/$/, '')}/cardano/txs/build/send-ada`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, lovelace: String(input.lovelace) })
  });
  return handle<BuildUnsignedResponse>(res);
}

export type TxAction =
  | { readonly type: 'payMany'; readonly outputs: ReadonlyArray<{ readonly toAddress: string; readonly lovelace?: string | number | bigint; readonly assets?: Record<string, string | number | bigint> }> }
  | { readonly type: 'payLovelace'; readonly toAddress: string; readonly lovelace: string | number | bigint }
  | { readonly type: 'payAssets'; readonly toAddress: string; readonly assets: Record<string, string | number | bigint> }
  | { readonly type: 'metadata'; readonly label: number; readonly metadata: unknown }
  | { readonly type: 'validity'; readonly validFrom?: string | number | bigint; readonly validTo?: string | number | bigint }
  | { readonly type: 'requiredSigner'; readonly keyHash: string }
  | { readonly type: 'changeAddress'; readonly changeAddress: string }
  | { readonly type: 'collateral'; readonly txHash: string; readonly index: number }
  | { readonly type: 'referenceInput'; readonly txHash: string; readonly index: number }
  | { readonly type: 'spendUtxo'; readonly txHash: string; readonly index: number }
  | { readonly type: 'mint'; readonly policyId: string; readonly assets: Record<string, string | number | bigint>; readonly redeemer?: unknown }
  | { readonly type: 'burn'; readonly policyId: string; readonly assets: Record<string, string | number | bigint>; readonly redeemer?: unknown }
  | { readonly type: 'attachScript'; readonly scriptCbor: string }
  | { readonly type: 'stakeRegister'; readonly stakeAddress: string }
  | { readonly type: 'stakeDeregister'; readonly stakeAddress: string }
  | { readonly type: 'withdrawRewards'; readonly stakeAddress: string; readonly amount?: string | number | bigint }
  | { readonly type: 'feePolicy'; readonly strategy?: string; readonly multiplier?: number; readonly [key: string]: unknown };

export async function buildTxFromDslApi(baseUrl: string, fromAddress: string, actions: readonly TxAction[]): Promise<BuildUnsignedResponse> {
  const url = `${baseUrl.replace(/\/$/, '')}/cardano/txs/build`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromAddress, actions })
  });
  return handle<BuildUnsignedResponse>(res);
}
