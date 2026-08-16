import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, variant = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const icons = { success: CheckCircle2, error: XCircle, info: Info };
  const colors = {
    success: 'border-teal/40 text-teal bg-ink-3',
    error: 'border-rust/40 text-rust bg-ink-3',
    info: 'border-amber/40 text-amber bg-ink-3',
  };

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        {toasts.map((t) => {
          const Icon = icons[t.variant];
          return (
            <div
              key={t.id}
              className={`rise-in flex items-start gap-3 rounded-lg border ${colors[t.variant]} px-4 py-3 shadow-lg backdrop-blur`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="text-sm text-mist flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-slate hover:text-mist">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
