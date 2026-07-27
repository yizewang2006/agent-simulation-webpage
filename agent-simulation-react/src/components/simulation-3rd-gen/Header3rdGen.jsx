import emoryLogo from '../../assets/logos/EU_shield_hz_rv.png';
import { ArrowLeft } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './header.module.css';

export default function Header({ title = 'Agent Simulation Project' }) {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      {/* Left region: project navigation and Emory identity. */}
      <div className={styles.left}>
        <button
          className={styles.backButton}
          type="button"
          onClick={() => navigate('/loading', {
            state: {
              from: title,
              to: 'Home Page',
              path: '/',
            },
          })}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Project Home
        </button>

        {/* The Emory logo opens Emory's main website. */}
        <a
          className={styles.logoLink}
          href="https://www.emory.edu/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            className={styles.logo}
            src={emoryLogo}
            alt="Emory University"
          />
        </a>
      </div>

      {/* Center region: page-specific title supplied through the title prop. */}
      <h1 className={styles.pageTitle}>{title}</h1>

      {/* Right region: only completed destinations are interactive. */}
      <nav className={styles.nav} aria-label="Primary navigation">
        <NavLink
          className={({ isActive }) => (
            `${styles.navLink}${isActive ? ` ${styles.isActive}` : ''}`
          )}
          to="/tutorial"
        >
          Tutorial
        </NavLink>

        <button className={`${styles.navLink} ${styles.navFuture}`} type="button" disabled>
          Documentation
        </button>

        <button className={`${styles.navLink} ${styles.navFuture}`} type="button" disabled>
          Resource Center
        </button>
      </nav>
    </header>
  );
}
