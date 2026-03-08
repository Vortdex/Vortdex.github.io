const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FEE_RECIPIENT = '0x401e2584ed1f4b0cc5d265fbbe0c917631dc2b2c';
const FEE_BPS = '10'; // 0.1% = 10 basis points

const VALID_CHAIN_IDS = [1, 42161, 137, 10, 8453];
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

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // Validate addresses
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

    // Validate sellAmount is a valid positive integer (wei)
    if (!SELL_AMOUNT_RE.test(sellAmount) || sellAmount === '0') {
      return new Response(
        JSON.stringify({ error: 'sellAmount must be a positive integer string (in wei)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate chainId
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
