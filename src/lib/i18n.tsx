import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Locale = "de" | "en";

const translations = {
  de: {
    // Navbar
    nav_swap: "Swap",
    nav_bridge: "Bridge",
    nav_limit: "Limit",
    nav_protocols: "Protokolle",
    nav_liquidity: "Liquidität",

    // Hero
    hero_status: "System Online",
    hero_h1_1: "Best Execution.",
    hero_h1_2: "Zwei Protokolle,",
    hero_h1_3: "ein Interface.",
    hero_desc: "ZK-Rollups + {opendex} AMM — kombiniert für die beste Quote.",
    hero_cta: "⟐ Jetzt traden",
    hero_cta2: "Protokolle →",
    hero_card_zk: "ZK-gesichert",
    hero_card_zk_desc: "Ethereum-Sicherheit via ZK-Proofs",
    hero_card_swap: "Instant Swaps",
    hero_card_swap_desc: "AMM-Pools für sofortige Swaps",
    hero_card_multi: "Multi-Chain",
    hero_card_multi_desc: "EVM + Alephium Support",

    // Limit
    limit_title: "Limit",
    limit_subtitle: "via Loopring ZK-Rollup Orderbook",
    limit_price: "Limit-Preis",
    limit_amount: "Menge",
    limit_total: "Total",
    limit_fee: "Fee (0.1%)",
    limit_security: "Loopring ZK-Rollup — Ethereum L1 Sicherheit",

    // Protocols
    proto_title_1: "Zwei Protokolle.",
    proto_title_2: "Ein Ziel.",
    proto_subtitle: "Intelligentes Routing zwischen Loopring und OpenDEX.",
    proto_loopring_desc: "Nicht-kustodiales Orderbook auf Ethereum L2 mit ZK-Proofs für maximale Sicherheit.",
    proto_loopring_f1: "ZK-Rollups",
    proto_loopring_f2: "Ethereum-Level Sicherheit",
    proto_loopring_f3: "Orderbook mit hoher Tiefe",
    proto_loopring_f4: "Limit & Stop-Orders",
    proto_loopring_best: "Limit-Orders, institutionelle Trades",
    proto_opendex_desc: "UniV2/V3-kompatibles AMM für Instant-Swaps und Liquidity-Pools auf allen EVM-Chains.",
    proto_opendex_f1: "Instant Token-Swaps",
    proto_opendex_f2: "Multi-Chain Support",
    proto_opendex_f3: "LP Providing",
    proto_opendex_f4: "Open-Source (MIT)",
    proto_opendex_best: "Instant-Swaps, Liquidity-Providing",
    proto_ideal: "Ideal für: ",

    // Liquidity
    liq_title_1: "Aggregierte",
    liq_title_2: "Liquidität",
    liq_subtitle: "Kombinierte Tiefe aus Loopring Orderbooks und OpenDEX AMM-Pools.",
    liq_users: "Nutzer",
    liq_top_pools: "Top Pools",
    liq_pair: "Paar",
    liq_source: "Quelle",

    // Footer
    footer_license: "OPEN-SOURCE • NON-CUSTODIAL • MIT LIZENZ",

    // World wallet
    world_app: "World App",
  },
  en: {
    nav_swap: "Swap",
    nav_bridge: "Bridge",
    nav_limit: "Limit",
    nav_protocols: "Protocols",
    nav_liquidity: "Liquidity",

    hero_status: "System Online",
    hero_h1_1: "Best Execution.",
    hero_h1_2: "Two Protocols,",
    hero_h1_3: "One Interface.",
    hero_desc: "ZK-Rollups + {opendex} AMM — combined for the best quote.",
    hero_cta: "⟐ Trade Now",
    hero_cta2: "Protocols →",
    hero_card_zk: "ZK-Secured",
    hero_card_zk_desc: "Ethereum security via ZK-Proofs",
    hero_card_swap: "Instant Swaps",
    hero_card_swap_desc: "AMM pools for instant swaps",
    hero_card_multi: "Multi-Chain",
    hero_card_multi_desc: "EVM + Alephium Support",

    limit_title: "Limit",
    limit_subtitle: "via Loopring ZK-Rollup Orderbook",
    limit_price: "Limit Price",
    limit_amount: "Amount",
    limit_total: "Total",
    limit_fee: "Fee (0.1%)",
    limit_security: "Loopring ZK-Rollup — Ethereum L1 Security",

    proto_title_1: "Two Protocols.",
    proto_title_2: "One Goal.",
    proto_subtitle: "Intelligent routing between Loopring and OpenDEX.",
    proto_loopring_desc: "Non-custodial orderbook on Ethereum L2 with ZK-Proofs for maximum security.",
    proto_loopring_f1: "ZK-Rollups",
    proto_loopring_f2: "Ethereum-Level Security",
    proto_loopring_f3: "Deep Orderbook Liquidity",
    proto_loopring_f4: "Limit & Stop Orders",
    proto_loopring_best: "Limit orders, institutional trades",
    proto_opendex_desc: "UniV2/V3-compatible AMM for instant swaps and liquidity pools on all EVM chains.",
    proto_opendex_f1: "Instant Token Swaps",
    proto_opendex_f2: "Multi-Chain Support",
    proto_opendex_f3: "LP Providing",
    proto_opendex_f4: "Open-Source (MIT)",
    proto_opendex_best: "Instant swaps, liquidity providing",
    proto_ideal: "Ideal for: ",

    liq_title_1: "Aggregated",
    liq_title_2: "Liquidity",
    liq_subtitle: "Combined depth from Loopring orderbooks and OpenDEX AMM pools.",
    liq_users: "Users",
    liq_top_pools: "Top Pools",
    liq_pair: "Pair",
    liq_source: "Source",

    footer_license: "OPEN-SOURCE • NON-CUSTODIAL • MIT LICENSE",

    world_app: "World App",
  },
} as const;

type TranslationKey = keyof typeof translations.de;

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "de",
  setLocale: () => {},
  t: (key) => key,
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("vortex-lang");
    return (saved === "en" || saved === "de") ? saved : "de";
  });

  const handleSetLocale = useCallback((l: Locale) => {
    setLocale(l);
    localStorage.setItem("vortex-lang", l);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[locale][key] ?? key,
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};
