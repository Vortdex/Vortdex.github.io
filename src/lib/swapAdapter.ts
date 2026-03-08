/**
 * SwapAdapter — Unified abstraction for multi-chain swap backends.
 *
 * Each adapter implements this interface so the SwapWidget can route
 * to the correct backend (0x for EVM, Ayin DEX for Alephium, etc.)
 * without knowing the underlying details.
 */

export interface SwapToken {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  color: string;
}

export interface SwapPriceRequest {
  sellToken: string;
  buyToken: string;
  sellAmount: string; // in smallest unit (wei, etc.)
  chainId: number | string;
  taker?: string;
}

export interface SwapPriceResponse {
  buyAmount: string;
  fees?: {
    integratorFee?: { amount: string };
    zeroExFee?: { amount: string };
  };
  minBuyAmount?: string;
  /** adapter can attach raw response for downstream use */
  raw?: unknown;
}

export interface SwapQuoteRequest extends SwapPriceRequest {
  taker: string;
  slippageBps?: number;
}

export interface SwapQuoteResponse extends SwapPriceResponse {
  transaction?: {
    to: string;
    data: string;
    value?: string;
    gas?: string;
    gasPrice?: string;
  };
  /** For non-EVM chains that need a different signing flow */
  unsignedTx?: unknown;
}

export interface SwapAdapter {
  /** Unique adapter identifier */
  readonly id: string;
  /** Human readable name */
  readonly name: string;
  /** Whether this adapter works with wagmi/EVM wallets */
  readonly isEvm: boolean;
  /** Chain IDs this adapter supports (number for EVM, string for non-EVM) */
  readonly supportedChains: (number | string)[];
  /** Get available tokens for a chain */
  getTokens(chainId: number | string): SwapToken[];
  /** Fetch an indicative price (no taker required) */
  getPrice(req: SwapPriceRequest): Promise<SwapPriceResponse>;
  /** Fetch an executable quote (taker required) */
  getQuote(req: SwapQuoteRequest): Promise<SwapQuoteResponse>;
}

// ─── 0x EVM Adapter ───────────────────────────────────────────

import { supabase } from '@/integrations/supabase/client';

const NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const EVM_TOKEN_LISTS: Record<number, SwapToken[]> = {
  1: [
    { symbol: 'ETH', name: 'Ethereum', address: NATIVE_ETH, decimals: 18, color: 'hsl(220, 60%, 55%)' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, color: 'hsl(210, 80%, 55%)' },
    { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, color: 'hsl(160, 80%, 45%)' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8, color: 'hsl(30, 90%, 55%)' },
    { symbol: 'DAI', name: 'Dai', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18, color: 'hsl(40, 90%, 55%)' },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, color: 'hsl(220, 60%, 55%)' },
    { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18, color: 'hsl(220, 80%, 60%)' },
    { symbol: 'UNI', name: 'Uniswap', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', decimals: 18, color: 'hsl(330, 80%, 60%)' },
    { symbol: 'AAVE', name: 'Aave', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18, color: 'hsl(270, 60%, 55%)' },
    { symbol: 'LDO', name: 'Lido DAO', address: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32', decimals: 18, color: 'hsl(195, 80%, 55%)' },
  ],
  42161: [
    { symbol: 'ETH', name: 'Ethereum', address: NATIVE_ETH, decimals: 18, color: 'hsl(210, 80%, 55%)' },
    { symbol: 'USDC', name: 'USD Coin', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6, color: 'hsl(210, 80%, 55%)' },
    { symbol: 'USDT', name: 'Tether', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6, color: 'hsl(160, 80%, 45%)' },
    { symbol: 'ARB', name: 'Arbitrum', address: '0x912CE59144191C1204E64559FE8253a0e49E6548', decimals: 18, color: 'hsl(210, 80%, 55%)' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', decimals: 8, color: 'hsl(30, 90%, 55%)' },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18, color: 'hsl(220, 60%, 55%)' },
  ],
  137: [
    { symbol: 'MATIC', name: 'Polygon', address: NATIVE_ETH, decimals: 18, color: 'hsl(265, 80%, 55%)' },
    { symbol: 'USDC', name: 'USD Coin', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6, color: 'hsl(210, 80%, 55%)' },
    { symbol: 'USDT', name: 'Tether', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6, color: 'hsl(160, 80%, 45%)' },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', decimals: 18, color: 'hsl(220, 60%, 55%)' },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6', decimals: 8, color: 'hsl(30, 90%, 55%)' },
  ],
  10: [
    { symbol: 'ETH', name: 'Ethereum', address: NATIVE_ETH, decimals: 18, color: 'hsl(0, 80%, 55%)' },
    { symbol: 'USDC', name: 'USD Coin', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6, color: 'hsl(210, 80%, 55%)' },
    { symbol: 'OP', name: 'Optimism', address: '0x4200000000000000000000000000000000000042', decimals: 18, color: 'hsl(0, 80%, 55%)' },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18, color: 'hsl(220, 60%, 55%)' },
    { symbol: 'USDT', name: 'Tether', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6, color: 'hsl(160, 80%, 45%)' },
  ],
  8453: [
    { symbol: 'ETH', name: 'Ethereum', address: NATIVE_ETH, decimals: 18, color: 'hsl(220, 80%, 55%)' },
    { symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, color: 'hsl(210, 80%, 55%)' },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18, color: 'hsl(220, 60%, 55%)' },
    { symbol: 'cbBTC', name: 'Coinbase BTC', address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', decimals: 8, color: 'hsl(30, 90%, 55%)' },
  ],
  480: [
    { symbol: 'ETH', name: 'Ethereum', address: NATIVE_ETH, decimals: 18, color: 'hsl(160, 70%, 50%)' },
    { symbol: 'WLD', name: 'Worldcoin', address: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003', decimals: 18, color: 'hsl(160, 70%, 50%)' },
    { symbol: 'USDC.e', name: 'Bridged USDC', address: '0x79A02482A880bCE3B13e09Da970dC34db4CD24d1', decimals: 6, color: 'hsl(210, 80%, 55%)' },
    { symbol: 'WETH', name: 'Wrapped Ether', address: '0x4200000000000000000000000000000000000006', decimals: 18, color: 'hsl(220, 60%, 55%)' },
  ],
};

export class ZeroXAdapter implements SwapAdapter {
  readonly id = '0x';
  readonly name = '0x Aggregator';
  readonly isEvm = true;
  readonly supportedChains = [1, 42161, 137, 10, 8453, 480];

  getTokens(chainId: number | string): SwapToken[] {
    return EVM_TOKEN_LISTS[Number(chainId)] || EVM_TOKEN_LISTS[1];
  }

  async getPrice(req: SwapPriceRequest): Promise<SwapPriceResponse> {
    const { data, error } = await supabase.functions.invoke('swap-price', {
      body: {
        sellToken: req.sellToken,
        buyToken: req.buyToken,
        sellAmount: req.sellAmount,
        chainId: Number(req.chainId),
        ...(req.taker && { taker: req.taker }),
      },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return {
      buyAmount: data.buyAmount,
      fees: data.fees,
      minBuyAmount: data.minBuyAmount,
      raw: data,
    };
  }

  async getQuote(req: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    const { data, error } = await supabase.functions.invoke('swap-quote', {
      body: {
        sellToken: req.sellToken,
        buyToken: req.buyToken,
        sellAmount: req.sellAmount,
        chainId: Number(req.chainId),
        taker: req.taker,
      },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return {
      buyAmount: data.buyAmount,
      fees: data.fees,
      minBuyAmount: data.minBuyAmount,
      transaction: data.transaction,
      raw: data,
    };
  }
}

// ─── Alephium DEX Backend Interface ──────────────────────────

/** Pluggable backend for Alephium DEX routing (Ayin, Elexium, official SDK) */
export interface AlephiumDexBackend {
  readonly id: string;
  readonly name: string;
  getTokens(): SwapToken[];
  getPrice(req: SwapPriceRequest): Promise<SwapPriceResponse>;
  getQuote(req: SwapQuoteRequest): Promise<SwapQuoteResponse>;
}

// ─── Ayin DEX Backend ────────────────────────────────────────

const AYIN_TOKENS: SwapToken[] = [
  { symbol: 'ALPH', name: 'Alephium', address: 'native', decimals: 18, color: 'hsl(165, 70%, 45%)' },
  { symbol: 'USDT', name: 'Tether (Alephium)', address: 'zSRgc7goAYUgYsEBYDjp4EMRHieZ5wXBnpfubFpEhDFo', decimals: 6, color: 'hsl(160, 80%, 45%)' },
  { symbol: 'WETH', name: 'Wrapped ETH (Alephium)', address: 'vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy', decimals: 18, color: 'hsl(220, 60%, 55%)' },
  { symbol: 'AYIN', name: 'Ayin', address: 'vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb', decimals: 18, color: 'hsl(30, 80%, 55%)' },
];

export class AyinDexBackend implements AlephiumDexBackend {
  readonly id = 'ayin';
  readonly name = 'Ayin DEX';

  getTokens(): SwapToken[] {
    return AYIN_TOKENS;
  }

  async getPrice(_req: SwapPriceRequest): Promise<SwapPriceResponse> {
    // TODO: Integrate with Ayin DEX contracts / API
    throw new Error('Ayin DEX integration coming soon');
  }

  async getQuote(_req: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    throw new Error('Ayin DEX integration coming soon');
  }
}

// ─── Elexium Backend (Stub) ──────────────────────────────────

export class ElexiumDexBackend implements AlephiumDexBackend {
  readonly id = 'elexium';
  readonly name = 'Elexium Finance';

  getTokens(): SwapToken[] {
    // Elexium will likely support the same base tokens + LP tokens
    return AYIN_TOKENS;
  }

  async getPrice(_req: SwapPriceRequest): Promise<SwapPriceResponse> {
    throw new Error('Elexium Finance integration coming soon');
  }

  async getQuote(_req: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    throw new Error('Elexium Finance integration coming soon');
  }
}

// ─── Official Alephium DEX Backend (Primary) ─────────────────

const ALPH_DEX_TOKENS: SwapToken[] = [
  { symbol: 'ALPH', name: 'Alephium', address: 'ALPH', decimals: 18, color: 'hsl(165, 70%, 45%)' },
  { symbol: 'USDT', name: 'Tether (AlphBridge)', address: 'USDT', decimals: 6, color: 'hsl(160, 80%, 45%)' },
  { symbol: 'USDC', name: 'USD Coin (AlphBridge)', address: 'USDC', decimals: 6, color: 'hsl(210, 80%, 55%)' },
  { symbol: 'WETH', name: 'Wrapped ETH (AlphBridge)', address: 'WETH', decimals: 18, color: 'hsl(220, 60%, 55%)' },
  { symbol: 'AYIN', name: 'Ayin', address: 'AYIN', decimals: 18, color: 'hsl(30, 80%, 55%)' },
  { symbol: 'WBTC', name: 'Wrapped BTC (AlphBridge)', address: 'WBTC', decimals: 8, color: 'hsl(30, 90%, 55%)' },
  { symbol: 'DAI', name: 'Dai (AlphBridge)', address: 'DAI', decimals: 18, color: 'hsl(40, 90%, 55%)' },
];

export class AlephiumOfficialDexBackend implements AlephiumDexBackend {
  readonly id = 'alph-sdk';
  readonly name = 'Alephium DEX (Official)';

  getTokens(): SwapToken[] {
    return ALPH_DEX_TOKENS;
  }

  async getPrice(req: SwapPriceRequest): Promise<SwapPriceResponse> {
    const { data, error } = await supabase.functions.invoke('swap-alephium', {
      body: {
        sellToken: req.sellToken,
        buyToken: req.buyToken,
        sellAmount: req.sellAmount,
        mode: 'price',
        ...(req.taker && { taker: req.taker }),
      },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return {
      buyAmount: data.buyAmount,
      fees: data.fees,
      minBuyAmount: data.minBuyAmount,
      raw: data,
    };
  }

  async getQuote(req: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    const { data, error } = await supabase.functions.invoke('swap-alephium', {
      body: {
        sellToken: req.sellToken,
        buyToken: req.buyToken,
        sellAmount: req.sellAmount,
        taker: req.taker,
        mode: 'quote',
      },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return {
      buyAmount: data.buyAmount,
      fees: data.fees,
      minBuyAmount: data.minBuyAmount,
      unsignedTx: data.unsignedTx,
      raw: data,
    };
  }
}

// ─── Alephium Adapter (routes to pluggable backend) ──────────

const AVAILABLE_BACKENDS: AlephiumDexBackend[] = [
  new AlephiumOfficialDexBackend(), // Official SDK = default (primary)
  new AyinDexBackend(),
  new ElexiumDexBackend(),
];

export class AlephiumAdapter implements SwapAdapter {
  readonly id = 'alephium';
  readonly name = 'Alephium DEX';
  readonly isEvm = false;
  readonly supportedChains = ['alephium' as string | number];

  private backend: AlephiumDexBackend;

  constructor(backendId?: string) {
    this.backend = AVAILABLE_BACKENDS.find((b) => b.id === backendId) ?? AVAILABLE_BACKENDS[0];
  }

  /** Switch the active DEX backend at runtime */
  setBackend(backendId: string): void {
    const found = AVAILABLE_BACKENDS.find((b) => b.id === backendId);
    if (!found) throw new Error(`Unknown Alephium backend: ${backendId}`);
    this.backend = found;
  }

  getActiveBackend(): AlephiumDexBackend {
    return this.backend;
  }

  getAvailableBackends(): { id: string; name: string }[] {
    return AVAILABLE_BACKENDS.map((b) => ({ id: b.id, name: b.name }));
  }

  getTokens(): SwapToken[] {
    return this.backend.getTokens();
  }

  async getPrice(req: SwapPriceRequest): Promise<SwapPriceResponse> {
    return this.backend.getPrice(req);
  }

  async getQuote(req: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    return this.backend.getQuote(req);
  }
}

// ─── Adapter Registry ─────────────────────────────────────────

const adapters: SwapAdapter[] = [new ZeroXAdapter(), new AlephiumAdapter()];

export function getAdapterForChain(chainId: number | string): SwapAdapter | undefined {
  return adapters.find((a) => a.supportedChains.includes(chainId));
}

export function getAllChains(): { id: number | string; name: string; adapter: string; isEvm: boolean }[] {
  return [
    { id: 1, name: 'Ethereum', adapter: '0x', isEvm: true },
    { id: 42161, name: 'Arbitrum', adapter: '0x', isEvm: true },
    { id: 137, name: 'Polygon', adapter: '0x', isEvm: true },
    { id: 10, name: 'Optimism', adapter: '0x', isEvm: true },
    { id: 8453, name: 'Base', adapter: '0x', isEvm: true },
    { id: 480, name: 'World Chain', adapter: '0x', isEvm: true },
    { id: 'alephium', name: 'Alephium', adapter: 'alph-sdk', isEvm: false },
  ];
}
