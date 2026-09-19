export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === 'undefined') return;
  const gtag = (window as typeof window & { gtag?: (command: string, eventName: string, eventParams?: Record<string, unknown>) => void }).gtag;
  gtag?.('event', name, params);
}
