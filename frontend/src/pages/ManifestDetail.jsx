import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Copy, Check, Loader2, CircleDollarSign, Ban, ShieldCheck } from 'lucide-react';
import { getManifest, fundAndDistribute, cancelManifest, isLiveContract, CONTRACT_ID } from '../lib/contract';
import { useWallet } from '../lib/WalletContext';
import { useToast } from '../lib/ToastContext';
import { track } from '../lib/analytics';
import SplitManifestDiagram from '../components/SplitManifestDiagram';
import { LoadingState, ErrorState } from '../components/States';
import { formatAddress, formatBps, formatDate, formatXLM, shortId } from '../lib/format';

function CopyableAddress({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1.5 font-mono text-xs text-slate hover:text-mist"
      title={value}
    >
      {formatAddress(value)}
      {copied ? <Check size={12} className="text-teal" /> : <Copy size={12} />}
    </button>
  );
}

export default function ManifestDetail() {
  const { id } = useParams();
  const { address, connect } = useWallet();
  const { push } = useToast();

  const [manifest, setManifest] = useState(null);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setError(null);
    try {
      const m = await getManifest(Number(id));
      setManifest(m);
    } catch (e) {
      setError(e.message || 'Manifest not found');
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleFund(e) {
    e.preventDefault();
    if (!address) return connect();
    const stroops = Math.round(Number(amount) * 10_000_000);
    if (!stroops || stroops <= 0) return push('Enter an amount greater than 0.', 'error');
    setBusy(true);
    try {
      await fundAndDistribute({ manifestId: Number(id), amountStroops: stroops });
      push('Payment distributed atomically to every stakeholder.', 'success');
      track('manifest_funded', { id: Number(id), amountStroops: stroops });
      await load();
    } catch (err) {
      push(err.message || 'Distribution failed', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    try {
      await cancelManifest(Number(id));
      push('Manifest cancelled.', 'info');
      await load();
    } catch (err) {
      push(err.message || 'Could not cancel', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-5 md:px-8 py-14">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }
  if (!manifest) {
    return <LoadingState label="Fetching manifest from the ledger…" />;
  }

  const settled = manifest.status === 'Settled';

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-10">
      <div className="flex items-center gap-2 text-xs text-slate">
        <Link to="/dashboard" className="hover:text-mist">Manifests</Link>
        <span>/</span>
        <span className="font-mono">{shortId(manifest.id)}</span>
      </div>

      <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-paper">{manifest.label}</h1>
        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${
            settled
              ? 'border-teal/30 bg-teal/10 text-teal'
              : manifest.status === 'Cancelled'
                ? 'border-rust/30 bg-rust/10 text-rust'
                : 'border-amber/30 bg-amber/10 text-amber'
          }`}
        >
          {manifest.status}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate">
        <span>Created {formatDate(manifest.created_at)}</span>
        <span>Buyer <CopyableAddress value={manifest.buyer} /></span>
        {CONTRACT_ID && <span>Contract <CopyableAddress value={CONTRACT_ID} /></span>}
      </div>

      <div className="mt-8 grid lg:grid-cols-[1.15fr_0.85fr] gap-8">
        <div className="rounded-xl border border-line bg-ink-2 p-4 md:p-6">
          <SplitManifestDiagram stakeholders={manifest.stakeholders} settled={settled} />
        </div>

        <div className="space-y-5">
          {manifest.status === 'Open' && (
            <div className="rounded-xl border border-line bg-ink-2 p-5">
              <h3 className="flex items-center gap-2 font-display font-semibold text-paper">
                <CircleDollarSign size={17} className="text-amber" /> Fund & distribute
              </h3>
              <p className="mt-1.5 text-xs text-slate">
                Sends the payment through the contract, which splits it atomically to every stakeholder above.
              </p>
              <form onSubmit={handleFund} className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount"
                    className="flex-1 rounded-lg border border-line bg-ink px-3.5 py-2.5 text-sm font-mono text-mist outline-none focus:border-amber/50"
                  />
                  <span className="text-xs font-mono text-slate">XLM</span>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="flex items-center justify-center gap-2 rounded-full bg-amber py-2.5 text-sm font-semibold text-ink hover:bg-amber-2 transition-colors disabled:opacity-60"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : null}
                  {address ? (busy ? 'Distributing…' : 'Fund & Distribute') : 'Connect wallet to fund'}
                </button>
              </form>
              <button
                onClick={handleCancel}
                disabled={busy}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-line py-2 text-xs text-slate hover:text-rust hover:border-rust/40"
              >
                <Ban size={13} /> Cancel manifest
              </button>
            </div>
          )}

          {settled && (
            <div className="rounded-xl border border-teal/30 bg-teal/5 p-5">
              <h3 className="flex items-center gap-2 font-display font-semibold text-teal">
                <ShieldCheck size={17} /> Settlement receipt
              </h3>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-slate">Total distributed</span>
                <span className="font-mono text-teal">{formatXLM(manifest.settlement.total_amount)} XLM</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-slate">Settled</span>
                <span className="font-mono text-mist">{formatDate(manifest.settlement.settled_at)}</span>
              </div>
              <div className="mt-4 space-y-2">
                {(manifest.settlement.payouts || []).map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-ink-2 px-3 py-2 text-xs">
                    <div>
                      <div className="text-mist">{p.role}</div>
                      <CopyableAddress value={p.address} />
                    </div>
                    <span className="font-mono text-teal">
                      {formatXLM(p.amount)} XLM · {formatBps(p.share_bps)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-line bg-ink-2 p-5">
            <h3 className="font-display font-semibold text-paper text-sm">Stakeholders ({manifest.stakeholders.length})</h3>
            <div className="mt-3 space-y-2">
              {manifest.stakeholders.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-ink px-3 py-2 text-xs">
                  <div>
                    <div className="text-mist">{s.role}</div>
                    <CopyableAddress value={s.address} />
                  </div>
                  <span className="font-mono text-amber">{formatBps(s.share_bps)}</span>
                </div>
              ))}
            </div>
          </div>

          {!isLiveContract() && (
            <p className="text-[11px] text-slate/70 leading-relaxed">
              This environment is running against a local ledger simulation that enforces the same rules as the
              deployed contract. Set <code className="font-mono">VITE_CONTRACT_ID</code> to point the app at a live
              testnet deployment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
