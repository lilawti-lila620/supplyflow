import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Loader2, AlertCircle, Wallet } from 'lucide-react';
import { createManifest } from '../lib/contract';
import { useWallet } from '../lib/WalletContext';
import { useToast } from '../lib/ToastContext';
import { track } from '../lib/analytics';
import SplitManifestDiagram from '../components/SplitManifestDiagram';
import { formatBps } from '../lib/format';

const ROLE_PRESETS = ['Farmer Collective', 'Cooperative', 'Transporter', 'Processor / QC', 'Exporter', 'Distributor'];

function blankStakeholder() {
  return { address: '', role: ROLE_PRESETS[0], share_bps: 0 };
}

export default function CreateManifest() {
  const navigate = useNavigate();
  const { address, connect } = useWallet();
  const { push } = useToast();

  const [label, setLabel] = useState('');
  const [stakeholders, setStakeholders] = useState([
    { address: '', role: 'Farmer Collective', share_bps: 6000 },
    { address: '', role: 'Cooperative', share_bps: 2000 },
    { address: '', role: 'Transporter', share_bps: 2000 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const sum = stakeholders.reduce((s, x) => s + Number(x.share_bps || 0), 0);
  const sumOk = sum === 10000;

  function update(i, field, value) {
    setStakeholders((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }

  function addRow() {
    setStakeholders((prev) => [...prev, blankStakeholder()]);
  }

  function removeRow(i) {
    setStakeholders((prev) => prev.filter((_, idx) => idx !== i));
  }

  function autoBalance() {
    const n = stakeholders.length;
    if (n === 0) return;
    const base = Math.floor(10000 / n);
    const remainder = 10000 - base * n;
    setStakeholders((prev) => prev.map((s, i) => ({ ...s, share_bps: base + (i === n - 1 ? remainder : 0) })));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!address) {
      setFormError('Connect a wallet to create a manifest.');
      return;
    }
    if (!label.trim()) {
      setFormError('Give this manifest a label, e.g. the shipment or lot name.');
      return;
    }
    if (stakeholders.some((s) => !s.address.trim())) {
      setFormError('Every stakeholder needs a wallet address.');
      return;
    }
    if (!sumOk) {
      setFormError('Shares must add up to exactly 100%.');
      return;
    }

    setSubmitting(true);
    try {
      const { id, hash } = await createManifest({
        buyer: address,
        label: label.trim(),
        stakeholders: stakeholders.map((s) => ({ ...s, share_bps: Number(s.share_bps) })),
      });
      push(
        <span>
          Manifest created and shares locked on-chain.{' '}
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            View TX
          </a>
        </span>,
        'success'
      );
      track('manifest_created', { id, stakeholderCount: stakeholders.length });
      navigate(`/manifest/${id}`);
    } catch (err) {
      setFormError(err.message || 'Could not create manifest');
    } finally {
      setSubmitting(false);
    }
  }

  const previewStakeholders = stakeholders.filter((s) => s.share_bps > 0);

  return (
    <div className="mx-auto max-w-6xl px-5 md:px-8 py-10">
      <span className="text-xs font-mono uppercase tracking-widest text-amber">New manifest</span>
      <h1 className="mt-2 font-display text-2xl md:text-3xl font-semibold text-paper">Define this shipment's revenue split</h1>
      <p className="mt-2 text-sm text-slate max-w-xl">
        Shares are locked in the moment this manifest is created. Once a buyer funds it, the contract distributes
        every stakeholder's exact share atomically.
      </p>

      <div className="mt-8 grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {!address && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3">
              <span className="text-sm text-amber flex items-center gap-2"><Wallet size={16} /> Connect a wallet to submit this manifest</span>
              <button type="button" onClick={connect} className="rounded-full bg-amber px-3 py-1.5 text-xs font-semibold text-ink">
                Connect
              </button>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate">Manifest label</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Arabica Lot #KL-118 — Kilimanjaro Cooperative"
              className="mt-1.5 w-full rounded-lg border border-line bg-ink-2 px-3.5 py-2.5 text-sm text-mist placeholder:text-slate/60 focus:border-amber/50 outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate">Stakeholders & revenue share</label>
              <button type="button" onClick={autoBalance} className="text-xs text-amber hover:underline">
                Split evenly
              </button>
            </div>

            <div className="mt-2 space-y-3">
              {stakeholders.map((s, i) => (
                <div key={i} className="rounded-lg border border-line bg-ink-2 p-3.5">
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <input
                      value={s.address}
                      onChange={(e) => update(i, 'address', e.target.value)}
                      placeholder="Stellar wallet address (G…)"
                      className="rounded-md border border-line bg-ink px-3 py-2 text-xs font-mono text-mist placeholder:text-slate/60 focus:border-amber/50 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      disabled={stakeholders.length <= 1}
                      className="rounded-md border border-line px-2.5 text-slate hover:text-rust hover:border-rust/40 disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-2.5 grid grid-cols-[1fr_auto] gap-3 items-center">
                    <select
                      value={s.role}
                      onChange={(e) => update(i, 'role', e.target.value)}
                      className="rounded-md border border-line bg-ink px-3 py-2 text-xs text-mist focus:border-amber/50 outline-none"
                    >
                      {ROLE_PRESETS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="100"
                        value={s.share_bps}
                        onChange={(e) => update(i, 'share_bps', Number(e.target.value))}
                        className="w-28 accent-amber"
                      />
                      <span className="w-14 text-right font-mono text-xs text-amber">{formatBps(s.share_bps)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-mist hover:text-amber"
            >
              <Plus size={14} /> Add stakeholder
            </button>

            <div className={`mt-3 flex items-center justify-between rounded-lg border px-3.5 py-2 text-xs font-mono ${sumOk ? 'border-teal/30 bg-teal/5 text-teal' : 'border-rust/30 bg-rust/5 text-rust'}`}>
              <span>Total allocated</span>
              <span>{formatBps(sum)} {!sumOk && '(must equal 100%)'}</span>
            </div>
          </div>

          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-rust/30 bg-rust/5 px-3.5 py-2.5 text-sm text-rust">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-amber py-3 text-sm font-semibold text-ink hover:bg-amber-2 transition-colors disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? 'Locking shares on-chain…' : 'Create manifest'}
          </button>
        </form>

        <div>
          <div className="sticky top-24 rounded-xl border border-line bg-ink-2 p-5">
            <span className="text-xs font-mono uppercase tracking-widest text-slate">Live preview</span>
            {previewStakeholders.length > 0 ? (
              <SplitManifestDiagram stakeholders={previewStakeholders} animate={false} />
            ) : (
              <p className="mt-6 text-sm text-slate">Add stakeholders to preview the split.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
