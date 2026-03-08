import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowDownUp, ChevronDown, Zap, Info, Loader2, Search, X, AlertCircle, Settings2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount, useBalance, useReadContract, useSendTransaction } from "wagmi";
import { formatUnits, parseUnits, erc20Abi, type Address } from "viem";
import { toast } from "sonner";
import SwapHistory, { addSwapTransaction } from "./SwapHistory";

const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;
const AMOUNT_RE = /^\d*\.?\d*$/;
const SLIPPAGE_PRESETS = [0.5, 1, 3] as const;
const SLIPPAGE_RE = /^\d*\.?\d{0,2}$/;

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  color: string;
}

const tokens: Token[] = [
  { symbol: "ETH", name: "Ethereum", address: NATIVE_ETH, decimals: 18, color: "hsl(220, 60%, 55%)" },
  { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6, color: "hsl(210, 80%, 55%)" },
  { symbol: "USDT", name: "Tether", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6, color: "hsl(160, 80%, 45%)" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8, color: "hsl(30, 90%, 55%)" },
  { symbol: "DAI", name: "Dai", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18, color: "hsl(40, 90%, 55%)" },
  { symbol: "WETH", name: "Wrapped Ether", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18, color: "hsl(220, 60%, 55%)" },
  { symbol: "LINK", name: "Chainlink", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18, color: "hsl(220, 80%, 60%)" },
  { symbol: "UNI", name: "Uniswap", address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18, color: "hsl(330, 80%, 60%)" },
  { symbol: "AAVE", name: "Aave", address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", decimals: 18, color: "hsl(270, 60%, 55%)" },
  { symbol: "LDO", name: "Lido DAO", address: "0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32", decimals: 18, color: "hsl(195, 80%, 55%)" },
];

// Hook to get token balance
const useTokenBalance = (token: Token, address?: Address) => {
  const isNative = token.address === NATIVE_ETH;

  const { data: nativeBalance } = useBalance({
    address,
    query: { enabled: !!address && isNative },
  });

  const { data: erc20Balance } = useReadContract({
    address: token.address as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !isNative },
  });

  if (!address) return null;
  if (isNative && nativeBalance) {
    return formatUnits(nativeBalance.value, token.decimals);
  }
  if (!isNative && erc20Balance !== undefined) {
    return formatUnits(erc20Balance as bigint, token.decimals);
  }
  return null;
};

// Hook to check Permit2 allowance for ERC-20
const usePermit2Allowance = (token: Token, owner?: Address) => {
  const isNative = token.address === NATIVE_ETH;

  const { data: allowance, refetch } = useReadContract({
    address: token.address as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: owner ? [owner, PERMIT2_ADDRESS] : undefined,
    query: { enabled: !!owner && !isNative },
  });

  return {
    allowance: allowance as bigint | undefined,
    needsApproval: (amount: bigint) => {
      if (isNative) return false;
      if (!allowance) return true;
      return (allowance as bigint) < amount;
    },
    refetch,
  };
};

const formatBalance = (balance: string | null): string => {
  if (!balance) return "—";
  const num = parseFloat(balance);
  if (num === 0) return "0";
  if (num < 0.0001) return "<0.0001";
  if (num < 1) return num.toFixed(4);
  if (num < 1000) return num.toFixed(2);
  return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

interface TokenSelectorProps {
  selectedToken: Token;
  otherToken: Token;
  onSelect: (token: Token) => void;
  side: "from" | "to";
  walletAddress?: Address;
}

const TokenSelector = ({ selectedToken, otherToken, onSelect, side, walletAddress }: TokenSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = tokens.filter(
    (t) =>
      t.address !== otherToken.address &&
      (t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/30 transition-all shrink-0"
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold"
          style={{ backgroundColor: `${selectedToken.color}22`, color: selectedToken.color }}
        >
          {selectedToken.symbol[0]}
        </div>
        <span className="font-mono font-semibold text-foreground">{selectedToken.symbol}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Token suchen..."
                className="bg-transparent text-sm font-mono text-foreground outline-none w-full placeholder:text-muted-foreground"
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>

          <div className="px-3 pt-3 pb-1 flex flex-wrap gap-1.5">
            {tokens.slice(0, 4).filter((t) => t.address !== otherToken.address).map((t) => (
              <button
                key={t.symbol}
                onClick={() => { onSelect(t); setOpen(false); setSearch(""); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all ${
                  t.address === selectedToken.address
                    ? "bg-primary/15 border-primary/30 text-primary"
                    : "bg-muted/30 border-border hover:border-primary/20 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.symbol}
              </button>
            ))}
          </div>

          <div className="max-h-52 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground font-mono">
                Kein Token gefunden
              </div>
            ) : (
              filtered.map((token) => (
                <TokenRow
                  key={token.address}
                  token={token}
                  isSelected={token.address === selectedToken.address}
                  walletAddress={walletAddress}
                  onClick={() => { onSelect(token); setOpen(false); setSearch(""); }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TokenRow = ({ token, isSelected, walletAddress, onClick }: {
  token: Token;
  isSelected: boolean;
  walletAddress?: Address;
  onClick: () => void;
}) => {
  const balance = useTokenBalance(token, walletAddress);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
        isSelected
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50 border border-transparent"
      }`}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-mono font-bold shrink-0"
        style={{ backgroundColor: `${token.color}22`, color: token.color }}
      >
        {token.symbol[0]}
      </div>
      <div className="text-left min-w-0 flex-1">
        <div className="font-mono font-semibold text-sm text-foreground">{token.symbol}</div>
        <div className="text-xs text-muted-foreground truncate">{token.name}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-mono text-xs text-muted-foreground">
          {walletAddress ? formatBalance(balance) : ""}
        </div>
      </div>
      {isSelected && (
        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
      )}
    </button>
  );
};

const SwapWidget = () => {
  const { address, isConnected } = useAccount();
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [fromAmount, setFromAmount] = useState("1.0");
  const [toAmount, setToAmount] = useState("");
  const [rate, setRate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [slippage, setSlippage] = useState(1);
  const [customSlippage, setCustomSlippage] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Compute price impact from quote data
  const priceImpact = (() => {
    if (!quoteData || !fromAmount) return null;
    const sellAmountNum = parseFloat(fromAmount);
    if (sellAmountNum <= 0) return null;
    const buyAmountRaw = Number(quoteData.buyAmount) / 10 ** toToken.decimals;
    const totalBeforeFees = buyAmountRaw +
      (quoteData.fees?.integratorFee?.amount ? Number(quoteData.fees.integratorFee.amount) / 10 ** toToken.decimals : 0) +
      (quoteData.fees?.zeroExFee?.amount ? Number(quoteData.fees.zeroExFee.amount) / 10 ** toToken.decimals : 0);
    // Estimate market rate from first fill proportion — simplified: compare minBuyAmount vs buyAmount
    if (quoteData.minBuyAmount) {
      const minBuy = Number(quoteData.minBuyAmount) / 10 ** toToken.decimals;
      const impact = ((totalBeforeFees - buyAmountRaw) / totalBeforeFees) * 100;
      return Math.abs(impact);
    }
    return null;
  })();

  const priceImpactSeverity = priceImpact === null ? "none" : priceImpact < 1 ? "low" : priceImpact < 3 ? "medium" : "high";

  const fromBalance = useTokenBalance(fromToken, address as Address | undefined);
  const toBalance = useTokenBalance(toToken, address as Address | undefined);
  const { needsApproval, refetch: refetchAllowance } = usePermit2Allowance(fromToken, address as Address | undefined);
  const { sendTransactionAsync } = useSendTransaction();

  const parsedSellAmount = useCallback(() => {
    const parsed = parseFloat(fromAmount || "0");
    if (parsed <= 0) return BigInt(0);
    try {
      return parseUnits(fromAmount, fromToken.decimals);
    } catch {
      return BigInt(0);
    }
  }, [fromAmount, fromToken.decimals]);

  const requiresApproval = fromToken.address !== NATIVE_ETH && needsApproval(parsedSellAmount());

  const fetchPrice = useCallback(async () => {
    const parsedAmount = parseFloat(fromAmount || "0");
    if (parsedAmount <= 0 || fromToken.address === toToken.address) {
      setToAmount("");
      setRate(null);
      setQuoteData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sellAmount = parsedSellAmount().toString();

      const { data, error: fnError } = await supabase.functions.invoke("swap-price", {
        body: {
          sellToken: fromToken.address,
          buyToken: toToken.address,
          sellAmount,
          chainId: 1,
          ...(address && { taker: address }),
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      if (data?.buyAmount) {
        const buyAmountNum = Number(data.buyAmount) / 10 ** toToken.decimals;
        setToAmount(buyAmountNum.toLocaleString("en-US", { maximumFractionDigits: 6 }));
        const rateValue = buyAmountNum / parsedAmount;
        setRate(rateValue.toLocaleString("en-US", { maximumFractionDigits: 6 }));
        setQuoteData(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch price");
      setToAmount("");
      setRate(null);
      setQuoteData(null);
    } finally {
      setLoading(false);
    }
  }, [fromAmount, fromToken, toToken, address, parsedSellAmount]);

  useEffect(() => {
    const timer = setTimeout(fetchPrice, 500);
    return () => clearTimeout(timer);
  }, [fetchPrice]);

  const handleApprove = async () => {
    if (!address) return;
    setApproving(true);
    try {
      const maxApproval = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      await sendTransactionAsync({
        to: fromToken.address as Address,
        data: `0x095ea7b3${PERMIT2_ADDRESS.slice(2).padStart(64, "0")}${maxApproval.toString(16).padStart(64, "0")}` as `0x${string}`,
      });
      toast.success("Permit2 Approval bestätigt!");
      await refetchAllowance();
    } catch (err: any) {
      toast.error(err.shortMessage || err.message || "Approval fehlgeschlagen");
    } finally {
      setApproving(false);
    }
  };

  const handleSwap = async () => {
    if (!address || !quoteData) return;
    setSwapping(true);
    setError(null);

    try {
      // Fetch full quote with taker for execution
      const sellAmount = parsedSellAmount().toString();
      const { data, error: fnError } = await supabase.functions.invoke("swap-quote", {
        body: {
          sellToken: fromToken.address,
          buyToken: toToken.address,
          sellAmount,
          chainId: 1,
          taker: address,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      if (!data?.transaction) {
        throw new Error("Kein Transaction-Objekt vom Aggregator erhalten");
      }

      // Execute the swap transaction
      const txHash = await sendTransactionAsync({
        to: data.transaction.to as Address,
        data: data.transaction.data as `0x${string}`,
        value: data.transaction.value ? BigInt(data.transaction.value) : BigInt(0),
        gas: data.transaction.gas ? BigInt(data.transaction.gas) : undefined,
        gasPrice: data.transaction.gasPrice ? BigInt(data.transaction.gasPrice) : undefined,
      });

      addSwapTransaction({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromAmount,
        toAmount,
        txHash: typeof txHash === "string" ? txHash : undefined,
        status: "completed",
        slippage,
      });

      toast.success(
        <div className="font-mono text-sm">
          <div className="font-bold text-primary">Swap erfolgreich! ✓</div>
          <div className="text-xs mt-1 text-muted-foreground">
            {fromAmount} {fromToken.symbol} → {toAmount} {toToken.symbol}
          </div>
        </div>
      );

      // Reset
      setFromAmount("");
      setToAmount("");
      setQuoteData(null);
    } catch (err: any) {
      addSwapTransaction({
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        fromAmount,
        toAmount,
        status: "failed",
        slippage,
      });
      const msg = err.shortMessage || err.message || "Swap fehlgeschlagen";
      setError(msg);
      toast.error(msg);
    } finally {
      setSwapping(false);
    }
  };

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const insufficientBalance = fromBalance !== null && parseFloat(fromAmount || "0") > parseFloat(fromBalance);

  const getButtonState = () => {
    if (!isConnected) return { label: "Wallet verbinden", disabled: true, action: () => {} };
    if (loading) return { label: "Preis laden...", disabled: true, action: () => {} };
    if (!toAmount) return { label: "Betrag eingeben", disabled: true, action: () => {} };
    if (insufficientBalance) return { label: `Nicht genug ${fromToken.symbol}`, disabled: true, action: () => {} };
    if (requiresApproval) return {
      label: approving ? "Approval wird gesendet..." : `Permit2 Approval für ${fromToken.symbol}`,
      disabled: approving,
      action: handleApprove,
    };
    return {
      label: swapping ? "Swap wird ausgeführt..." : "Swap ausführen",
      disabled: swapping,
      action: handleSwap,
    };
  };

  const buttonState = getButtonState();

  return (
    <section id="swap" className="py-20">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Instant Swap</h2>
          <p className="text-muted-foreground font-mono text-sm">via 0x Aggregator — Best Price Routing</p>
        </div>

        <div className="glass-card rounded-2xl p-6 pulse-glow">
          {/* Header with settings */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono font-semibold text-foreground text-sm">Swap</span>
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-all ${showSettings ? "bg-primary/15 text-primary" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"}`}
              >
                <Settings2 className="w-4 h-4" />
              </button>
              {showSettings && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="text-sm font-mono font-semibold text-foreground mb-3">Slippage Toleranz</div>
                  <div className="flex items-center gap-2 mb-3">
                    {SLIPPAGE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => { setSlippage(preset); setCustomSlippage(""); }}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium border transition-all ${
                          slippage === preset && !customSlippage
                            ? "bg-primary/15 border-primary/30 text-primary"
                            : "bg-muted/30 border-border hover:border-primary/20 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={customSlippage}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || SLIPPAGE_RE.test(v)) {
                            setCustomSlippage(v);
                            const num = parseFloat(v);
                            if (num > 0 && num <= 50) setSlippage(num);
                          }
                        }}
                        placeholder="Custom"
                        className={`w-full py-1.5 px-2 rounded-lg text-xs font-mono border outline-none bg-muted/30 transition-all ${
                          customSlippage ? "border-primary/30 text-primary" : "border-border text-muted-foreground"
                        }`}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">%</span>
                    </div>
                  </div>
                  {slippage > 5 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Hohe Slippage — Frontrunning-Risiko</span>
                    </div>
                  )}
                  {slippage < 0.1 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Zu niedrig — Transaktion könnte fehlschlagen</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* From */}
          <div className="bg-muted/50 rounded-xl p-4 mb-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Von</span>
              <span className="font-mono flex items-center gap-1.5">
                Balance: {formatBalance(fromBalance)}
                {fromBalance && parseFloat(fromBalance) > 0 && (
                  <button
                    onClick={() => setFromAmount(fromBalance)}
                    className="text-primary hover:underline text-xs"
                  >
                    MAX
                  </button>
                )}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={fromAmount}
                onChange={(e) => { if (AMOUNT_RE.test(e.target.value)) setFromAmount(e.target.value); }}
                className={`bg-transparent text-3xl font-mono font-bold outline-none w-full ${
                  insufficientBalance ? "text-destructive" : "text-foreground"
                }`}
                placeholder="0.0"
              />
              <TokenSelector
                selectedToken={fromToken}
                otherToken={toToken}
                onSelect={setFromToken}
                side="from"
                walletAddress={address as Address | undefined}
              />
            </div>
          </div>

          {/* Swap direction button */}
          <div className="flex justify-center -my-3 relative z-10">
            <button
              onClick={handleSwapTokens}
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:border-primary/50 hover:rotate-180 transition-all duration-300"
            >
              <ArrowDownUp className="w-4 h-4 text-primary" />
            </button>
          </div>

          {/* To */}
          <div className="bg-muted/50 rounded-xl p-4 mt-2">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Zu</span>
              <span className="font-mono">Balance: {formatBalance(toBalance)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center w-full">
                {loading ? (
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <input
                    type="text"
                    value={toAmount}
                    readOnly
                    className="bg-transparent text-3xl font-mono font-bold text-foreground outline-none w-full"
                    placeholder="0.0"
                  />
                )}
              </div>
              <TokenSelector
                selectedToken={toToken}
                otherToken={fromToken}
                onSelect={setToToken}
                side="to"
                walletAddress={address as Address | undefined}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Route info */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <span>Beste Route</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary border border-primary/20">
                  0x Aggregator
                </span>
              </div>
            </div>
            {rate && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" /> Rate
                </span>
                <span className="font-mono text-foreground">1 {fromToken.symbol} = {rate} {toToken.symbol}</span>
              </div>
            )}
            {/* Slippage */}
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">Slippage Toleranz</span>
              <span className={`font-mono text-xs ${slippage > 5 ? "text-amber-400" : "text-foreground"}`}>{slippage}%</span>
            </div>
            {/* Min received */}
            {toAmount && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground">Min. erhalten</span>
                <span className="font-mono text-xs text-foreground">
                  {(parseFloat(toAmount.replace(/,/g, "")) * (1 - slippage / 100)).toLocaleString("en-US", { maximumFractionDigits: 6 })} {toToken.symbol}
                </span>
              </div>
            )}
            {/* Price Impact */}
            {priceImpact !== null && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  {priceImpactSeverity === "high" && <AlertTriangle className="w-3 h-3 text-destructive" />}
                  {priceImpactSeverity === "medium" && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                  Preis-Impact
                </span>
                <span className={`font-mono text-xs ${
                  priceImpactSeverity === "high" ? "text-destructive font-bold" :
                  priceImpactSeverity === "medium" ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {priceImpact < 0.01 ? "<0.01" : priceImpact.toFixed(2)}%
                </span>
              </div>
            )}
            {/* High price impact warning */}
            {priceImpactSeverity === "high" && (
              <div className="mt-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                <span className="text-xs font-mono text-destructive">
                  Hoher Preis-Impact! Du verlierst möglicherweise einen erheblichen Betrag durch diese Transaktion.
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">VortexDEX Fee</span>
              <span className="font-mono text-foreground text-xs">0.1%</span>
            </div>
            {quoteData?.fees?.integratorFee?.amount && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground text-xs">Fee Betrag</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {(Number(quoteData.fees.integratorFee.amount) / 10 ** toToken.decimals).toLocaleString("en-US", { maximumFractionDigits: 6 })} {toToken.symbol}
                </span>
              </div>
            )}
            {requiresApproval && (
              <div className="flex items-center gap-2 text-sm mt-2 text-accent">
                <AlertCircle className="w-3 h-3" />
                <span className="font-mono text-xs">Permit2 Approval benötigt</span>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            disabled={buttonState.disabled}
            onClick={buttonState.action}
            className="w-full mt-4 py-4 rounded-xl bg-primary text-primary-foreground font-mono font-bold text-lg hover:shadow-[0_0_40px_hsl(160_100%_50%/0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
          {(swapping || approving) && <Loader2 className="w-5 h-5 animate-spin" />}
            {buttonState.label}
          </button>

          <SwapHistory />
        </div>
      </div>
    </section>
  );
};

export default SwapWidget;
