import { createContext, useCallback, useContext, useState } from 'react';
import { connectWallet, disconnectWallet } from './wallet';
import { track } from './analytics';

const WalletCtx = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [mode, setMode] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const res = await connectWallet();
      setAddress(res.address);
      setMode(res.mode);
      track('wallet_connected', { mode: res.mode });
    } catch (e) {
      setError(e.message || 'Could not connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectWallet();
    setAddress(null);
    setMode(null);
    track('wallet_disconnected');
  }, []);

  return (
    <WalletCtx.Provider value={{ address, mode, connecting, error, connect, disconnect }}>
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
