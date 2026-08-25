import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { connectWallet, disconnectWallet, getBalance, isFreighterAvailable, wasFreighterConnected } from './wallet';
import { track } from './analytics';

const WalletCtx = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [mode, setMode] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState('0.00');

  const fetchBalance = useCallback(async (addr) => {
    if (!addr) return;
    const b = await getBalance(addr);
    setBalance(b);
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const res = await connectWallet();
      setAddress(res.address);
      setMode(res.mode);
      await fetchBalance(res.address);
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
    setBalance('0.00');
    track('wallet_disconnected');
  }, []);

  useEffect(() => {
    async function autoConnect() {
      if (wasFreighterConnected()) {
        const available = await isFreighterAvailable();
        if (available) {
          connect();
        }
      }
    }
    autoConnect();
  }, [connect]);

  useEffect(() => {
    if (!address) return;
    const interval = setInterval(() => fetchBalance(address), 10000);
    return () => clearInterval(interval);
  }, [address, fetchBalance]);

  return (
    <WalletCtx.Provider value={{ address, mode, connecting, error, balance, fetchBalance, connect, disconnect }}>
      {children}
    </WalletCtx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletCtx);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
