import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layers, CheckCircle2, Clock, Users } from 'lucide-react';
import { listManifests, getStats } from '../lib/contract';
import ManifestCard from '../components/ManifestCard';
import StatCard from '../components/StatCard';
import { LoadingState, EmptyState, ErrorState } from '../components/States';
import { formatXLM } from '../lib/format';

export default function Dashboard() {
  const [manifests, setManifests] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  async function load() {
    setError(null);
    setManifests(null);
    try {
      const [m, s] = await Promise.all([listManifests(), getStats()]);
      setManifests(m);
      setStats(s);
    } catch (e) {
      setError(e.message || 'Failed to load manifests');
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = manifests?.filter((m) => filter === 'All' || m.status === filter);

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-amber">Manifests</span>
          <h1 className="mt-2 font-display text-2xl md:text-3xl font-semibold text-paper">Payment distribution activity</h1>
        </div>
        <Link
          to="/create"
          className="flex items-center justify-center gap-2 rounded-full bg-amber px-4 py-2.5 text-sm font-semibold text-ink hover:bg-amber-2 transition-colors"
        >
          <Plus size={16} /> New manifest
        </Link>
      </div>

      {stats && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total manifests" value={stats.manifestCount} icon={Layers} accent="mist" />
          <StatCard label="Settled" value={stats.settledCount} icon={CheckCircle2} accent="teal" />
          <StatCard label="Awaiting funding" value={stats.openCount} icon={Clock} accent="amber" />
          <StatCard label="Participants" value={stats.participantCount} icon={Users} accent="mist" />
        </div>
      )}

      {stats && (
        <div className="mt-4 rounded-xl border border-line bg-ink-2 px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-slate">Total distributed on-chain</span>
          <span className="font-mono text-lg font-semibold text-teal">{formatXLM(stats.totalDistributed)} XLM</span>
        </div>
      )}

      <div className="mt-8 flex items-center gap-2">
        {['All', 'Open', 'Settled', 'Cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors ${
              filter === f ? 'border-amber/50 bg-amber/10 text-amber' : 'border-line text-slate hover:text-mist'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {error && <ErrorState message={error} onRetry={load} />}
        {!error && manifests === null && <LoadingState label="Reading manifests from the ledger…" />}
        {!error && filtered && filtered.length === 0 && (
          <EmptyState
            title="No manifests here yet"
            body="Create your first payment manifest to define how a shipment's revenue is shared."
            action={
              <Link to="/create" className="rounded-full bg-amber px-4 py-2 text-xs font-semibold text-ink">
                Create a manifest
              </Link>
            }
          />
        )}
        {!error && filtered && filtered.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((m) => (
              <ManifestCard key={m.id} manifest={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
