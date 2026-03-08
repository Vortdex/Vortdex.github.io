import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const pools = [
  { pair: "ETH/USDC", tvl: "$245.8M", apy: "4.2%", source: "OpenDEX", volume: "$45.2M" },
  { pair: "ETH/USDT", tvl: "$189.3M", apy: "3.8%", source: "Loopring", volume: "$38.1M" },
  { pair: "WBTC/ETH", tvl: "$134.7M", apy: "2.9%", source: "OpenDEX", volume: "$28.4M" },
  { pair: "LRC/ETH", tvl: "$67.2M", apy: "8.1%", source: "Loopring", volume: "$12.7M" },
  { pair: "DAI/USDC", tvl: "$98.4M", apy: "1.4%", source: "OpenDEX", volume: "$22.3M" },
];

const LiquiditySection = () => {
  const { t } = useI18n();

  const stats = [
    { label: "TVL", value: "$847.2M", icon: DollarSign, change: "+12.4%" },
    { label: "24h Vol", value: "$124.5M", icon: BarChart3, change: "+8.7%" },
    { label: t("liq_users"), value: "42,891", icon: Users, change: "+5.2%" },
    { label: "Spread", value: "0.04%", icon: TrendingUp, change: "-2.1%" },
  ];

  return (
    <section id="liquidity" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">{t("liq_title_1")} <span className="gradient-text">{t("liq_title_2")}</span></h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t("liq_subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-3xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="glass-card rounded-lg p-4 text-center">
              <s.icon className="w-4 h-4 text-secondary mx-auto mb-1.5 opacity-70" />
              <div className="font-mono font-bold text-lg text-foreground">{s.value}</div>
              <div className="text-[10px] text-muted-foreground mb-0.5">{s.label}</div>
              <span className={`text-[10px] font-mono ${s.change.startsWith('+') ? 'text-primary' : 'text-destructive'}`}>
                {s.change}
              </span>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-xl overflow-hidden max-w-3xl mx-auto">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="font-mono font-semibold text-sm text-foreground">{t("liq_top_pools")}</h3>
            <span className="text-[10px] text-muted-foreground font-mono">Live</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-mono text-muted-foreground border-b border-border/50 uppercase tracking-wider">
                  <th className="text-left px-4 py-2.5">{t("liq_pair")}</th>
                  <th className="text-right px-4 py-2.5">TVL</th>
                  <th className="text-right px-4 py-2.5">APY</th>
                  <th className="text-right px-4 py-2.5 hidden sm:table-cell">24h Vol</th>
                  <th className="text-right px-4 py-2.5">{t("liq_source")}</th>
                </tr>
              </thead>
              <tbody>
                {pools.map((pool) => (
                  <tr key={pool.pair} className="border-b border-border/30 hover:bg-primary/3 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-sm text-foreground">{pool.pair}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-foreground">{pool.tvl}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-secondary">{pool.apy}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground hidden sm:table-cell">{pool.volume}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        pool.source === "Loopring"
                          ? "text-primary bg-primary/8 border-primary/15"
                          : "text-secondary bg-secondary/8 border-secondary/15"
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
