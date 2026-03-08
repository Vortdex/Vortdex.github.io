import { useState } from "react";
import { ArrowDownUp, ChevronDown, Zap, Info } from "lucide-react";

const tokens = [
  { symbol: "ETH", name: "Ethereum", balance: "2.4521" },
  { symbol: "USDC", name: "USD Coin", balance: "5,230.00" },
  { symbol: "LRC", name: "Loopring", balance: "12,450" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", balance: "0.0845" },
  { symbol: "DAI", name: "Dai", balance: "1,890.00" },
];

const SwapWidget = () => {
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [fromAmount, setFromAmount] = useState("1.0");
  const [route, setRoute] = useState<"opendex" | "loopring" | "split">("opendex");

  const mockRate = 3245.67;
  const toAmount = (parseFloat(fromAmount || "0") * mockRate).toFixed(2);

  return (
    <section id="swap" className="py-20">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Instant Swap</h2>
          <p className="text-muted-foreground font-mono text-sm">via OpenDEX AMM-Pools</p>
        </div>

        <div className="glass-card rounded-2xl p-6 pulse-glow">
          {/* From */}
          <div className="bg-muted/50 rounded-xl p-4 mb-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Von</span>
              <span>Balance: {fromToken.balance}</span>
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
            <button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:border-primary/50 hover:rotate-180 transition-all duration-300">
              <ArrowDownUp className="w-4 h-4 text-primary" />
            </button>
          </div>

          {/* To */}
          <div className="bg-muted/50 rounded-xl p-4 mt-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Zu</span>
              <span>Balance: {toToken.balance}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={toAmount}
                readOnly
                className="bg-transparent text-3xl font-mono font-bold text-foreground outline-none w-full"
                placeholder="0.0"
              />
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/30 transition-all shrink-0">
                <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-mono font-bold text-secondary">
                  {toToken.symbol[0]}
                </div>
                <span className="font-mono font-semibold text-foreground">{toToken.symbol}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Route info */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Beste Route</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary border border-primary/20">
                  OpenDEX
                </span>
                <span className="text-xs text-muted-foreground">-0.3% Fee</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" /> Rate
              </span>
              <span className="font-mono text-foreground">1 {fromToken.symbol} = {mockRate.toLocaleString()} {toToken.symbol}</span>
            </div>
          </div>

          {/* Swap button */}
          <button className="w-full mt-4 py-4 rounded-xl bg-primary text-primary-foreground font-mono font-bold text-lg hover:shadow-[0_0_40px_hsl(160_100%_50%/0.3)] transition-all">
            Swap ausführen
          </button>
        </div>
      </div>
    </section>
  );
};

export default SwapWidget;
