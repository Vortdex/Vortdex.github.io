import { ArrowDown, Shield, Zap, Globe, Hexagon } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center pt-14 overflow-hidden scanlines">
      {/* Cyber grid background */}
      <div className="absolute inset-0 circuit-pattern" />
      
      {/* Glow orbs */}
      <div className="absolute top-1/3 left-1/5 w-80 h-80 rounded-full bg-primary/4 blur-[150px]" />
      <div className="absolute bottom-1/3 right-1/5 w-64 h-64 rounded-full bg-secondary/5 blur-[120px]" />

      {/* Decorative hex elements */}
      <div className="absolute top-24 right-[15%] w-16 h-16 border border-primary/10 rotate-45 opacity-20" />
      <div className="absolute bottom-32 left-[10%] w-12 h-12 border border-secondary/10 rotate-12 opacity-15" />

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/15 bg-primary/5 font-mono text-[10px] tracking-widest uppercase mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-primary/80">System Online</span>
          <span className="text-muted-foreground">—</span>
          <span className="text-secondary/80">Loopring + OpenDEX</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-black leading-[1.1] mb-5 tracking-tight">
          <span className="gradient-text">Best Execution.</span>
          <br />
          <span className="text-foreground text-3xl md:text-5xl lg:text-5xl font-bold opacity-80">Zwei Protokolle,</span>
          <br />
          <span className="text-foreground text-3xl md:text-5xl lg:text-5xl font-bold opacity-80">ein Interface.</span>
        </h1>

        <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          <span className="text-primary font-medium">Loopring</span> ZK-Rollups + <span className="text-secondary font-medium">OpenDEX</span> AMM — kombiniert für die beste Quote.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <a href="#swap" className="group px-6 py-3 rounded-lg font-mono font-semibold text-sm text-primary-foreground bg-primary hover:shadow-[0_0_40px_hsl(150_100%_45%/0.3)] transition-all">
            ⟐ Jetzt traden
          </a>
          <a href="#protocols" className="px-6 py-3 rounded-lg border border-border text-foreground font-mono font-semibold text-sm hover:border-secondary/40 hover:text-secondary transition-all">
            Protokolle →
          </a>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {[
            { icon: Shield, label: "ZK-gesichert", desc: "Ethereum-Sicherheit via ZK-Proofs", color: "primary" },
            { icon: Zap, label: "Instant Swaps", desc: "AMM-Pools für sofortige Swaps", color: "secondary" },
            { icon: Globe, label: "Multi-Chain", desc: "EVM + Alephium Support", color: "primary" },
          ].map((item) => (
            <div key={item.label} className="glass-card rounded-lg p-4 text-left hover:border-primary/20 transition-all group border-glow">
              <div className="flex items-center gap-2 mb-1.5">
                <item.icon className={`w-4 h-4 ${item.color === 'secondary' ? 'text-secondary' : 'text-primary'}`} />
                <h3 className="font-mono font-semibold text-sm text-foreground">{item.label}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 animate-bounce opacity-40">
          <ArrowDown className="w-4 h-4 text-primary mx-auto" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
