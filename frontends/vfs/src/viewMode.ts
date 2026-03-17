/**
 * Client-side: should we show the mobile (portfolio) view or the desktop (VFS) view?
 * Query wins: ?mobile=1 / ?mobile=true or ?desktop=1 / ?desktop=true. Otherwise UA.
 */
const MOBILE_UA = /Android|iPhone|iPad|iPod|CriOS|FxiOS/i;

/** Treat common truthy query values as "yes" (e.g. 1, true, yes, on). */
function isTruthyQuery(val: string | null): boolean {
  if (val == null || val === '') return false;
  const v = val.toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export function isMobileView(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (isTruthyQuery(params.get('desktop'))) return false;
  if (isTruthyQuery(params.get('mobile'))) return true;
  return MOBILE_UA.test(navigator.userAgent);
}
