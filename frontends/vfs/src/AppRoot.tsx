import { useSearchParams } from 'react-router-dom';
import { isMobileView } from './viewMode';
import { MobileApp } from './mobile/MobileApp';
import DesktopApp from './App';

/**
 * Renders mobile (portfolio) or desktop (VFS) based on ?mobile=1 / ?desktop=1 or User-Agent.
 * Single app, single port; no server-side view switching.
 */
export function AppRoot() {
  const [searchParams] = useSearchParams();
  // Re-render when query changes so ?desktop=1 / ?mobile=1 take effect
  void searchParams.toString();
  const mobile = isMobileView();

  return mobile ? <MobileApp /> : <DesktopApp />;
}
