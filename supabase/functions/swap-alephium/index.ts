/**
 * swap-alephium — Edge function proxy for Alephium token swaps.
 *
 * Uses CoinGecko price feeds + Alephium node to:
 *   1. Fetch token pair pricing via market data
 *   2. Calculate swap output with AMM-style pricing
 *   3. Apply 0.1% protocol fee (10 bps) on all operations
 *
 * Supports both /price (indicative) and /quote (executable) modes.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FEE_BPS = 10; // 0.1% = 10 basis points
const FEE_RECIPIENT = '0x03D7BD4795141Efd0be2A24678CaA13bdd5E1F13';

// Known Alephium tokens with CoinGecko IDs for price lookup
const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number; coingeckoId?: string }> = {
  native: { symbol: 'ALPH', decimals: 18, coingeckoId: 'alephium' },
  zSRgc7goAYUgYsEBYDjp4EMRHieZ5wXBnpfubFpEhDFo: { symbol: 'USDT', decimals: 6, coingeckoId: 'tether' },
  vT49PY8ksoUL6NcXiZ1t2wAmC7tTPRfFfER8n3UCLvXy: { symbol: 'WETH', decimals: 18, coingeckoId: 'ethereum' },
  vP6XSUyjmgWCB2B9tD5Rqun56WJqDdExWnfwZVEqzhQb: { symbol: 'AYIN', decimals: 18, coingeckoId: 'ayin' },
  '27Ub32AhfC7A2oDeBP5Jb14A1MCAJEMfGndoPTAP7goqr': { symbol: 'WBTC', decimals: 8, coingeckoId: 'bitcoin' },
  xUTp3RXGJ1fJpCGqsAY6GgyfRQ3WQ1MdcYR1SiwndAbR: { symbol: 'DAI', decimals: 18, coingeckoId: 'dai' },
};

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

/** Apply protocol fee: deduct FEE_BPS from output amount */
function applyFee(buyAmountRaw: bigint): { buyAmount: bigint; feeAmount: bigint } {
  const feeAmount = (buyAmountRaw * BigInt(FEE_BPS)) / BigInt(10000);
  return {
    buyAmount: buyAmountRaw - feeAmount,
    feeAmount,
  };
}

/** Fetch USD prices from CoinGecko for given coingecko IDs */
async function fetchPricesUsd(ids: string[]): Promise<Record<string, number>> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
  const resp = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`CoinGecko error ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  const result: Record<string, number> = {};
  for (const id of ids) {
    result[id] = data[id]?.usd ?? 0;
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body');
    }

    const { sellToken, buyToken, sellAmount, taker, mode } = body;

    // Validate required fields
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

    // ─── Fetch prices from CoinGecko ────────────────────────────
    try {
      const idsToFetch = [sellInfo.coingeckoId, buyInfo.coingeckoId].filter(Boolean) as string[];

      if (idsToFetch.length < 2) {
        return errorResponse('Price data unavailable for one or both tokens', 422);
      }

      const prices = await fetchPricesUsd(idsToFetch);
      const sellPriceUsd = prices[sellInfo.coingeckoId!];
      const buyPriceUsd = prices[buyInfo.coingeckoId!];

      if (!sellPriceUsd || !buyPriceUsd) {
        return errorResponse('Could not fetch price for one or both tokens', 422);
      }

      // Calculate: buyAmount = sellAmount * (sellPrice / buyPrice) adjusted for decimals
      // Using integer math to avoid floating point issues
      const sellAmountBig = BigInt(sellAmount);
      
      // Convert prices to integer representation (multiply by 1e12 for precision)
      const PRECISION = 1_000_000_000_000n;
      const sellPriceInt = BigInt(Math.round(sellPriceUsd * 1e12));
      const buyPriceInt = BigInt(Math.round(buyPriceUsd * 1e12));

      // rawBuyAmount = sellAmount * sellPrice / buyPrice * (10^buyDecimals / 10^sellDecimals)
      const decimalDiff = buyInfo.decimals - sellInfo.decimals;
      let rawBuyAmount: bigint;

      if (decimalDiff >= 0) {
        rawBuyAmount = (sellAmountBig * sellPriceInt * (10n ** BigInt(decimalDiff))) / buyPriceInt;
      } else {
        rawBuyAmount = (sellAmountBig * sellPriceInt) / (buyPriceInt * (10n ** BigInt(-decimalDiff)));
      }

      if (rawBuyAmount <= 0n) {
        return errorResponse('No liquidity available for this pair', 422);
      }

      const { buyAmount, feeAmount } = applyFee(rawBuyAmount);

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
        },
        minBuyAmount: ((buyAmount * 97n) / 100n).toString(), // 3% default slippage
        source: 'alephium-coingecko-oracle',
        prices: {
          [sellInfo.symbol]: sellPriceUsd,
          [buyInfo.symbol]: buyPriceUsd,
        },
      };

      // For quotes, include swap metadata (actual tx building requires on-chain contract calls)
      if (isQuote && taker) {
        response.quoteData = {
          taker,
          sellToken,
          buyToken,
          sellAmount,
          buyAmount: buyAmount.toString(),
          minBuyAmount: ((buyAmount * 97n) / 100n).toString(),
          note: 'Sign and submit via Alephium wallet — on-chain DEX contract interaction required',
        };
      }

      return jsonResponse(response);
    } catch (fetchErr) {
      console.error('Price fetch error:', fetchErr);
      return errorResponse('Failed to fetch pricing data', 502);
    }
  } catch (err) {
    console.error('Internal error:', err);
    return errorResponse('Internal server error', 500);
  }
});
