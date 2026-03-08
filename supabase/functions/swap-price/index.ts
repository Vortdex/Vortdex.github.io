const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

    const chainMap: Record<number, string> = {
      1: 'api.0x.org',
      42161: 'arbitrum.api.0x.org',
      137: 'polygon.api.0x.org',
      10: 'optimism.api.0x.org',
      8453: 'base.api.0x.org',
    };

    const chain = chainId || 1;
    const baseUrl = chainMap[chain] || 'api.0x.org';

    const params = new URLSearchParams({
      sellToken,
      buyToken,
      sellAmount,
      ...(taker && { taker }),
    });

    const url = `https://${baseUrl}/swap/permit2/price?${params}`;
    console.log('Fetching 0x price:', url);

    const response = await fetch(url, {
      headers: {
        '0x-api-key': apiKey,
        '0x-version': '2',
      },
    });

    const text = await response.text();
    console.log('0x API response status:', response.status, 'body:', text.substring(0, 500));

    // Try to parse as JSON, return raw text error if not
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
