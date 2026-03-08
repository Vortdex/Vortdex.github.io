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

    // Map chainId to 0x API subdomain
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

    const response = await fetch(`https://${baseUrl}/swap/permit2/quote?${params}`, {
      headers: {
        '0x-api-key': apiKey,
        '0x-version': '2',
      },
    });

    const data = await response.json();

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
