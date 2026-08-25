import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { useWallet } from '../lib/WalletContext';
import { formatAddress } from '../lib/format';

export default function WalletButton({ full = false }) {
  const { address, mode, connecting, connect, disconnect, balance } = useWallet();

  if (address) {
    return (
      <button
        onClick={disconnect}
        className={`group flex items-center gap-2 rounded-full border border-line bg-ink-2 px-3.5 py-2 text-sm font-mono text-mist hover:border-rust/50 hover:text-rust transition-colors ${full ? 'w-full justify-center' : ''}`}
        title="Disconnect wallet"
      >
        <span className={`h-2 w-2 rounded-full ${mode === 'freighter' ? 'bg-teal' : 'bg-amber'}`} />
        <span>{balance} XLM</span>
        <span className="text-mist-2 opacity-60 px-1">|</span>
        {formatAddress(address)}
        <LogOut size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={connecting}
      className={`flex items-center gap-2 rounded-full bg-amber px-4 py-2 text-sm font-semibold text-ink hover:bg-amber-2 transition-colors disabled:opacity-60 ${full ? 'w-full justify-center' : ''}`}
    >
      {connecting ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
      {connecting ? 'Connecting…' : 'Connect Wallet'}
    </button>
  );
}
