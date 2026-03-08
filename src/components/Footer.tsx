import { Activity, Github, ExternalLink } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/50 py-8">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-display text-xs font-bold gradient-text tracking-wider">VORTEX<span className="text-secondary">DEX</span></span>
          <span className="text-[10px] text-muted-foreground ml-2 font-mono">v2.0</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
          <a href="https://loopring.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
            Loopring <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-secondary transition-colors">
            <Github className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      <p className="text-center text-[10px] text-muted-foreground/60 mt-4 font-mono tracking-wider">
        OPEN-SOURCE • NON-CUSTODIAL • MIT LIZENZ
      </p>
    </div>
  </footer>
);

export default Footer;
