import { ArrowDown, Shield, Zap, Globe } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center pt-16 overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(160 100% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(160 100% 50%) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />
      
      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/5 blur-[120px]" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary font-mono text-xs mb-8">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Loopring + OpenDEX Aggregator — Live
        </div>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight">
          <span className="gradient-text">Best Execution.</span>
          <br />
          <span className="text-foreground">Zwei Protokolle,</span>
          <br />
          <span className="text-foreground">ein Interface.</span>
        </h1>

        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Nutze <span className="text-primary font-medium">Loopring</span> für sichere Limit-Orders via ZK-Rollups 
          und <span className="text-secondary font-medium">OpenDEX</span> für Instant-Swaps — kombiniert für die beste Quote.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <a href="#swap" className="px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-mono font-semibold hover:shadow-[0_0_30px_hsl(160_100%_50%/0.4)] transition-all">
            Jetzt traden
          </a>
          <a href="#protocols" className="px-8 py-3.5 rounded-lg border border-border text-foreground font-mono font-semibold hover:border-primary/50 transition-all">
            Protokolle entdecken
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            { icon: Shield, label: "ZK-gesichert", desc: "Ethereum-Sicherheit via Zero-Knowledge Proofs" },
            { icon: Zap, label: "Instant Swaps", desc: "AMM-Pools für sofortige Token-Swaps" },
            { icon: Globe, label: "Multi-Chain", desc: "EVM-kompatibel: Polygon, Arbitrum & mehr" },
          ].map((item) => (
            <div key={item.label} className="glass-card rounded-xl p-5 text-left hover:border-primary/30 transition-all group">
              <item.icon className="w-8 h-8 text-primary mb-3 group-hover:drop-shadow-[0_0_8px_hsl(160_100%_50%/0.6)] transition-all" />
              <h3 className="font-mono font-semibold text-foreground mb-1">{item.label}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 animate-bounce">
          <ArrowDown className="w-5 h-5 text-muted-foreground mx-auto" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
