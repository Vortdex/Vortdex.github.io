import { Layers } from "lucide-react";
import WalletButton from "@/components/WalletButton";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary/20 flex items-center justify-center glow-primary">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <span className="font-mono text-lg font-bold gradient-text">VortexDEX</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-mono text-sm">
          <a href="#swap" className="text-muted-foreground hover:text-primary transition-colors">Swap</a>
          <a href="#bridge" className="text-muted-foreground hover:text-primary transition-colors">Bridge</a>
          <a href="#limit" className="text-muted-foreground hover:text-primary transition-colors">Limit Orders</a>
          <a href="#protocols" className="text-muted-foreground hover:text-primary transition-colors">Protokolle</a>
          <a href="#liquidity" className="text-muted-foreground hover:text-primary transition-colors">Liquidität</a>
        </div>
        <WalletButton />
      </div>
    </nav>
  );
};

export default Navbar;
