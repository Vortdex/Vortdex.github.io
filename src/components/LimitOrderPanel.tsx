import { useState } from "react";
import { Shield, Clock, TrendingUp, TrendingDown } from "lucide-react";

const LimitOrderPanel = () => {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("3200.00");
  const [amount, setAmount] = useState("1.0");

  const total = (parseFloat(price || "0") * parseFloat(amount || "0")).toFixed(2);

  return (
    <section id="limit" className="py-20">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Limit Orders</h2>
          <p className="text-muted-foreground font-mono text-sm">via Loopring ZK-Rollup Orderbook</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          {/* Buy/Sell toggle */}
          <div className="flex rounded-xl bg-muted/50 p-1 mb-6">
            <button
              onClick={() => setSide("buy")}
              className={`flex-1 py-2.5 rounded-lg font-mono font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                side === "buy"
                  ? "bg-primary/20 text-primary glow-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Buy / Long
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`flex-1 py-2.5 rounded-lg font-mono font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                side === "sell"
                  ? "bg-destructive/20 text-destructive"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingDown className="w-4 h-4" /> Sell / Short
            </button>
          </div>

          {/* Price input */}
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Limit-Preis (USDC)</label>
            <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3">
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-transparent text-2xl font-mono font-bold text-foreground outline-none w-full"
              />
              <span className="font-mono text-muted-foreground text-sm shrink-0">USDC</span>
            </div>
          </div>

          {/* Amount input */}
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Menge (ETH)</label>
            <div className="bg-muted/50 rounded-xl p-4 flex items-center gap-3">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-transparent text-2xl font-mono font-bold text-foreground outline-none w-full"
              />
              <span className="font-mono text-muted-foreground text-sm shrink-0">ETH</span>
            </div>
            <div className="flex gap-2 mt-2">
              {["25%", "50%", "75%", "100%"].map((pct) => (
                <button key={pct} className="flex-1 py-1.5 rounded-md bg-muted/50 text-xs font-mono text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                  {pct}
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-mono font-bold text-foreground">{parseFloat(total).toLocaleString()} USDC</span>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>Gesichert via Loopring ZK-Rollup — Ethereum L1 Sicherheit</span>
          </div>

          <button className={`w-full py-4 rounded-xl font-mono font-bold text-lg transition-all ${
            side === "buy"
              ? "bg-primary text-primary-foreground hover:shadow-[0_0_40px_hsl(160_100%_50%/0.3)]"
              : "bg-destructive text-destructive-foreground hover:shadow-[0_0_40px_hsl(0_80%_55%/0.3)]"
          }`}>
            {side === "buy" ? "Buy" : "Sell"} ETH @ {parseFloat(price).toLocaleString()} USDC
          </button>
        </div>
      </div>
    </section>
  );
};

export default LimitOrderPanel;
