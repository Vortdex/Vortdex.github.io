import { Layers, Github, ExternalLink } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border py-12">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <span className="font-mono font-bold gradient-text">VortexDEX</span>
          <span className="text-xs text-muted-foreground ml-2">Loopring + OpenDEX Aggregator</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground font-mono">
          <a href="https://loopring.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
            Loopring <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1">
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-8 font-mono">
        Open-Source • Non-Custodial • MIT Lizenz
      </p>
    </div>
  </footer>
);

export default Footer;
