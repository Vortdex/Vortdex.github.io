import { Activity } from "lucide-react";
import WalletButton from "@/components/WalletButton";
import WorldWalletButton from "@/components/WorldWalletButton";
import LanguageSelector from "@/components/LanguageSelector";
import { useI18n } from "@/lib/i18n";

const Navbar = () => {
  const { t } = useI18n();

  const links = [
    { href: "#swap", label: t("nav_swap") },
    { href: "#bridge", label: t("nav_bridge") },
    { href: "#limit", label: t("nav_limit") },
    { href: "#protocols", label: t("nav_protocols") },
    { href: "#liquidity", label: t("nav_liquidity") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display text-sm font-bold gradient-text tracking-wider">VORTEX<span className="text-secondary">DEX</span></span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-md text-xs font-mono text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <WorldWalletButton />
          <WalletButton />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
