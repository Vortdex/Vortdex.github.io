import { useState } from "react";
import { Clock, CheckCircle2, XCircle, Loader2, ArrowRight, Trash2 } from "lucide-react";

export interface BridgeTransaction {
  id: string;
  fromChain: string;
  toChain: string;
  token: string;
  amount: string;
  status: "pending" | "confirming" | "completed" | "failed";
  timestamp: Date;
  estimatedTime: string;
  txHash?: string;
}

// Local storage key
const STORAGE_KEY = "vortexdex_bridge_history";

export const loadBridgeHistory = (): BridgeTransaction[] => {
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

export const saveBridgeHistory = (txns: BridgeTransaction[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(txns));
};

export const addBridgeTransaction = (tx: Omit<BridgeTransaction, "id" | "timestamp">): BridgeTransaction => {
  const newTx: BridgeTransaction = {
    ...tx,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  };
  const history = loadBridgeHistory();
  history.unshift(newTx);
  saveBridgeHistory(history.slice(0, 50)); // Keep last 50
  return newTx;
};

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Ausstehend",
    color: "text-muted-foreground",
    bg: "bg-muted/30",
  },
  confirming: {
    icon: Loader2,
    label: "Bestätigung...",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  completed: {
    icon: CheckCircle2,
    label: "Abgeschlossen",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  failed: {
    icon: XCircle,
    label: "Fehlgeschlagen",
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
};

const BridgeHistory = () => {
  const [transactions, setTransactions] = useState<BridgeTransaction[]>(loadBridgeHistory);
  const [expanded, setExpanded] = useState(true);

  const clearHistory = () => {
    setTransactions([]);
    saveBridgeHistory([]);
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
          Bridge-Historie ({transactions.length})
        </span>
        <span className="text-xs">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="space-y-2">
          {transactions.slice(0, 5).map((tx) => {
            const config = statusConfig[tx.status];
            const StatusIcon = config.icon;
            const timeAgo = getTimeAgo(tx.timestamp);

            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border"
              >
                <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                  <StatusIcon className={`w-4 h-4 ${config.color} ${tx.status === "confirming" ? "animate-spin" : ""}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-mono text-foreground">
                    <span>{tx.amount} {tx.token}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">
                      {tx.fromChain} → {tx.toChain}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className={config.color}>{config.label}</span>
                    <span>·</span>
                    <span>{timeAgo}</span>
                    {tx.estimatedTime && tx.status !== "completed" && tx.status !== "failed" && (
                      <>
                        <span>·</span>
                        <span>~{tx.estimatedTime}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {transactions.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-destructive transition-colors mt-2"
            >
              <Trash2 className="w-3 h-3" />
              Historie löschen
            </button>
          )}
        </div>
      )}
    </div>
  );
};

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Gerade eben";
  if (mins < 60) return `vor ${mins} Min.`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} T.`;
}

export default BridgeHistory;
