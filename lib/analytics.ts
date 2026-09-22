export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  const eventParams = params as Record<string, unknown> | undefined;
  const w = window as typeof window & {
    dataLayer?: unknown[];
    gtag?: (command: string, eventName: string, eventParams?: Record<string, unknown>) => void;
  };
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag === 'function') {
    w.gtag('event', name, eventParams);
    return;
  }
  // Queue the event so it is not lost if the GA script is still loading.
  w.dataLayer.push(['event', name, eventParams || {}]);
}
