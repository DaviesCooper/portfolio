import { Link } from 'react-router-dom';
import styles from './Home.module.css';

export function Home() {
  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <h1 className={styles.name}>Cooper Davies</h1>
        <p className={styles.tagline}>
          PhD, Calgary — AI/ML & building things.
        </p>
      </section>

      <section className={styles.section} aria-label="About & resume">
        <h2 className={styles.sectionTitle}>About & resume</h2>
        <nav className={styles.nav}>
          <Link to="/about" className={styles.card}>
            <span className={styles.cardTitle}>About me</span>
            <span className={styles.cardDesc}>Bio, background, hobbies</span>
          </Link>
          <a
            href="/resume/Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
          >
            <span className={styles.cardTitle}>Resume</span>
            <span className={styles.cardDesc}>PDF</span>
          </a>
        </nav>
      </section>

      <section className={styles.section} aria-label="Projects">
        <h2 className={styles.sectionTitle}>Projects</h2>
        <nav className={styles.nav}>
          <Link to="/projects/genetic-stippling" className={styles.card}>
            <span className={styles.cardTitle}>Genetic Stippling</span>
          </Link>
          <Link to="/projects/auto-steamworks" className={styles.card}>
            <span className={styles.cardTitle}>Auto Steamworks</span>
          </Link>
          <Link to="/projects/hvvoculus" className={styles.card}>
            <span className={styles.cardTitle}>Hvvoculus</span>
          </Link>
        </nav>
      </section>
    </div>
  );
}
