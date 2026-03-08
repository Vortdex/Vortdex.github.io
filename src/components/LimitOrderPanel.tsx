import { useState } from "react";
import { Shield, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const LimitOrderPanel = () => {
  const { t } = useI18n();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("3200.00");
  const [amount, setAmount] = useState("1.0");

  const total = (parseFloat(price || "0") * parseFloat(amount || "0")).toFixed(2);

  return (
    <section id="limit" className="py-16">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-display font-bold mb-1">{t("limit_title")} <span className="gradient-text">Orders</span></h2>
          <p className="text-muted-foreground font-mono text-xs">{t("limit_subtitle")}</p>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex rounded-lg bg-muted/50 p-0.5 mb-5">
            <button
              onClick={() => setSide("buy")}
              className={`flex-1 py-2 rounded-md font-mono font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                side === "buy"
                  ? "bg-primary/15 text-primary shadow-[inset_0_0_12px_hsl(150_100%_45%/0.1)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> Buy / Long
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`flex-1 py-2 rounded-md font-mono font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
                side === "sell"
                  ? "bg-destructive/15 text-destructive shadow-[inset_0_0_12px_hsl(0_75%_50%/0.1)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" /> Sell / Short
            </button>
          </div>

          <div className="mb-3">
            <label className="text-[10px] text-muted-foreground mb-1.5 block font-mono uppercase tracking-wider">{t("limit_price")}</label>
            <div className="bg-muted/40 rounded-lg p-3 flex items-center gap-3 border border-border/50 focus-within:border-primary/30 transition-colors">
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-transparent text-xl font-mono font-bold text-foreground outline-none w-full"
              />
              <span className="font-mono text-muted-foreground text-xs shrink-0">USDC</span>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-[10px] text-muted-foreground mb-1.5 block font-mono uppercase tracking-wider">{t("limit_amount")}</label>
            <div className="bg-muted/40 rounded-lg p-3 flex items-center gap-3 border border-border/50 focus-within:border-primary/30 transition-colors">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-transparent text-xl font-mono font-bold text-foreground outline-none w-full"
              />
              <span className="font-mono text-muted-foreground text-xs shrink-0">ETH</span>
            </div>
            <div className="flex gap-1.5 mt-2">
              {["25%", "50%", "75%", "100%"].map((pct) => (
                <button key={pct} className="flex-1 py-1 rounded-md bg-muted/40 text-[10px] font-mono text-muted-foreground hover:text-primary hover:bg-primary/8 border border-transparent hover:border-primary/15 transition-all">
                  {pct}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/20 border border-border/50 mb-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t("limit_total")}</span>
              <span className="font-mono font-bold text-foreground">{parseFloat(total).toLocaleString()} USDC</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t("limit_fee")}</span>
              <span className="font-mono text-[10px] text-muted-foreground">{(parseFloat(total) * 0.001).toFixed(2)} USDC</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-3 text-[10px] text-muted-foreground">
            <Shield className="w-3 h-3 text-primary" />
            <span>{t("limit_security")}</span>
          </div>

          <button className={`w-full py-3 rounded-lg font-mono font-bold text-sm transition-all ${
            side === "buy"
              ? "bg-primary text-primary-foreground hover:shadow-[0_0_30px_hsl(150_100%_45%/0.25)]"
              : "bg-destructive text-destructive-foreground hover:shadow-[0_0_30px_hsl(0_75%_50%/0.25)]"
          }`}>
            {side === "buy" ? "Buy" : "Sell"} ETH @ {parseFloat(price).toLocaleString()} USDC
          </button>
        </div>
      </div>
    </section>
  );
};

export default LimitOrderPanel;
