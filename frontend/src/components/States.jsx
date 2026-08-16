import { Loader2, Inbox, AlertTriangle } from 'lucide-react';

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate">
      <Loader2 size={26} className="animate-spin text-amber" />
      <p className="text-sm font-mono">{label}</p>
    </div>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line py-16 px-6 text-center">
      <Inbox size={28} className="text-slate" />
      <h3 className="font-display text-lg font-semibold text-paper">{title}</h3>
      {body && <p className="max-w-sm text-sm text-slate">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-rust/30 bg-rust/5 py-14 px-6 text-center">
      <AlertTriangle size={26} className="text-rust" />
      <p className="max-w-sm text-sm text-mist">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="rounded-full border border-rust/40 px-4 py-1.5 text-xs font-medium text-rust hover:bg-rust/10">
          Try again
        </button>
      )}
    </div>
  );
}
