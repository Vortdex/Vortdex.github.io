import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

const stats = [
  { label: "Total Value Locked", value: "$847.2M", icon: DollarSign, change: "+12.4%" },
  { label: "24h Volumen", value: "$124.5M", icon: BarChart3, change: "+8.7%" },
  { label: "Aktive Nutzer", value: "42,891", icon: Users, change: "+5.2%" },
  { label: "Avg. Spread", value: "0.04%", icon: TrendingUp, change: "-2.1%" },
];

const pools = [
  { pair: "ETH/USDC", tvl: "$245.8M", apy: "4.2%", source: "OpenDEX", volume: "$45.2M" },
  { pair: "ETH/USDT", tvl: "$189.3M", apy: "3.8%", source: "Loopring", volume: "$38.1M" },
  { pair: "WBTC/ETH", tvl: "$134.7M", apy: "2.9%", source: "OpenDEX", volume: "$28.4M" },
  { pair: "LRC/ETH", tvl: "$67.2M", apy: "8.1%", source: "Loopring", volume: "$12.7M" },
  { pair: "DAI/USDC", tvl: "$98.4M", apy: "1.4%", source: "OpenDEX", volume: "$22.3M" },
];

const LiquiditySection = () => {
  return (
    <section id="liquidity" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Aggregierte Liquidität</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Kombinierte Tiefe aus Loopring Orderbooks und OpenDEX AMM-Pools.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-5 text-center">
              <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="font-mono font-bold text-2xl text-foreground mb-1">{s.value}</div>
              <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
              <span className={`text-xs font-mono ${s.change.startsWith('+') ? 'text-primary' : 'text-destructive'}`}>
                {s.change}
              </span>
            </div>
          ))}
        </div>

        {/* Pools table */}
        <div className="glass-card rounded-2xl overflow-hidden max-w-4xl mx-auto">
          <div className="p-4 border-b border-border">
            <h3 className="font-mono font-semibold text-foreground">Top Liquidity Pools</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-mono text-muted-foreground border-b border-border">
                  <th className="text-left p-4">Paar</th>
                  <th className="text-right p-4">TVL</th>
                  <th className="text-right p-4">APY</th>
                  <th className="text-right p-4">24h Vol</th>
                  <th className="text-right p-4">Quelle</th>
                </tr>
              </thead>
              <tbody>
                {pools.map((pool) => (
                  <tr key={pool.pair} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-mono font-semibold text-foreground">{pool.pair}</td>
                    <td className="p-4 text-right font-mono text-foreground">{pool.tvl}</td>
                    <td className="p-4 text-right font-mono text-primary">{pool.apy}</td>
                    <td className="p-4 text-right font-mono text-muted-foreground">{pool.volume}</td>
                    <td className="p-4 text-right">
                      <span className={`text-xs font-mono px-2 py-1 rounded border ${
                        pool.source === "Loopring" 
                          ? "text-primary bg-primary/10 border-primary/20"
                          : "text-secondary bg-secondary/10 border-secondary/20"
                      }`}>
                        {pool.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiquiditySection;
