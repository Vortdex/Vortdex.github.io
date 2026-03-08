import { useAppKit } from '@reown/appkit/react';
import { Globe } from 'lucide-react';

const WorldWalletButton = () => {
  const { open } = useAppKit();

  return (
    <button
      onClick={() => open({ view: 'Connect' })}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-secondary/30 bg-secondary/5 hover:bg-secondary/10 hover:border-secondary/50 transition-all text-xs font-mono text-secondary"
      title="Mit World App verbinden"
    >
      <Globe className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">World App</span>
    </button>
  );
};

export default WorldWalletButton;
