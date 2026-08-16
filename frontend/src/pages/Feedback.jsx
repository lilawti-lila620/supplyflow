import { useEffect, useState } from 'react';
import { Star, Loader2, MessageSquareQuote } from 'lucide-react';
import { listFeedback, submitFeedback } from '../lib/contract';
import { useWallet } from '../lib/WalletContext';
import { useToast } from '../lib/ToastContext';
import { LoadingState } from '../components/States';
import { timeAgo } from '../lib/format';

export default function Feedback() {
  const { address } = useWallet();
  const { push } = useToast();
  const [feedback, setFeedback] = useState(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setFeedback(await listFeedback());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !comment.trim()) {
      push('Add your name and a short comment before submitting.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({ name: name.trim(), role: role.trim() || 'Pilot user', rating, comment: comment.trim() });
      setName('');
      setRole('');
      setComment('');
      setRating(5);
      push('Thanks — your feedback was recorded.', 'success');
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  const avg = feedback?.length ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1) : null;

  return (
    <div className="mx-auto max-w-5xl px-5 md:px-8 py-10">
      <span className="text-xs font-mono uppercase tracking-widest text-amber">Pilot feedback</span>
      <h1 className="mt-2 font-display text-2xl md:text-3xl font-semibold text-paper">What onboarded users are saying</h1>
      <p className="mt-2 text-sm text-slate max-w-xl">
        Collected directly from farmers, cooperatives, transporters, and exporters using SupplyFlow during the
        pilot rollout.
      </p>

      {avg && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-line bg-ink-2 px-4 py-2 text-sm">
          <Star size={15} className="text-amber fill-amber" />
          <span className="font-mono text-mist">{avg} / 5</span>
          <span className="text-slate">from {feedback.length} responses</span>
        </div>
      )}

      <div className="mt-8 grid lg:grid-cols-[1fr_1.1fr] gap-8">
        <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-ink-2 p-5 h-fit space-y-4">
          <h3 className="font-display font-semibold text-paper text-sm">Share your experience</h3>
          {!address && (
            <p className="text-xs text-slate">You can submit feedback without connecting a wallet.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-mist outline-none focus:border-amber/50"
            />
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role (e.g. Farmer)"
              className="rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-mist outline-none focus:border-amber/50"
            />
          </div>
          <div>
            <span className="text-xs text-slate">Rating</span>
            <div className="mt-1.5 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)}>
                  <Star size={22} className={n <= rating ? 'fill-amber text-amber' : 'text-line'} />
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What worked well, and what would make this better for your role?"
            rows={4}
            className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-mist outline-none focus:border-amber/50 resize-none"
          />
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-amber py-2.5 text-sm font-semibold text-ink hover:bg-amber-2 transition-colors disabled:opacity-60"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </form>

        <div className="space-y-3">
          {feedback === null && <LoadingState label="Loading responses…" />}
          {feedback?.map((f) => (
            <div key={f.id} className="rounded-xl border border-line bg-ink-2 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display font-semibold text-paper text-sm">{f.name}</div>
                  <div className="text-xs text-slate">{f.role}</div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={i < f.rating ? 'fill-amber text-amber' : 'text-line'} />
                  ))}
                </div>
              </div>
              <p className="mt-3 flex gap-2 text-sm text-mist leading-relaxed">
                <MessageSquareQuote size={15} className="mt-0.5 shrink-0 text-slate" />
                {f.comment}
              </p>
              <div className="mt-3 text-[11px] text-slate">{timeAgo(f.created_at)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
