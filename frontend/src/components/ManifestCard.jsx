import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { formatXLM, shortId, timeAgo } from '../lib/format';

const statusStyles = {
  Open: 'bg-amber/15 text-amber border-amber/30',
  Settled: 'bg-teal/15 text-teal border-teal/30',
  Cancelled: 'bg-rust/15 text-rust border-rust/30',
};

export default function ManifestCard({ manifest }) {
  return (
    <Link
      to={`/manifest/${manifest.id}`}
      className="group block rounded-xl border border-line bg-ink-2 p-5 transition-all hover:border-amber/40 hover:bg-ink-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-xs text-slate">{shortId(manifest.id)}</span>
          <h3 className="mt-1 font-display text-base font-semibold text-paper leading-snug">{manifest.label}</h3>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${statusStyles[manifest.status]}`}>
          {manifest.status}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate">
        <span className="flex items-center gap-1.5">
          <Users size={13} /> {manifest.stakeholders.length} stakeholders
        </span>
        <span>{timeAgo(manifest.created_at)}</span>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <div>
          {manifest.settlement ? (
            <span className="font-mono text-sm text-teal">{formatXLM(manifest.settlement.total_amount)} XLM settled</span>
          ) : (
            <span className="font-mono text-sm text-slate">awaiting funding</span>
          )}
        </div>
        <span className="flex items-center gap-1 text-xs font-medium text-amber opacity-0 group-hover:opacity-100 transition-opacity">
          View manifest <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}
