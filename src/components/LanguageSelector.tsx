import { useI18n, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";

const flags: Record<Locale, string> = { de: "🇩🇪", en: "🇬🇧" };

const LanguageSelector = () => {
  const { locale, setLocale } = useI18n();

  const toggle = () => setLocale(locale === "de" ? "en" : "de");

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-primary/20 transition-all text-xs font-mono"
      title={locale === "de" ? "Switch to English" : "Auf Deutsch wechseln"}
    >
      <Globe className="w-3 h-3 text-muted-foreground" />
      <span>{flags[locale]}</span>
      <span className="hidden sm:inline uppercase text-muted-foreground">{locale}</span>
    </button>
  );
};

export default LanguageSelector;
