import { Routes, Route, Link, useSearchParams } from 'react-router-dom';
import { Home } from './pages/Home';
import { MarkdownPage } from './pages/MarkdownPage';
import styles from './MobileApp.module.css';

const CONTENT_ROUTES = [
  { path: '/about', url: '/about/About.md', label: 'About' },
  { path: '/projects/genetic-stippling', url: '/genetic-stippling/genetic-stippling.md', label: 'Genetic Stippling' },
  { path: '/projects/auto-steamworks', url: '/auto-steamworks/auto-steamworks.md', label: 'Auto Steamworks' },
  { path: '/projects/hvvoculus', url: '/hvvoculus/hvvoculus.md', label: 'Hvvoculus' },
] as const;

export function MobileApp() {
  const [searchParams] = useSearchParams();
  const location = window.location;
  const isHome = location.pathname === '/';

  const desktopUrl = `${location.pathname}${location.search ? `${location.search}&desktop=1` : '?desktop=1'}`;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          Cooper Davies
        </Link>
        {!isHome && (
          <Link
            to={{ pathname: '/', search: searchParams.get('mobile') ? '?mobile=1' : '' }}
            className={styles.back}
            aria-label="Back to home"
          >
            ← Back
          </Link>
        )}
      </header>

      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Home />} />
          {CONTENT_ROUTES.map(({ path, url, label }) => (
            <Route
              key={path}
              path={path}
              element={<MarkdownPage url={url} title={label} />}
            />
          ))}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      <footer className={styles.footer}>
        <a href={desktopUrl} className={styles.fullSite}>
          View full site (desktop)
        </a>
      </footer>
    </div>
  );
}
