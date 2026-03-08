/**
 * swap-alephium — Edge function for Alephium DEX swaps using on-chain AMM pool reserves.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

interface RateBucket { count: number; resetAt: number }
const rateBuckets = new Map<string, RateBucket>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count++;
  return bucket.count > RATE_LIMIT_MAX;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of rateBuckets) { if (now > b.resetAt) rateBuckets.delete(ip); }
}, 300_000);

function logEvent(functionName: string, eventType: string, ip: string, details: Record<string, unknown>, statusCode: number) {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    supabase.from('edge_function_logs').insert({
      function_name: functionName,
      event_type: eventType,
      ip_address: ip,
      details,
      status_code: statusCode,
    }).then(() => {});
  } catch (e) {
    console.error('Log insert failed:', e);
  }
}

const FN_NAME = 'swap-alephium';
const FEE_BPS = 10;
const FEE_RECIPIENT = '0x03D7BD4795141Efd0be2A24678CaA13bdd5E1F13';
const NODE_URL = 'https://node.mainnet.alephium.org';
const ALPH_ID = '0000000000000000000000000000000000000000000000000000000000000000';

interface TokenMeta { symbol: string; decimals: number; id: string }

const TOKENS: Record<string, TokenMeta> = {
  ALPH:  { symbol: 'ALPH',  decimals: 18, id: ALPH_ID },
  USDT:  { symbol: 'USDT',  decimals: 6,  id: '556d9582463fe44fbd108aedc9f409f69086dc78d994b88ea6c9e65f8bf98e00' },
  USDC:  { symbol: 'USDC',  decimals: 6,  id: '722954d9067c5a5ad532746a024f2a9d7a18ed9b90e27d0a3a504962160b5600' },
  WETH:  { symbol: 'WETH',  decimals: 18, id: '19246e8c2899bc258a1156e08466e3cdd3323da756d8a543c7fc911847b96f00' },
  WBTC:  { symbol: 'WBTC',  decimals: 8,  id: '383bc735a4de6722af80546ec9eeb3cff508f2f68e97da19489ce69f3e703200' },
  AYIN:  { symbol: 'AYIN',  decimals: 18, id: '1a281053ba8601a658368594da034c2e99a0fb951b86498d05e76aedfe666800' },
  DAI:   { symbol: 'DAI',   decimals: 18, id: '3d0a1895108782acfa875c2829b0bf76cb586d95ffa4ea9855982667cc73b700' },
};

const ID_TO_SYMBOL = new Map(Object.values(TOKENS).map(t => [t.id, t.symbol]));

function resolveToken(input: string): TokenMeta | null {
  if (TOKENS[input.toUpperCase()]) return TOKENS[input.toUpperCase()];
  const sym = ID_TO_SYMBOL.get(input);
  if (sym) return TOKENS[sym];
  if (input === 'native') return TOKENS.ALPH;
  return null;
}

interface Pool { address: string; token0: string; token1: string }
const POOLS: Pool[] = [
  { address: '2A5R8KZQ3rhKYrW7bAS4JTjY9FCFLJg6HjQpqSFZBqACX', token0: ALPH_ID, token1: TOKENS.USDT.id },
  { address: '283R192Z8n6PhXSpSciyvCsLEiiEVFkSE6MbRBA4KSaAj', token0: ALPH_ID, token1: TOKENS.USDC.id },
  { address: 'yXMFxdoKcE86W9NAyajc8Z3T3k2f5FGiHqHtuA69DYT1',  token0: ALPH_ID, token1: TOKENS.WETH.id },
  { address: '28XY326TxvSekaAwiWDLFg2QBRfacSga8dyNJCYGUYNbq', token0: ALPH_ID, token1: TOKENS.WBTC.id },
  { address: '25ywM8iGxKpZWuGA5z6DXKGcZCXtPBmnbQyJEsjvjjWTy', token0: ALPH_ID, token1: TOKENS.AYIN.id },
  { address: '21NEBCk8nj5JBKpS7eN8kX6xGJoLHNqTS3WBFnZ7q8L9m', token0: TOKENS.AYIN.id, token1: TOKENS.USDT.id },
  { address: '2961aauvprhETv6TXGQRc3zZY4FbLnqKon2a4wK6ABH9q', token0: TOKENS.AYIN.id, token1: TOKENS.USDC.id },
  { address: '27C75V9K5o9CkkGTMDQZ3x2eP82xnacraEqTYXA35Xuw5', token0: TOKENS.USDT.id, token1: TOKENS.USDC.id },
];

const SELL_AMOUNT_RE = /^[0-9]{1,78}$/;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
function err(message: string, status = 400) { return json({ error: message }, status); }

function applyFee(raw: bigint) {
  const fee = (raw * BigInt(FEE_BPS)) / 10000n;
  return { buyAmount: raw - fee, feeAmount: fee };
}

function amountOut(amIn: bigint, rIn: bigint, rOut: bigint): bigint {
  if (amIn <= 0n || rIn <= 0n || rOut <= 0n) return 0n;
  const num = 997n * amIn * rOut;
  const den = 997n * amIn + 1000n * rIn;
  return num / den;
}

async function balances(addr: string): Promise<Map<string, bigint>> {
  const r = await fetch(`${NODE_URL}/addresses/${addr}/balance`);
  if (!r.ok) { await r.text(); return new Map(); }
  const d = await r.json();
  const m = new Map<string, bigint>();
  m.set(ALPH_ID, BigInt(d.balance || '0'));
  for (const tb of d.tokenBalances || []) m.set(tb.id, BigInt(tb.amount || '0'));
  return m;
}

function findPool(a: string, b: string): Pool | undefined {
  return POOLS.find(p =>
    (p.token0 === a && p.token1 === b) || (p.token0 === b && p.token1 === a)
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return err('Method not allowed', 405);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('cf-connecting-ip') || 'unknown';

  if (isRateLimited(ip)) {
    logEvent(FN_NAME, 'rate_limit', ip, {}, 429);
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
    );
  }

  try {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return err('Invalid JSON body'); }

    const { sellToken, buyToken, sellAmount, taker, mode } = body;
    if (typeof sellToken !== 'string' || typeof buyToken !== 'string' || typeof sellAmount !== 'string')
      return err('sellToken, buyToken (string) and sellAmount (string) are required');
    if (!SELL_AMOUNT_RE.test(sellAmount) || sellAmount === '0')
      return err('sellAmount must be a positive integer string');

    const sell = resolveToken(sellToken);
    const buy  = resolveToken(buyToken);
    if (!sell) return err(`Unknown sellToken: ${sellToken}`);
    if (!buy)  return err(`Unknown buyToken: ${buyToken}`);
    if (sell.id === buy.id) return err('sellToken and buyToken must be different');

    const isQuote = mode === 'quote';
    if (isQuote && (!taker || typeof taker !== 'string'))
      return err('A valid taker address is required for quotes');

    const amIn = BigInt(sellAmount);

    try {
      let rawOut = 0n;
      let route: Record<string, unknown> = {};

      const direct = findPool(sell.id, buy.id);
      if (direct) {
        const bal = await balances(direct.address);
        const rIn  = bal.get(sell.id) || 0n;
        const rOut = bal.get(buy.id)  || 0n;
        if (rIn > 0n && rOut > 0n) {
          rawOut = amountOut(amIn, rIn, rOut);
          route = { type: 'direct', pool: direct.address, reserveIn: rIn.toString(), reserveOut: rOut.toString() };
        }
      }

      if (rawOut <= 0n && sell.id !== ALPH_ID && buy.id !== ALPH_ID) {
        const pool1 = findPool(sell.id, ALPH_ID);
        const pool2 = findPool(ALPH_ID, buy.id);
        if (pool1 && pool2) {
          const [b1, b2] = await Promise.all([balances(pool1.address), balances(pool2.address)]);
          const r1In  = b1.get(sell.id) || 0n;
          const r1Out = b1.get(ALPH_ID) || 0n;
          const mid = amountOut(amIn, r1In, r1Out);
          if (mid > 0n) {
            const r2In  = b2.get(ALPH_ID) || 0n;
            const r2Out = b2.get(buy.id)  || 0n;
            rawOut = amountOut(mid, r2In, r2Out);
            route = { type: 'multi-hop', path: `${sell.symbol} → ALPH → ${buy.symbol}`, intermediateAmount: mid.toString() };
          }
        }
      }

      if (rawOut <= 0n) return err('No liquidity available for this pair on Ayin DEX', 422);

      const { buyAmount, feeAmount } = applyFee(rawOut);
      const minBuy = (buyAmount * 97n) / 100n;

      const resp: Record<string, unknown> = {
        buyAmount: buyAmount.toString(),
        sellAmount, sellToken: sell.symbol, buyToken: buy.symbol,
        fees: { protocolFee: { amount: feeAmount.toString(), bps: FEE_BPS, recipient: FEE_RECIPIENT }, lpFee: { bps: 30, desc: '0.3% AMM LP fee (included)' } },
        minBuyAmount: minBuy.toString(),
        route,
        source: 'ayin-dex-onchain',
      };

      if (isQuote && taker) {
        resp.quoteData = {
          taker, sellTokenId: sell.id, buyTokenId: buy.id,
          sellAmount, buyAmount: buyAmount.toString(), minBuyAmount: minBuy.toString(),
          deadline: (Date.now() + 20 * 60 * 1000).toString(), route,
        };
      }

      return json(resp);
    } catch (e) {
      console.error('Reserve fetch error:', e);
      logEvent(FN_NAME, 'api_error', ip, { error: 'reserve_fetch_failed', message: String(e) }, 502);
      return err('Failed to query on-chain pool reserves', 502);
    }
  } catch (e) {
    console.error('Internal error:', e);
    logEvent(FN_NAME, 'internal_error', ip, { error: String(e) }, 500);
    return err('Internal server error', 500);
  }
});
