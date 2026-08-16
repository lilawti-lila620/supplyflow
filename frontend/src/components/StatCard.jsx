export default function StatCard({ label, value, sub, icon: Icon, accent = 'amber' }) {
  const accents = {
    amber: 'text-amber',
    teal: 'text-teal',
    mist: 'text-mist',
  };
  return (
    <div className="rounded-xl border border-line bg-ink-2 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-slate">{label}</span>
        {Icon && <Icon size={16} className={accents[accent]} />}
      </div>
      <div className={`mt-2 font-display text-2xl font-semibold ${accents[accent]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate">{sub}</div>}
    </div>
  );
}
