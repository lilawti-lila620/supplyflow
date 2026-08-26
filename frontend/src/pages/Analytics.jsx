import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Activity, Clock3, Download } from 'lucide-react';
import { listManifests, getStats } from '../lib/contract';
import { getEvents } from '../lib/analytics';
import StatCard from '../components/StatCard';
import { LoadingState } from '../components/States';
import { formatXLM } from '../lib/format';

const PALETTE = ['#E8A33D', '#3FA796', '#8792A3', '#D6553D', '#C97F1E', '#2C7E71'];

function tooltipStyle() {
  return {
    background: '#111C2E',
    border: '1px solid #26334A',
    borderRadius: 8,
    fontSize: 12,
    color: '#C7D0DE',
    fontFamily: 'JetBrains Mono, monospace',
  };
}

export default function Analytics() {
  const [manifests, setManifests] = useState(null);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    Promise.all([listManifests(), getStats()]).then(([m, s]) => {
      setManifests(m);
      setStats(s);
    });
    setEvents(getEvents());
  }, []);

  const timeline = useMemo(() => {
    if (!manifests) return [];
    const settled = manifests
      .filter((m) => m.settlement)
      .sort((a, b) => a.settlement.settled_at - b.settlement.settled_at);
    let running = 0;
    return settled.map((m) => {
      running += m.settlement.total_amount / 10_000_000;
      return {
        date: new Date(m.settlement.settled_at * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        cumulative: Math.round(running),
        amount: Math.round(m.settlement.total_amount / 10_000_000),
      };
    });
  }, [manifests]);

  const roleTotals = useMemo(() => {
    if (!manifests) return [];
    const totals = {};
    manifests.forEach((m) => {
      if (!m.settlement) return;
      m.settlement.payouts?.forEach((p) => {
        totals[p.role] = (totals[p.role] || 0) + Number(p.amount) / 10_000_000;
      });
    });
    return Object.entries(totals)
      .map(([role, value]) => ({ role, value: Math.round(value) }))
      .sort((a, b) => b.value - a.value);
  }, [manifests]);

  const statusCounts = useMemo(() => {
    if (!manifests) return [];
    const counts = { Open: 0, Settled: 0, Cancelled: 0 };
    manifests.forEach((m) => (counts[m.status] = (counts[m.status] || 0) + 1));
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [manifests]);

  if (!manifests || !stats) return <LoadingState label="Aggregating on-chain settlement data…" />;

  function exportCSV() {
    if (!manifests) return;
    const header = "ID,Label,Status,Total Amount (XLM),Created At\n";
    const rows = manifests.map(m => {
      const amount = m.settlement ? m.settlement.total_amount / 10_000_000 : 0;
      return `${m.id},"${m.label}",${m.status},${amount},${new Date(m.created_at * 1000).toLocaleDateString()}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'manifests_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl px-5 md:px-8 py-10">
      <span className="text-xs font-mono uppercase tracking-widest text-amber">Analytics</span>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-2xl md:text-3xl font-semibold text-paper">Distribution performance</h1>
        <button onClick={exportCSV} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-slate hover:text-mist">
          <Download size={13} /> Export CSV
        </button>
      </div>
      <p className="mt-2 text-sm text-slate max-w-xl">
        Aggregated directly from on-chain settlement events — every number below traces back to a manifest a
        participant can independently verify.
      </p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total distributed" value={`${formatXLM(stats.totalDistributed)} XLM`} accent="teal" />
        <StatCard label="Settlements" value={stats.settledCount} accent="mist" />
        <StatCard label="Avg. settle time" value={`${stats.avgSettleSeconds}s`} icon={Clock3} accent="amber" />
        <StatCard label="Active participants" value={stats.participantCount} icon={Activity} accent="mist" />
      </div>

      <div className="mt-8 grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="rounded-xl border border-line bg-ink-2 p-5">
          <h3 className="font-display font-semibold text-paper text-sm">Cumulative value distributed (XLM)</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="amberFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8A33D" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#E8A33D" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#26334A" strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="date" stroke="#8792A3" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8792A3" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle()} />
                <Area type="monotone" dataKey="cumulative" stroke="#E8A33D" strokeWidth={2} fill="url(#amberFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-ink-2 p-5">
          <h3 className="font-display font-semibold text-paper text-sm">Manifests by status</h3>
          <div className="mt-4 h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusCounts} dataKey="count" nameKey="status" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {statusCounts.map((entry, i) => (
                    <Cell key={entry.status} fill={PALETTE[i % PALETTE.length]} stroke="#0B1220" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {statusCounts.map((s, i) => (
              <span key={s.status} className="flex items-center gap-1.5 text-xs text-slate">
                <span className="h-2 w-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                {s.status} ({s.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-ink-2 p-5">
        <h3 className="font-display font-semibold text-paper text-sm">Value distributed by stakeholder role (XLM)</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roleTotals} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke="#26334A" strokeDasharray="3 4" horizontal={false} />
              <XAxis type="number" stroke="#8792A3" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="role" stroke="#8792A3" fontSize={11} tickLine={false} axisLine={false} width={150} />
              <Tooltip contentStyle={tooltipStyle()} cursor={{ fill: '#17233A' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {roleTotals.map((entry, i) => (
                  <Cell key={entry.role} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-line bg-ink-2 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-paper text-sm">Recent activity (client monitoring)</h3>
          <span className="text-[11px] font-mono text-slate">{events.length} events logged this session</span>
        </div>
        <p className="mt-1 text-xs text-slate">
          Every wallet connection, manifest creation, funding, and error in this browser is logged here — the
          hook point for wiring in Sentry, PostHog, or Plausible in production.
        </p>
        <div className="mt-4 max-h-64 overflow-y-auto space-y-1.5">
          {events.length === 0 && <p className="text-xs text-slate/70">No events yet — interact with the app to populate this.</p>}
          {events.map((e, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-ink px-3 py-2 text-xs">
              <span className={`font-mono ${e.event === 'error' ? 'text-rust' : 'text-mist'}`}>{e.event}</span>
              <span className="text-slate">{new Date(e.at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
