export default function Footer() {
  return (
    <footer className="border-t border-line/70 mt-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="font-display font-semibold text-paper">SupplyFlow</div>
          <p className="text-xs text-slate mt-1 max-w-sm">
            Transparent multi-party payment distribution for supply chains, built on Stellar and Soroban.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate font-mono">
          <span className="h-2 w-2 rounded-full bg-teal animate-pulse" />
          Soroban · Stellar Testnet
        </div>
      </div>
    </footer>
  );
}
