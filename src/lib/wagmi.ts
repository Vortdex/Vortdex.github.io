import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, arbitrum, polygon, optimism, base } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'VortexDEX',
  projectId: 'demo-project-id', // WalletConnect Cloud Project ID - replace for production
  chains: [mainnet, arbitrum, polygon, optimism, base],
  ssr: false,
});

export const supportedChains = [
  { id: mainnet.id, name: 'Ethereum', symbol: 'ETH', color: 'hsl(220, 60%, 55%)' },
  { id: arbitrum.id, name: 'Arbitrum', symbol: 'ETH', color: 'hsl(210, 80%, 55%)' },
  { id: polygon.id, name: 'Polygon', symbol: 'MATIC', color: 'hsl(265, 80%, 55%)' },
  { id: optimism.id, name: 'Optimism', symbol: 'ETH', color: 'hsl(0, 80%, 55%)' },
  { id: base.id, name: 'Base', symbol: 'ETH', color: 'hsl(220, 80%, 55%)' },
];
