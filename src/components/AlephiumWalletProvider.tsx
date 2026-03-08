/**
 * AlephiumWalletContext — Provides Alephium wallet connection state
 * using @alephium/web3-react alongside the existing EVM wagmi setup.
 */
import { AlephiumWalletProvider as AlphProvider, AlephiumConnectButton } from '@alephium/web3-react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { web3 } from '@alephium/web3';

interface AlephiumWalletState {
  address: string | undefined;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const AlephiumWalletContext = createContext<AlephiumWalletState>({
  address: undefined,
  isConnected: false,
  connect: () => {},
  disconnect: () => {},
});

export const useAlephiumWallet = () => useContext(AlephiumWalletContext);

/** Inner component that reads Alephium connection state via the connect button's render prop */
const AlephiumStateReader = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AlephiumWalletState>({
    address: undefined,
    isConnected: false,
    connect: () => {},
    disconnect: () => {},
  });

  return (
    <AlephiumConnectButton.Custom>
      {({ isConnected, disconnect, show, account }) => {
        // Sync state on render (the custom render prop is the only way to read connection state)
        const newState: AlephiumWalletState = {
          address: account?.address,
          isConnected,
          connect: show,
          disconnect,
        };

        // Only update if actually changed to avoid infinite loops
        if (
          newState.address !== state.address ||
          newState.isConnected !== state.isConnected
        ) {
          // Use queueMicrotask to avoid setState during render
          queueMicrotask(() => setState(newState));
        }

        return (
          <AlephiumWalletContext.Provider value={{ ...state, connect: show, disconnect }}>
            {children}
          </AlephiumWalletContext.Provider>
        );
      }}
    </AlephiumConnectButton.Custom>
  );
};

/** Wrap the app with Alephium wallet support */
const AlephiumWalletProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <AlphProvider
      theme="retro"
      network="mainnet"
      addressGroup={0}
    >
      <AlephiumStateReader>
        {children}
      </AlephiumStateReader>
    </AlphProvider>
  );
};

export default AlephiumWalletProvider;
