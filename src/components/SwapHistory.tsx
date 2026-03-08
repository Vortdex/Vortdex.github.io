import { useState } from "react";
import { Clock, CheckCircle2, XCircle, ArrowRight, Trash2, ExternalLink } from "lucide-react";

export interface SwapTransaction {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  txHash?: string;
  status: "completed" | "failed";
  timestamp: Date;
  slippage: number;
}

const STORAGE_KEY = "vortexdex_swap_history";

export const loadSwapHistory = (): SwapTransaction[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw, (key, value) => {
      if (key === "timestamp") return new Date(value);
      return value;
    });
  } catch {
    return [];
  }
};

export const saveSwapHistory = (txns: SwapTransaction[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
};

export const addSwapTransaction = (tx: Omit<SwapTransaction, "id" | "timestamp">): SwapTransaction => {
  const newTx: SwapTransaction = {
    ...tx,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  };
  const history = loadSwapHistory();
  history.unshift(newTx);
  saveSwapHistory(history.slice(0, 50));
  return newTx;
};

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} T.`;
}

const SwapHistory = () => {
  const [transactions, setTransactions] = useState<SwapTransaction[]>(loadSwapHistory);
  const [expanded, setExpanded] = useState(true);

  const clearHistory = () => {
    setTransactions([]);
    saveSwapHistory([]);
  };

  if (transactions.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-mono text-muted-foreground hover:text-foreground transition-colors mb-3"
      >
        <span className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Swap-Historie ({transactions.length})
        </span>
        <span className="text-xs">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="space-y-2">
          {transactions.slice(0, 10).map((tx) => {
            const isCompleted = tx.status === "completed";

            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isCompleted ? "bg-primary/10" : "bg-destructive/10"
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-mono text-foreground">
                    <span>{tx.fromAmount} {tx.fromToken}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span>{tx.toAmount} {tx.toToken}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className={isCompleted ? "text-primary" : "text-destructive"}>
                      {isCompleted ? "Erfolgreich" : "Fehlgeschlagen"}
                    </span>
                    <span>·</span>
                    <span>{getTimeAgo(tx.timestamp)}</span>
                    <span>·</span>
                    <span>Slippage {tx.slippage}%</span>
                  </div>
                </div>

                {tx.txHash && (
                  <a
                    href={`https://etherscan.io/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            );
          })}

          <button
            onClick={clearHistory}
            className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-destructive transition-colors mt-2"
          >
            <Trash2 className="w-3 h-3" />
            Historie löschen
          </button>
        </div>
      )}
    </div>
  );
};

export default SwapHistory;
