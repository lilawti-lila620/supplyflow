import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import WalletButton from './WalletButton';

const links = [
  { to: '/dashboard', label: 'Manifests' },
  { to: '/create', label: 'New Manifest' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/feedback', label: 'Feedback' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <svg width="28" height="28" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="7" fill="#111C2E" />
            <path d="M16 6 L25 11 L16 16 L7 11 Z" fill="#E8A33D" />
            <path d="M7 11 L7 21 L16 26 L16 16 Z" fill="#3FA796" />
            <path d="M25 11 L25 21 L16 26 L16 16 Z" fill="#F5F1E8" />
          </svg>
          <span className="font-display text-lg font-semibold tracking-tight text-paper">SupplyFlow</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-ink-2 text-amber' : 'text-slate hover:text-mist'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1 text-xs text-slate hover:text-mist"
          >
            Stellar Testnet <ArrowUpRight size={12} />
          </a>
          <WalletButton />
        </div>

        <button className="md:hidden text-mist" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-line bg-ink-2 px-5 py-4 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-ink-3 text-amber' : 'text-mist'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <div className="mt-2">
            <WalletButton full />
          </div>
        </div>
      )}
    </header>
  );
}
