/**
 * swap-alephium — Edge function for Alephium DEX swaps using on-chain AMM pool reserves.
 *
 * Queries Ayin DEX AMM pool balances directly from the Alephium mainnet node,
 * then calculates swap output using the constant-product (x*y=k) formula.
 * Applies a 0.1% protocol fee (10 bps) on all swaps.
 *
 * Supports /price (indicative) and /quote (executable parameters) modes.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FEE_BPS = 10; // 0.1% = 10 basis points
const FEE_RECIPIENT = '0x03D7BD4795141Efd0be2A24678CaA13bdd5E1F13';

const NODE_URL = 'https://node.mainnet.alephium.org';
const ALPH_TOKEN_ID = '0000000000000000000000000000000000000000000000000000000000000000';

// ─── Token Registry ──────────────────────────────────────────
interface TokenMeta {
  symbol: string;
  decimals: number;
  /** On-chain token ID (hex). 'native' maps to ALPH_TOKEN_ID */
  tokenId: string;
}

const KNOWN_TOKENS: Record<string, TokenMeta> = {
  native:   { symbol: 'ALPH', decimals: 18, tokenId: ALPH_TOKEN_ID },
  // Bridged USDT on Alephium
  zSRgc7goAYUgYsEBYDjp4EMRHieZ5wXBnpfubFpEhDFo:
    { symbol: 'USDT', decimals: 6,  tokenId: 'zSRgc7goAYUgYsEBYDjp4EMRHieZ5wXBnpfubFpEhDFo' },
  vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy:
    { symbol: 'WETH', decimals: 18, tokenId: 'vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy' },
  vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb:
    { symbol: 'AYIN', decimals: 18, tokenId: 'vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb' },
  '27Ub32AhfC7A2oDeBP5Jb14A1MCAJEMfGndoPTAP7goqr':
    { symbol: 'WBTC', decimals: 8,  tokenId: '27Ub32AhfC7A2oDeBP5Jb14A1MCAJEMfGndoPTAP7goqr' },
  xUTp3RXGJ1fJpCGqsAY6GgyfRQ3WQ1MdcYR1SiwndAbR:
    { symbol: 'DAI',  decimals: 18, tokenId: 'xUTp3RXGJ1fJpCGqsAY6GgyfRQ3WQ1MdcYR1SiwndAbR' },
};

// ─── Ayin AMM Pool Addresses (mainnet, from DefiLlama) ───────
// Each pool holds two assets: ALPH (native) + one token
interface PoolInfo {
  address: string;
  token0Id: string; // ALPH
  token1Id: string; // the paired token
  token1Key: string; // key in KNOWN_TOKENS
}

const AMM_POOLS: PoolInfo[] = [
  {
    address: '2A5R8KZQ3rhKYrW7bAS4JTjY9FCFLJg6HjQpqSFZBqACX',
    token0Id: ALPH_TOKEN_ID,
    token1Id: 'zSRgc7goAYUgYsEBYDjp4EMRHieZ5wXBnpfubFpEhDFo',
    token1Key: 'zSRgc7goAYUgYsEBYDjp4EMRHieZ5wXBnpfubFpEhDFo',
  }, // ALPH/USDT
  {
    address: 'yXMFxdoKcE86W9NAyajc8Z3T3k2f5FGiHqHtuA69DYT1',
    token0Id: ALPH_TOKEN_ID,
    token1Id: 'vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy',
    token1Key: 'vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy',
  }, // ALPH/WETH
  {
    address: '28XY326TxvSekaAwiWDLFg2QBRfacSga8dyNJCYGUYNbq',
    token0Id: ALPH_TOKEN_ID,
    token1Id: '27Ub32AhfC7A2oDeBP5Jb14A1MCAJEMfGndoPTAP7goqr',
    token1Key: '27Ub32AhfC7A2oDeBP5Jb14A1MCAJEMfGndoPTAP7goqr',
  }, // ALPH/WBTC
  {
    address: '25ywM8iGxKpZWuGA5z6DXKGcZCXtPBmnbQyJEsjvjjWTy',
    token0Id: ALPH_TOKEN_ID,
    token1Id: 'vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb',
    token1Key: 'vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb',
  }, // ALPH/AYIN
];

// ─── Helpers ─────────────────────────────────────────────────

const SELL_AMOUNT_RE = /^[0-9]{1,78}$/;

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

function applyFee(buyAmountRaw: bigint): { buyAmount: bigint; feeAmount: bigint } {
  const feeAmount = (buyAmountRaw * BigInt(FEE_BPS)) / 10000n;
  return { buyAmount: buyAmountRaw - feeAmount, feeAmount };
}

/** Uniswap V2 / Ayin AMM getAmountOut: 0.3% LP fee */
function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const amountInWithFee = 997n * amountIn;
  const numerator = amountInWithFee * reserveOut;
  const denominator = amountInWithFee + 1000n * reserveIn;
  return numerator / denominator;
}

/** Fetch ALPH balance (native) for a contract address */
async function getAlphBalance(address: string): Promise<bigint> {
  const resp = await fetch(`${NODE_URL}/addresses/${address}/balance`);
  if (!resp.ok) { await resp.text(); return 0n; }
  const data = await resp.json();
  return BigInt(data.balance || '0');
}

/** Fetch token balances for a contract address */
async function getTokenBalances(address: string): Promise<Map<string, bigint>> {
  const resp = await fetch(`${NODE_URL}/addresses/${address}/balance`);
  if (!resp.ok) { await resp.text(); return new Map(); }
  const data = await resp.json();
  const map = new Map<string, bigint>();
  // Native ALPH
  map.set(ALPH_TOKEN_ID, BigInt(data.balance || '0'));
  // Token balances
  if (data.tokenBalances) {
    for (const tb of data.tokenBalances) {
      map.set(tb.id, BigInt(tb.amount || '0'));
    }
  }
  return map;
}

/** Find the best pool for a given token pair and return reserves */
async function getPoolReserves(
  sellTokenId: string,
  buyTokenId: string
): Promise<{ reserveIn: bigint; reserveOut: bigint; pool: PoolInfo } | null> {
  // Direct pool: both tokens must be in the same pool
  for (const pool of AMM_POOLS) {
    const ids = [pool.token0Id, pool.token1Id];
    if (ids.includes(sellTokenId) && ids.includes(buyTokenId)) {
      const balances = await getTokenBalances(pool.address);
      const reserveIn = balances.get(sellTokenId) || 0n;
      const reserveOut = balances.get(buyTokenId) || 0n;
      if (reserveIn > 0n && reserveOut > 0n) {
        return { reserveIn, reserveOut, pool };
      }
    }
  }

  // Multi-hop through ALPH: sellToken→ALPH→buyToken
  if (sellTokenId !== ALPH_TOKEN_ID && buyTokenId !== ALPH_TOKEN_ID) {
    // Find pool for sellToken/ALPH
    const sellPool = AMM_POOLS.find(p => p.token1Id === sellTokenId);
    const buyPool = AMM_POOLS.find(p => p.token1Id === buyTokenId);
    if (sellPool && buyPool) {
      return null; // multi-hop handled separately
    }
  }

  return null;
}

/** Multi-hop swap: sellToken → ALPH → buyToken */
async function getMultiHopAmountOut(
  sellTokenId: string,
  buyTokenId: string,
  amountIn: bigint
): Promise<{ amountOut: bigint; intermediateAmount: bigint; hop1Pool: string; hop2Pool: string } | null> {
  if (sellTokenId === ALPH_TOKEN_ID || buyTokenId === ALPH_TOKEN_ID) return null;

  const sellPool = AMM_POOLS.find(p => p.token1Id === sellTokenId);
  const buyPool = AMM_POOLS.find(p => p.token1Id === buyTokenId);
  if (!sellPool || !buyPool) return null;

  // Hop 1: sellToken → ALPH
  const balances1 = await getTokenBalances(sellPool.address);
  const reserveSellIn = balances1.get(sellTokenId) || 0n;
  const reserveAlphOut = balances1.get(ALPH_TOKEN_ID) || 0n;
  if (reserveSellIn <= 0n || reserveAlphOut <= 0n) return null;
  const alphAmount = getAmountOut(amountIn, reserveSellIn, reserveAlphOut);
  if (alphAmount <= 0n) return null;

  // Hop 2: ALPH → buyToken
  const balances2 = await getTokenBalances(buyPool.address);
  const reserveAlphIn = balances2.get(ALPH_TOKEN_ID) || 0n;
  const reserveBuyOut = balances2.get(buyTokenId) || 0n;
  if (reserveAlphIn <= 0n || reserveBuyOut <= 0n) return null;
  const finalAmount = getAmountOut(alphAmount, reserveAlphIn, reserveBuyOut);

  return {
    amountOut: finalAmount,
    intermediateAmount: alphAmount,
    hop1Pool: sellPool.address,
    hop2Pool: buyPool.address,
  };
}

// ─── Main Handler ────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return errorResponse('Invalid JSON body'); }

    const { sellToken, buyToken, sellAmount, taker, mode } = body;

    if (typeof sellToken !== 'string' || typeof buyToken !== 'string' || typeof sellAmount !== 'string') {
      return errorResponse('sellToken, buyToken (string) and sellAmount (string) are required');
    }
    if (!SELL_AMOUNT_RE.test(sellAmount) || sellAmount === '0') {
      return errorResponse('sellAmount must be a positive integer string');
    }

    const sellInfo = KNOWN_TOKENS[sellToken];
    const buyInfo = KNOWN_TOKENS[buyToken];
    if (!sellInfo) return errorResponse(`Unknown sellToken: ${sellToken}`);
    if (!buyInfo) return errorResponse(`Unknown buyToken: ${buyToken}`);
    if (sellToken === buyToken) return errorResponse('sellToken and buyToken must be different');

    const isQuote = mode === 'quote';
    if (isQuote && (!taker || typeof taker !== 'string')) {
      return errorResponse('A valid taker address is required for quotes');
    }

    const sellTokenId = sellInfo.tokenId;
    const buyTokenId = buyInfo.tokenId;
    const amountIn = BigInt(sellAmount);

    try {
      let rawBuyAmount = 0n;
      let route: Record<string, unknown> = {};

      // Try direct pool first
      const directPool = await getPoolReserves(sellTokenId, buyTokenId);
      if (directPool && directPool.reserveIn > 0n) {
        rawBuyAmount = getAmountOut(amountIn, directPool.reserveIn, directPool.reserveOut);
        route = {
          type: 'direct',
          pool: directPool.pool.address,
          reserveIn: directPool.reserveIn.toString(),
          reserveOut: directPool.reserveOut.toString(),
        };
      } else {
        // Try multi-hop through ALPH
        const multiHop = await getMultiHopAmountOut(sellTokenId, buyTokenId, amountIn);
        if (multiHop && multiHop.amountOut > 0n) {
          rawBuyAmount = multiHop.amountOut;
          route = {
            type: 'multi-hop',
            path: `${sellInfo.symbol} → ALPH → ${buyInfo.symbol}`,
            hop1Pool: multiHop.hop1Pool,
            hop2Pool: multiHop.hop2Pool,
            intermediateAmount: multiHop.intermediateAmount.toString(),
          };
        }
      }

      if (rawBuyAmount <= 0n) {
        return errorResponse('No liquidity available for this pair on Ayin DEX', 422);
      }

      const { buyAmount, feeAmount } = applyFee(rawBuyAmount);
      const minBuyAmount = (buyAmount * 97n) / 100n; // 3% default slippage

      const response: Record<string, unknown> = {
        buyAmount: buyAmount.toString(),
        sellAmount,
        sellToken,
        buyToken,
        fees: {
          protocolFee: {
            amount: feeAmount.toString(),
            bps: FEE_BPS,
            recipient: FEE_RECIPIENT,
          },
          lpFee: {
            description: '0.3% AMM LP fee (included in price)',
            bps: 30,
          },
        },
        minBuyAmount: minBuyAmount.toString(),
        route,
        source: 'ayin-dex-onchain',
      };

      // For quotes, include swap execution parameters
      if (isQuote && taker) {
        response.quoteData = {
          taker,
          sellToken,
          buyToken,
          sellTokenId,
          buyTokenId,
          sellAmount,
          buyAmount: buyAmount.toString(),
          minBuyAmount: minBuyAmount.toString(),
          route,
          // Deadline: 20 minutes from now
          deadline: (Date.now() + 20 * 60 * 1000).toString(),
          note: 'Execute swap via Alephium wallet using Ayin DEX SwapMinOut script',
        };
      }

      return jsonResponse(response);
    } catch (fetchErr) {
      console.error('On-chain reserve fetch error:', fetchErr);
      return errorResponse('Failed to query on-chain pool reserves', 502);
    }
  } catch (err) {
    console.error('Internal error:', err);
    return errorResponse('Internal server error', 500);
  }
});
