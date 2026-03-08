import { createAppKit } from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { mainnet, arbitrum, polygon, optimism, base } from '@reown/appkit/networks';
import { wagmiAdapter, projectId } from '@/lib/wagmi';

const queryClient = new QueryClient();

const metadata = {
  name: 'VortexDEX',
  description: 'Multi-Chain DEX Aggregator',
  url: window.location.origin,
  icons: [],
};

createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, arbitrum, polygon, optimism, base],
  projectId,
  metadata,
  themeMode: 'dark' as const,
  themeVariables: {
    '--w3m-accent': 'hsl(160, 100%, 50%)',
    '--w3m-border-radius-master': '2px',
    '--w3m-font-family': 'ui-monospace, monospace',
  },
});

const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default WalletProvider;
