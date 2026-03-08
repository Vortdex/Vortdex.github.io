const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── In-memory IP rate limiter (resets on cold start) ────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // max requests per window per IP

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

// Periodically clean stale buckets (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of rateBuckets) { if (now > b.resetAt) rateBuckets.delete(ip); }
}, 300_000);

// ─── Config ──────────────────────────────────────────────────
const FEE_RECIPIENT = '0x03D7BD4795141Efd0be2A24678CaA13bdd5E1F13';
const FEE_BPS = '10'; // 0.1% = 10 basis points

const VALID_CHAIN_IDS = [1, 42161, 137, 10, 8453, 480];
const ETH_ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
const SELL_AMOUNT_RE = /^[0-9]{1,78}$/; // uint256 max is 78 digits

function isValidAddress(addr: string): boolean {
  return ETH_ADDRESS_RE.test(addr) || addr.toLowerCase() === NATIVE_ETH.toLowerCase();
}

Deno.serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('cf-connecting-ip') || 'unknown';
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' } }
    );
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { sellToken, buyToken, sellAmount, chainId, taker } = body;

    // Validate required params
    if (typeof sellToken !== 'string' || typeof buyToken !== 'string' || typeof sellAmount !== 'string') {
      return new Response(
        JSON.stringify({ error: 'sellToken, buyToken (string) and sellAmount (string) are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isValidAddress(sellToken)) {
      return new Response(
        JSON.stringify({ error: 'Invalid sellToken address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!isValidAddress(buyToken)) {
      return new Response(
        JSON.stringify({ error: 'Invalid buyToken address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SELL_AMOUNT_RE.test(sellAmount) || sellAmount === '0') {
      return new Response(
        JSON.stringify({ error: 'sellAmount must be a positive integer string (in wei)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const chain = typeof chainId === 'number' ? chainId : 1;
    if (!VALID_CHAIN_IDS.includes(chain)) {
      return new Response(
        JSON.stringify({ error: `Unsupported chainId. Supported: ${VALID_CHAIN_IDS.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate taker if provided
    if (taker !== undefined && taker !== null) {
      if (typeof taker !== 'string' || !ETH_ADDRESS_RE.test(taker)) {
        return new Response(
          JSON.stringify({ error: 'Invalid taker address' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const apiKey = Deno.env.get('ZEROX_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params = new URLSearchParams({
      chainId: String(chain),
      sellToken,
      buyToken,
      sellAmount,
      swapFeeRecipient: FEE_RECIPIENT,
      swapFeeBps: FEE_BPS,
      swapFeeToken: buyToken,
      ...(taker && typeof taker === 'string' && { taker }),
    });

    const url = `https://api.0x.org/swap/permit2/price?${params}`;

    const response = await fetch(url, {
      headers: {
        '0x-api-key': apiKey,
        '0x-version': 'v2',
      },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return new Response(
        JSON.stringify({ error: '0x API returned invalid response' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
