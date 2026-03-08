import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Zap, ChevronDown, Wallet, Power } from 'lucide-react';

const WalletButton = () => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-sm hover:bg-primary/20 transition-all glow-primary"
                  >
                    <Zap className="w-4 h-4" />
                    Wallet verbinden
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive font-mono text-sm hover:bg-destructive/20 transition-all"
                  >
                    Falsches Netzwerk
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  {/* Chain selector */}
                  <button
                    onClick={openChainModal}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/50 border border-border text-foreground font-mono text-xs hover:border-primary/30 transition-all"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <img
                        alt={chain.name ?? 'Chain'}
                        src={chain.iconUrl}
                        className="w-4 h-4 rounded-full"
                      />
                    )}
                    <span className="hidden sm:inline">{chain.name}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>

                  {/* Account */}
                  <button
                    onClick={openAccountModal}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary font-mono text-sm hover:bg-primary/20 transition-all"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>{account.displayName}</span>
                    {account.displayBalance && (
                      <span className="text-muted-foreground text-xs hidden sm:inline">
                        {account.displayBalance}
                      </span>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default WalletButton;
