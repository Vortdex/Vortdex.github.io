import { Shield, Zap, Check } from "lucide-react";

const protocols = [
  {
    name: "Loopring",
    tag: "ZK-Rollup",
    tagColor: "text-primary bg-primary/10 border-primary/20",
    icon: Shield,
    description: "Nicht-kustodisches Orderbook auf Ethereum L2 mit ZK-Proofs für maximale Sicherheit und niedrige Gebühren.",
    features: [
      "ZK-Rollups für Skalierbarkeit",
      "Ethereum-Level Sicherheit",
      "Orderbook mit hoher Tiefe",
      "Limit & Stop-Orders",
      "Nicht-kustodisch",
    ],
    bestFor: "Limit-Orders, institutionelle Trades",
    glowClass: "hover:shadow-[0_0_40px_hsl(160_100%_50%/0.15)]",
  },
  {
    name: "OpenDEX",
    tag: "AMM",
    tagColor: "text-secondary bg-secondary/10 border-secondary/20",
    icon: Zap,
    description: "Uniswap-V2/V3-kompatibles AMM-Protokoll für Instant-Swaps und Liquidity-Pools auf allen EVM-Chains.",
    features: [
      "Instant Token-Swaps",
      "Multi-Chain (Polygon, Arbitrum...)",
      "Liquidity-Pool Providing",
      "MIT-Lizenz, Open-Source",
      "Aggregierte Liquidität",
    ],
    bestFor: "Instant-Swaps, Liquidity-Providing",
    glowClass: "hover:shadow-[0_0_40px_hsl(200_100%_50%/0.15)]",
  },
];

const ProtocolCards = () => {
  return (
    <section id="protocols" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Zwei Protokolle. Ein Ziel.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Beste Execution durch intelligentes Routing zwischen Loopring und OpenDEX.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {protocols.map((proto) => (
            <div key={proto.name} className={`glass-card rounded-2xl p-8 transition-all duration-300 ${proto.glowClass}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                    <proto.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-xl text-foreground">{proto.name}</h3>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${proto.tagColor}`}>
                      {proto.tag}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{proto.description}</p>

              <ul className="space-y-3 mb-6">
                {proto.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <span className="text-xs text-muted-foreground">Ideal für: </span>
                <span className="text-xs font-mono text-foreground">{proto.bestFor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProtocolCards;
