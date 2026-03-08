import { Shield, Zap, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const ProtocolCards = () => {
  const { t } = useI18n();

  const protocols = [
    {
      name: "Loopring",
      tag: "ZK-Rollup",
      tagColor: "text-primary bg-primary/10 border-primary/20",
      icon: Shield,
      description: t("proto_loopring_desc"),
      features: [t("proto_loopring_f1"), t("proto_loopring_f2"), t("proto_loopring_f3"), t("proto_loopring_f4")],
      bestFor: t("proto_loopring_best"),
      glow: "primary",
    },
    {
      name: "OpenDEX",
      tag: "AMM",
      tagColor: "text-secondary bg-secondary/10 border-secondary/20",
      icon: Zap,
      description: t("proto_opendex_desc"),
      features: [t("proto_opendex_f1"), t("proto_opendex_f2"), t("proto_opendex_f3"), t("proto_opendex_f4")],
      bestFor: t("proto_opendex_best"),
      glow: "secondary",
    },
  ];

  return (
    <section id="protocols" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-2">{t("proto_title_1")} <span className="gradient-text">{t("proto_title_2")}</span></h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t("proto_subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          {protocols.map((proto) => (
            <div key={proto.name} className={`glass-card rounded-xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_hsl(${proto.glow === 'secondary' ? '45_100%_55%' : '150_100%_45%'}/0.1)] border-glow`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${proto.glow === 'secondary' ? 'bg-secondary/10 border border-secondary/20' : 'bg-primary/10 border border-primary/20'}`}>
                  <proto.icon className={`w-5 h-5 ${proto.glow === 'secondary' ? 'text-secondary' : 'text-primary'}`} />
                </div>
                <div>
                  <h3 className="font-mono font-bold text-base text-foreground">{proto.name}</h3>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${proto.tagColor}`}>{proto.tag}</span>
                </div>
              </div>

              <p className="text-muted-foreground text-xs mb-4 leading-relaxed">{proto.description}</p>

              <ul className="space-y-2 mb-4">
                {proto.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-foreground">
                    <Check className={`w-3 h-3 shrink-0 ${proto.glow === 'secondary' ? 'text-secondary' : 'text-primary'}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="p-2.5 rounded-md bg-muted/30 border border-border">
                <span className="text-[10px] text-muted-foreground">{t("proto_ideal")}</span>
                <span className="text-[10px] font-mono text-foreground">{proto.bestFor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProtocolCards;
