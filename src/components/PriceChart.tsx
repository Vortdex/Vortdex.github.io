import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";

interface OhlcCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface PriceChartProps {
  symbol: string;
  className?: string;
}

const PriceChart = ({ symbol, className = "" }: PriceChartProps) => {
  const [candles, setCandles] = useState<OhlcCandle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchOhlc = async () => {
      if (!symbol) return;
      setLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("token-ohlc", {
          body: { symbol, days: 1 },
        });

        if (cancelled) return;

        if (fnError) {
          setError("Preisdaten nicht verfügbar");
          setCandles([]);
          return;
        }

        if (data?.ohlc && data.ohlc.length > 0) {
          setCandles(data.ohlc);
        } else {
          setCandles([]);
          setError("Keine Daten verfügbar");
        }
      } catch {
        if (!cancelled) setError("Fehler beim Laden");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOhlc();
    const interval = setInterval(fetchOhlc, 120_000); // refresh every 2 min
    return () => { cancelled = true; clearInterval(interval); };
  }, [symbol]);

  const stats = useMemo(() => {
    if (candles.length === 0) return null;
    const first = candles[0];
    const last = candles[candles.length - 1];
    const high = Math.max(...candles.map(c => c.high));
    const low = Math.min(...candles.map(c => c.low));
    const change = ((last.close - first.open) / first.open) * 100;
    return { price: last.close, high, low, change, isUp: change >= 0 };
  }, [candles]);

  const chartHeight = 120;
  const chartWidth = 100; // percentage

  const chartData = useMemo(() => {
    if (candles.length === 0) return null;
    const high = Math.max(...candles.map(c => c.high));
    const low = Math.min(...candles.map(c => c.low));
    const range = high - low || 1;
    const candleWidth = Math.max(2, Math.min(8, (300 / candles.length) * 0.6));
    const gap = Math.max(1, (300 / candles.length) * 0.4);

    return candles.map((c, i) => {
      const x = (i / candles.length) * 100;
      const yOpen = ((high - c.open) / range) * chartHeight;
      const yClose = ((high - c.close) / range) * chartHeight;
      const yHigh = ((high - c.high) / range) * chartHeight;
      const yLow = ((high - c.low) / range) * chartHeight;
      const isUp = c.close >= c.open;

      return { x, yOpen, yClose, yHigh, yLow, isUp, candleWidth, gap };
    });
  }, [candles]);

  if (loading && candles.length === 0) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && candles.length === 0) {
    return (
      <div className={`text-center py-6 text-muted-foreground text-xs font-mono ${className}`}>
        {error}
      </div>
    );
  }

  if (!chartData || !stats) return null;

    return (
    <div className={`rounded-lg border border-border bg-card/50 p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs text-foreground">{symbol}/USD</span>
          <span className="text-[10px] text-muted-foreground font-mono">24h</span>
          {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          {stats.isUp ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={`font-mono text-xs font-bold ${stats.isUp ? "text-primary" : "text-destructive"}`}>
            {stats.change >= 0 ? "+" : ""}{stats.change.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="mb-3">
        <span className="font-mono text-xl font-bold text-foreground">
          ${stats.price < 1 ? stats.price.toFixed(6) : stats.price < 100 ? stats.price.toFixed(2) : stats.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Candlestick Chart */}
      <div className="relative w-full" style={{ height: chartHeight + 20 }}>
        <svg
          width="100%"
          height={chartHeight + 20}
          viewBox={`0 0 300 ${chartHeight + 20}`}
          preserveAspectRatio="none"
          className="overflow-visible"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <line
              key={pct}
              x1="0"
              y1={10 + pct * chartHeight}
              x2="300"
              y2={10 + pct * chartHeight}
              stroke="hsl(var(--border))"
              strokeWidth="0.5"
              strokeDasharray="4 4"
              opacity="0.3"
            />
          ))}

          {/* Candles */}
          {chartData.map((c, i) => {
            const x = (i / chartData.length) * 300;
            const candleW = Math.max(2, (300 / chartData.length) * 0.6);
            const wickX = x + candleW / 2;

            return (
              <g key={i}>
                {/* Wick */}
                <line
                  x1={wickX}
                  y1={10 + c.yHigh}
                  x2={wickX}
                  y2={10 + c.yLow}
                  stroke={c.isUp ? "hsl(160, 100%, 50%)" : "hsl(0, 80%, 55%)"}
                  strokeWidth="1"
                  opacity="0.6"
                />
                {/* Body */}
                <rect
                  x={x}
                  y={10 + Math.min(c.yOpen, c.yClose)}
                  width={candleW}
                  height={Math.max(1, Math.abs(c.yClose - c.yOpen))}
                  fill={c.isUp ? "hsl(160, 100%, 50%)" : "hsl(0, 80%, 55%)"}
                  opacity="0.85"
                  rx="0.5"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* High/Low */}
      <div className="flex items-center justify-between mt-2 text-xs font-mono text-muted-foreground">
        <span>L: ${stats.low < 1 ? stats.low.toFixed(6) : stats.low.toFixed(2)}</span>
        <span>H: ${stats.high < 1 ? stats.high.toFixed(6) : stats.high.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default PriceChart;
