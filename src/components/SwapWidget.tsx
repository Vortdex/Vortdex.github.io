import { useState, useEffect, useCallback } from "react";
import { ArrowDownUp, ChevronDown, Zap, Info, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const tokens = [
  { symbol: "ETH", name: "Ethereum", address: NATIVE_ETH, decimals: 18 },
  { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
  { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
  { symbol: "DAI", name: "Dai", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
  { symbol: "WETH", name: "Wrapped Ether", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
];

const SwapWidget = () => {
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [fromAmount, setFromAmount] = useState("1.0");
  const [toAmount, setToAmount] = useState("");
  const [rate, setRate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    const parsedAmount = parseFloat(fromAmount || "0");
    if (parsedAmount <= 0 || fromToken.address === toToken.address) {
      setToAmount("");
      setRate(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sellAmount = BigInt(Math.floor(parsedAmount * 10 ** fromToken.decimals)).toString();

      const { data, error: fnError } = await supabase.functions.invoke("swap-price", {
        body: {
          sellToken: fromToken.address,
          buyToken: toToken.address,
          sellAmount,
          chainId: 1,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      if (data?.buyAmount) {
        const buyAmountNum = Number(data.buyAmount) / 10 ** toToken.decimals;
        setToAmount(buyAmountNum.toLocaleString("en-US", { maximumFractionDigits: 6 }));

        const rateValue = buyAmountNum / parsedAmount;
        setRate(rateValue.toLocaleString("en-US", { maximumFractionDigits: 6 }));
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch price");
      setToAmount("");
      setRate(null);
    } finally {
      setLoading(false);
    }
  }, [fromAmount, fromToken, toToken]);

  useEffect(() => {
    const timer = setTimeout(fetchPrice, 500);
    return () => clearTimeout(timer);
  }, [fetchPrice]);

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  return (
    <section id="swap" className="py-20">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Instant Swap</h2>
          <p className="text-muted-foreground font-mono text-sm">via 0x Aggregator — Best Price Routing</p>
        </div>

        <div className="glass-card rounded-2xl p-6 pulse-glow">
          {/* From */}
          <div className="bg-muted/50 rounded-xl p-4 mb-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Von</span>
              <span className="font-mono">{fromToken.symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="bg-transparent text-3xl font-mono font-bold text-foreground outline-none w-full"
                placeholder="0.0"
              />
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/30 transition-all shrink-0">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-mono font-bold text-primary">
                  {fromToken.symbol[0]}
                </div>
                <span className="font-mono font-semibold text-foreground">{fromToken.symbol}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Swap button */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={handleSwapTokens}
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:border-primary/50 hover:rotate-180 transition-all duration-300"
            >
              <ArrowDownUp className="w-4 h-4 text-primary" />
            </button>
          </div>

          {/* To */}
          <div className="bg-muted/50 rounded-xl p-4 mt-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Zu</span>
              <span className="font-mono">{toToken.symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center w-full">
                {loading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <input
                    type="text"
                    value={toAmount}
                    readOnly
                    className="bg-transparent text-3xl font-mono font-bold text-foreground outline-none w-full"
                    placeholder="0.0"
                  />
                )}
              </div>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/30 transition-all shrink-0">
                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-mono font-bold text-secondary">
                  {toToken.symbol[0]}
                </div>
                <span className="font-mono font-semibold text-foreground">{toToken.symbol}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
              {error}
            </div>
          )}

          {/* Route info */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Beste Route</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary border border-primary/20">
                  0x Aggregator
                </span>
              </div>
            </div>
            {rate && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" /> Rate
                </span>
                <span className="font-mono text-foreground">1 {fromToken.symbol} = {rate} {toToken.symbol}</span>
              </div>
            )}
          </div>

          {/* Swap button */}
          <button
            disabled={loading || !toAmount}
            className="w-full mt-4 py-4 rounded-xl bg-primary text-primary-foreground font-mono font-bold text-lg hover:shadow-[0_0_40px_hsl(160_100%_50%/0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Swap ausführen
          </button>
        </div>
      </div>
    </section>
  );
};

export default SwapWidget;
