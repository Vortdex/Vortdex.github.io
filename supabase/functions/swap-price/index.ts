const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FEE_RECIPIENT = '0x401e2584ed1f4b0cc5d265fbbe0c917631dc2b2c';
const FEE_BPS = '10'; // 0.1% = 10 basis points

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sellToken, buyToken, sellAmount, chainId, taker } = await req.json();

    if (!sellToken || !buyToken || !sellAmount) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: sellToken, buyToken, sellAmount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('ZEROX_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const chain = chainId || 1;

    const params = new URLSearchParams({
      chainId: String(chain),
      sellToken,
      buyToken,
      sellAmount,
      swapFeeRecipient: FEE_RECIPIENT,
      swapFeeBps: FEE_BPS,
      swapFeeToken: buyToken,
      ...(taker && { taker }),
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
        JSON.stringify({ error: `0x API error: ${text.substring(0, 200)}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
