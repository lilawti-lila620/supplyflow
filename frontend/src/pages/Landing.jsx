import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Eye, ArrowRight, GitBranch, Users2 } from 'lucide-react';
import SplitManifestDiagram from '../components/SplitManifestDiagram';

const heroStakeholders = [
  { role: 'Farmer Collective', share_bps: 5500 },
  { role: 'Cooperative', share_bps: 1500 },
  { role: 'Transporter', share_bps: 1000 },
  { role: 'Exporter', share_bps: 2000 },
];

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Atomic by construction',
    body: 'One Soroban call splits the payment. Either every stakeholder is paid their exact agreed share, or the whole transaction reverts — no partial settlements, ever.',
  },
  {
    icon: Eye,
    title: 'Verifiable, not promised',
    body: 'Distribution rules, wallet addresses, and settlement history live on-chain. Any participant can independently check their share without asking the exporter.',
  },
  {
    icon: Zap,
    title: 'Settled in seconds',
    body: "Stellar's fast finality means a farmer's share lands in their wallet moments after the buyer pays — not at the end of a monthly reconciliation cycle.",
  },
];

const steps = [
  {
    title: 'Create the manifest',
    body: 'An exporter or cooperative defines every stakeholder and their revenue share for a shipment. Shares are locked in and immutable once created.',
  },
  {
    title: 'Buyer funds the order',
    body: 'The buyer sends one payment to the manifest. Nothing routes through an intermediary account.',
  },
  {
    title: 'Contract splits atomically',
    body: 'The Soroban contract distributes the exact agreed share to every stakeholder in the same transaction, and records the settlement permanently.',
  },
  {
    title: 'Everyone verifies',
    body: 'Each participant checks their payout, timestamp, and share directly from the manifest — no trust in a middleman required.',
  },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="ledger-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-5 md:px-8 pt-16 pb-20 md:pt-24 md:pb-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="rise-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-2 px-3 py-1.5 text-xs font-mono text-teal">
              <span className="h-1.5 w-1.5 rounded-full bg-teal" /> Live on Stellar Testnet
            </span>
            <h1 className="mt-5 font-display text-4xl md:text-5xl font-semibold leading-[1.08] text-paper">
              One payment.<br />
              Split <span className="text-amber">exactly</span> as agreed.<br />
              Verified by everyone.
            </h1>
            <p className="mt-5 text-base md:text-lg text-slate max-w-lg">
              SupplyFlow routes buyer payments through a Soroban smart contract that distributes revenue to every
              farmer, cooperative, transporter, and exporter atomically — so nobody has to trust a middleman's
              spreadsheet again.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 rounded-full bg-amber px-5 py-3 text-sm font-semibold text-ink hover:bg-amber-2 transition-colors"
              >
                Explore manifests <ArrowRight size={16} />
              </Link>
              <Link
                to="/create"
                className="flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-semibold text-mist hover:border-amber/40 transition-colors"
              >
                Create a manifest
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-slate font-mono">
              <span className="flex items-center gap-1.5"><Users2 size={14} /> 10+ pilot users onboarded</span>
              <span className="flex items-center gap-1.5"><GitBranch size={14} /> open source</span>
            </div>
          </div>

          <div className="rise-in rounded-2xl border border-line bg-ink-2 p-4 md:p-6" style={{ animationDelay: '0.1s' }}>
            <SplitManifestDiagram stakeholders={heroStakeholders} settled />
          </div>
        </div>
      </section>

      {/* Problem context */}
      <section className="border-y border-line bg-ink-2/50">
        <div className="mx-auto max-w-7xl px-5 md:px-8 py-14">
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p) => (
              <div key={p.title} className="rounded-xl border border-line bg-ink p-6">
                <p.icon size={20} className="text-amber" />
                <h3 className="mt-4 font-display font-semibold text-paper">{p.title}</h3>
                <p className="mt-2 text-sm text-slate leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 py-20">
        <div className="max-w-xl">
          <span className="text-xs font-mono uppercase tracking-widest text-amber">The manifest lifecycle</span>
          <h2 className="mt-3 font-display text-2xl md:text-3xl font-semibold text-paper">
            Four steps from purchase order to verified payout.
          </h2>
        </div>
        <div className="mt-10 grid md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-xl border border-line bg-ink-2 p-5">
              <span className="font-mono text-3xl font-semibold text-line">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 font-display font-semibold text-paper">{s.title}</h3>
              <p className="mt-2 text-sm text-slate leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 pb-24">
        <div className="rounded-2xl border border-amber/30 bg-gradient-to-br from-ink-2 to-ink-3 p-10 md:p-14 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-paper">
            Every stakeholder deserves a receipt they don't have to trust.
          </h2>
          <p className="mt-3 text-sm text-slate max-w-md mx-auto">
            Connect a wallet, create your first manifest, and watch a payment split live on-chain.
          </p>
          <Link
            to="/create"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-ink hover:bg-amber-2 transition-colors"
          >
            Get started <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
