import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { MarkdownPage } from './pages/MarkdownPage';
import styles from './App.module.css';

const CONTENT_ROUTES = [
  { path: '/about', url: '/about/About.md', label: 'About' },
  { path: '/projects/genetic-stippling', url: '/genetic-stippling/genetic-stippling.md', label: 'Genetic Stippling' },
  { path: '/projects/auto-steamworks', url: '/auto-steamworks/auto-steamworks.md', label: 'Auto Steamworks' },
  { path: '/projects/hvvoculus', url: '/hvvoculus/hvvoculus.md', label: 'Hvvoculus' },
] as const;

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          Cooper Davies
        </Link>
        {!isHome && (
          <Link to="/" className={styles.back} aria-label="Back to home">
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
        <a
          href={`${window.location.pathname}${window.location.search}${window.location.search ? '&' : '?'}desktop=1`}
          className={styles.fullSite}
        >
          View full site (desktop)
        </a>
      </footer>
    </div>
  );
}
