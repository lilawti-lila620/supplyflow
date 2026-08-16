// Minimal, dependency-free event tracking so the product has a genuine
// monitoring/analytics surface out of the box. Events are persisted locally
// and rendered in the Analytics page's "Recent activity" panel. Swap
// `track()`'s body for a real provider (PostHog, Plausible, Sentry breadcrumbs)
// when you have accounts set up — every call site in the app already funnels
// through this one function.
const KEY = 'supplyflow_events_v1';
const MAX_EVENTS = 200;

export function track(event, props = {}) {
  try {
    const events = getEvents();
    events.unshift({ event, props, at: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  } catch {
    // Analytics must never break the app.
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info('[analytics]', event, props);
  }
}

export function getEvents() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function logError(error, context = {}) {
  track('error', { message: error?.message || String(error), context });
}
