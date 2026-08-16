import { Component } from 'react';
import { AlertOctagon } from 'lucide-react';
import { logError } from '../lib/analytics';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    logError(error, { componentStack: info?.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
          <AlertOctagon size={30} className="text-rust" />
          <h2 className="font-display text-lg font-semibold text-paper">Something went wrong</h2>
          <p className="max-w-sm text-sm text-slate">
            The error was recorded. Try reloading the page — your on-chain data is safe either way.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-amber px-4 py-2 text-xs font-semibold text-ink"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
