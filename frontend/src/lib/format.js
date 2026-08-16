export function formatXLM(amount) {
  const n = Number(amount) / 10_000_000; // stroops -> XLM
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatAddress(addr = '') {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 5)}…${addr.slice(-5)}`;
}

export function formatBps(bps) {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}

export function formatDate(ts) {
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(ts) {
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function shortId(id) {
  return `#${String(id).padStart(4, '0')}`;
}
