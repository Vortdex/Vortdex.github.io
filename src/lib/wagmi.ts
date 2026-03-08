import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum, polygon, optimism, base, defineChain } from '@reown/appkit/networks';

export const projectId = '116281d8d704d57e8ed280382da23d5f';

export const worldchain = defineChain({
  id: 480,
  caipNetworkId: 'eip155:480',
  chainNamespace: 'eip155',
  name: 'World Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://worldchain-mainnet.g.alchemy.com/public'] },
  },
  blockExplorers: {
    default: { name: 'Worldscan', url: 'https://worldscan.org' },
  },
});

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [mainnet, arbitrum, polygon, optimism, base, worldchain],
});

export const config = wagmiAdapter.wagmiConfig;

export const supportedChains = [
  { id: mainnet.id, name: 'Ethereum', symbol: 'ETH', color: 'hsl(220, 60%, 55%)' },
  { id: arbitrum.id, name: 'Arbitrum', symbol: 'ETH', color: 'hsl(210, 80%, 55%)' },
  { id: polygon.id, name: 'Polygon', symbol: 'MATIC', color: 'hsl(265, 80%, 55%)' },
  { id: optimism.id, name: 'Optimism', symbol: 'ETH', color: 'hsl(0, 80%, 55%)' },
  { id: base.id, name: 'Base', symbol: 'ETH', color: 'hsl(220, 80%, 55%)' },
  { id: worldchain.id, name: 'World Chain', symbol: 'ETH', color: 'hsl(160, 70%, 50%)' },
];
