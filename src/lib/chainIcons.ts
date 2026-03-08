import ethereumIcon from '@/assets/chains/ethereum.png';
import arbitrumIcon from '@/assets/chains/arbitrum.png';
import polygonIcon from '@/assets/chains/polygon.png';
import optimismIcon from '@/assets/chains/optimism.png';
import baseIcon from '@/assets/chains/base.png';
import worldchainIcon from '@/assets/chains/worldchain.png';
import alephiumIcon from '@/assets/chains/alephium.png';

export const chainIcons: Record<number | string, string> = {
  1: ethereumIcon,
  42161: arbitrumIcon,
  137: polygonIcon,
  10: optimismIcon,
  8453: baseIcon,
  480: worldchainIcon,
  alephium: alephiumIcon,
};
