import { useState, useEffect, useRef } from "react";
import { ArrowRight, Shield, Clock, ChevronDown, ExternalLink, AlertTriangle } from "lucide-react";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import BridgeHistory, { addBridgeTransaction, loadBridgeHistory, type BridgeTransaction } from "./BridgeHistory";

interface BridgeChain {
  id: string;
  name: string;
  symbol: string;
  color: string;
  icon: string;
  type: "evm" | "non-evm";
}

interface BridgeToken {
  symbol: string;
  name: string;
  chains: string[];
  color: string;
}

const chains: BridgeChain[] = [
  { id: "ethereum", name: "Ethereum", symbol: "ETH", color: "hsl(220, 60%, 55%)", icon: "Ξ", type: "evm" },
  { id: "alephium", name: "Alephium", symbol: "ALPH", color: "hsl(35, 90%, 55%)", icon: "α", type: "non-evm" },
  { id: "pi", name: "Pi Network", symbol: "PI", color: "hsl(270, 70%, 55%)", icon: "π", type: "non-evm" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ETH", color: "hsl(210, 80%, 55%)", icon: "A", type: "evm" },
  { id: "polygon", name: "Polygon", symbol: "MATIC", color: "hsl(265, 80%, 55%)", icon: "P", type: "evm" },
];

const bridgeTokens: BridgeToken[] = [
  { symbol: "ETH", name: "Ethereum", chains: ["ethereum", "alephium", "arbitrum", "polygon"], color: "hsl(220, 60%, 55%)" },
  { symbol: "ALPH", name: "Alephium", chains: ["alephium", "ethereum"], color: "hsl(35, 90%, 55%)" },
  { symbol: "PI", name: "Pi", chains: ["pi", "ethereum"], color: "hsl(270, 70%, 55%)" },
  { symbol: "USDC", name: "USD Coin", chains: ["ethereum", "alephium", "arbitrum", "polygon"], color: "hsl(210, 80%, 55%)" },
  { symbol: "USDT", name: "Tether", chains: ["ethereum", "alephium", "arbitrum", "polygon"], color: "hsl(160, 80%, 45%)" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", chains: ["ethereum", "alephium"], color: "hsl(30, 90%, 55%)" },
];

interface ChainSelectorProps {
  selected: BridgeChain;
  onSelect: (chain: BridgeChain) => void;
  exclude?: string;
  label: string;
}

const ChainSelector = ({ selected, onSelect, exclude, label }: ChainSelectorProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const available = chains.filter((c) => c.id !== exclude);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative flex-1" ref={ref}>
      <div className="text-xs text-muted-foreground font-mono mb-2">{label}</div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-all"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: `${selected.color}22`, color: selected.color }}
        >
          {selected.icon}
        </div>
        <div className="text-left">
          <div className="font-mono font-semibold text-sm text-foreground">{selected.name}</div>
          <div className="text-xs text-muted-foreground">{selected.type === "evm" ? "EVM" : "Non-EVM"}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground ml-auto transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {available.map((chain) => (
            <button
              key={chain.id}
              onClick={() => { onSelect(chain); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${
                chain.id === selected.id ? "bg-primary/10" : "hover:bg-muted/50"
              }`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: `${chain.color}22`, color: chain.color }}
              >
                {chain.icon}
              </div>
              <span className="font-mono text-sm text-foreground">{chain.name}</span>
              {chain.type === "non-evm" && (
                <span className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-mono bg-accent/10 text-accent border border-accent/20">
                  Non-EVM
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const BridgeSection = () => {
  const { isConnected } = useAccount();
  const [fromChain, setFromChain] = useState(chains[0]);
  const [toChain, setToChain] = useState(chains[1]);
  const [selectedToken, setSelectedToken] = useState(bridgeTokens[0]);
  const [amount, setAmount] = useState("");
  const [tokenOpen, setTokenOpen] = useState(false);
  const [bridging, setBridging] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const tokenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tokenRef.current && !tokenRef.current.contains(e.target as Node)) setTokenOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const availableTokens = bridgeTokens.filter(
    (t) => t.chains.includes(fromChain.id) && t.chains.includes(toChain.id)
  );

  const handleSwapChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
  };

  const estimatedOutput = amount ? (parseFloat(amount) * 0.999).toFixed(6) : "";
  const fee = amount ? (parseFloat(amount) * 0.001).toFixed(6) : "0";
  const isNonEvmRoute = fromChain.type === "non-evm" || toChain.type === "non-evm";

  const handleBridge = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    setBridging(true);

    // Add to bridge history as pending
    addBridgeTransaction({
      fromChain: fromChain.name,
      toChain: toChain.name,
      token: selectedToken.symbol,
      amount,
      status: "confirming",
      estimatedTime: isNonEvmRoute ? "15–30 Min." : "2–5 Min.",
    });

    setHistoryKey((k) => k + 1);

    // Simulate bridge delay then complete
    setTimeout(() => {
      const history = loadBridgeHistory();
      if (history.length > 0 && history[0].status === "confirming") {
        history[0].status = "completed";
        localStorage.setItem("vortexdex_bridge_history", JSON.stringify(history));
        setHistoryKey((k) => k + 1);
      }
      toast.success(
        <div className="font-mono text-sm">
          <div className="font-bold text-primary">Bridge abgeschlossen! ✓</div>
          <div className="text-xs mt-1 text-muted-foreground">
            {amount} {selectedToken.symbol}: {fromChain.name} → {toChain.name}
          </div>
        </div>
      );
      setBridging(false);
    }, 5000);

    toast.info(`Bridge gestartet: ${amount} ${selectedToken.symbol} von ${fromChain.name} nach ${toChain.name}`);
    setAmount("");
  };

  return (
    <section id="bridge" className="py-20">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Cross-Chain Bridge</h2>
          <p className="text-muted-foreground font-mono text-sm">
            Alephium · Pi Network · EVM Chains
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 pulse-glow">
          {/* Chain selectors */}
          <div className="flex items-end gap-3 mb-4">
            <ChainSelector
              selected={fromChain}
              onSelect={(c) => {
                setFromChain(c);
                if (!bridgeTokens.find((t) => t.symbol === selectedToken.symbol && t.chains.includes(c.id) && t.chains.includes(toChain.id))) {
                  const fallback = bridgeTokens.find((t) => t.chains.includes(c.id) && t.chains.includes(toChain.id));
                  if (fallback) setSelectedToken(fallback);
                }
              }}
              exclude={toChain.id}
              label="Von Chain"
            />

            <button
              onClick={handleSwapChains}
              className="w-10 h-10 mb-0.5 rounded-xl bg-card border border-border flex items-center justify-center hover:border-primary/50 transition-all shrink-0"
            >
              <ArrowRight className="w-4 h-4 text-primary" />
            </button>

            <ChainSelector
              selected={toChain}
              onSelect={(c) => {
                setToChain(c);
                if (!bridgeTokens.find((t) => t.symbol === selectedToken.symbol && t.chains.includes(fromChain.id) && t.chains.includes(c.id))) {
                  const fallback = bridgeTokens.find((t) => t.chains.includes(fromChain.id) && t.chains.includes(c.id));
                  if (fallback) setSelectedToken(fallback);
                }
              }}
              exclude={fromChain.id}
              label="Zu Chain"
            />
          </div>

          {/* Non-EVM warning */}
          {isNonEvmRoute && (
            <div className="mb-4 p-3 rounded-lg bg-accent/5 border border-accent/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="text-xs font-mono text-accent/80">
                Non-EVM Bridge — Separate Wallet-Verbindung für{" "}
                {fromChain.type === "non-evm" ? fromChain.name : toChain.name} erforderlich.
                Bridging kann 10–30 Min. dauern.
              </div>
            </div>
          )}

          {/* Amount + Token */}
          <div className="bg-muted/50 rounded-xl p-4 mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Betrag</span>
              <span className="font-mono">{selectedToken.symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-transparent text-3xl font-mono font-bold text-foreground outline-none w-full"
                placeholder="0.0"
              />

              <div className="relative" ref={tokenRef}>
                <button
                  onClick={() => setTokenOpen(!tokenOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/30 transition-all shrink-0"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                    style={{ backgroundColor: `${selectedToken.color}22`, color: selectedToken.color }}
                  >
                    {selectedToken.symbol[0]}
                  </div>
                  <span className="font-mono font-semibold text-foreground">{selectedToken.symbol}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${tokenOpen ? "rotate-180" : ""}`} />
                </button>

                {tokenOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 p-1.5">
                    {availableTokens.length === 0 ? (
                      <div className="px-3 py-4 text-center text-xs text-muted-foreground font-mono">
                        Keine Token für diese Route
                      </div>
                    ) : (
                      availableTokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => { setSelectedToken(token); setTokenOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                            token.symbol === selectedToken.symbol ? "bg-primary/10" : "hover:bg-muted/50"
                          }`}
                        >
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                            style={{ backgroundColor: `${token.color}22`, color: token.color }}
                          >
                            {token.symbol[0]}
                          </div>
                          <div className="text-left">
                            <div className="font-mono font-semibold text-sm text-foreground">{token.symbol}</div>
                            <div className="text-xs text-muted-foreground">{token.name}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Output estimate */}
          <div className="bg-muted/30 rounded-xl p-4 mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Du erhältst (geschätzt)</span>
            </div>
            <div className="text-2xl font-mono font-bold text-foreground">
              {estimatedOutput || "0.0"} <span className="text-base text-muted-foreground">{selectedToken.symbol}</span>
            </div>
          </div>

          {/* Bridge details */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" /> Route
              </span>
              <span className="font-mono text-foreground text-xs">
                {fromChain.name} → {toChain.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> Geschätzte Dauer
              </span>
              <span className="font-mono text-foreground text-xs">
                {isNonEvmRoute ? "~15–30 Min." : "~2–5 Min."}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">VortexDEX Fee</span>
              <span className="font-mono text-foreground text-xs">
                {fee} {selectedToken.symbol} (0.1%)
              </span>
            </div>
          </div>

          {/* Bridge button */}
          <button
            disabled={!amount || parseFloat(amount) <= 0 || bridging || !isConnected}
            onClick={handleBridge}
            className="w-full mt-4 py-4 rounded-xl bg-primary text-primary-foreground font-mono font-bold text-lg hover:shadow-[0_0_40px_hsl(160_100%_50%/0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isConnected ? "Wallet verbinden" : bridging ? "Bridge läuft..." : "Bridge starten"}
          </button>

          {/* Info links */}
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground font-mono">
            <a href="https://bridge.alephium.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
              Alephium Bridge <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-border">|</span>
            <a href="https://minepi.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
              Pi Network <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Bridge History */}
          <BridgeHistory key={historyKey} />
        </div>
      </div>
    </section>
  );
};

export default BridgeSection;
