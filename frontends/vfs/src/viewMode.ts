/**
 * Client-side: should we show the mobile (portfolio) view or the desktop (VFS) view?
 * Query wins: ?mobile=1 or ?desktop=1. Otherwise UA.
 */
const MOBILE_UA = /Android|iPhone|iPad|iPod|CriOS|FxiOS/i;

export function isMobileView(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('desktop') === '1' || params.get('desktop') === 'true') return false;
  if (params.get('mobile') === '1' || params.get('mobile') === 'true') return true;
  return MOBILE_UA.test(navigator.userAgent);
}
