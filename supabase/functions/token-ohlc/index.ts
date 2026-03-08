/**
 * token-ohlc — Returns OHLC (candlestick) data for a token from CoinGecko.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Map token symbols to CoinGecko IDs
const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum', WETH: 'ethereum',
  BTC: 'bitcoin', WBTC: 'wrapped-bitcoin',
  USDC: 'usd-coin', 'USDC.E': 'usd-coin',
  USDT: 'tether',
  DAI: 'dai',
  MATIC: 'matic-network',
  ARB: 'arbitrum',
  OP: 'optimism',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  LDO: 'lido-dao',
  WLD: 'worldcoin-wld',
  ALPH: 'alephium',
  AYIN: 'ayin',
  cbBTC: 'coinbase-wrapped-btc',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { symbol, days } = await req.json();
    if (!symbol || typeof symbol !== 'string') {
      return new Response(JSON.stringify({ error: 'symbol is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const coinId = COINGECKO_IDS[symbol.toUpperCase()] || COINGECKO_IDS[symbol];
    if (!coinId) {
      return new Response(JSON.stringify({ error: `Unknown token: ${symbol}`, ohlc: [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const d = typeof days === 'number' && days > 0 ? Math.min(days, 30) : 1;
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${d}`;

    const resp = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error('CoinGecko error:', resp.status, text);
      return new Response(JSON.stringify({ error: 'Failed to fetch OHLC data', ohlc: [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // CoinGecko returns [[timestamp, open, high, low, close], ...]
    const raw = await resp.json();
    const ohlc = (raw || []).map((c: number[]) => ({
      time: c[0],
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
    }));

    return new Response(JSON.stringify({ symbol: symbol.toUpperCase(), coinId, days: d, ohlc }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('OHLC error:', e);
    return new Response(JSON.stringify({ error: 'Internal error', ohlc: [] }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
