import emoryLogo from '../../assets/logos/EU_shield_hz_rv.png';
import { ArrowLeft } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './header.module.css';

export default function Header({
  title = 'Agent Simulation Project',
  subtitle,
  showHomeButton = true,
  homeNavigation = false,
  onWhatsNew,
}) {
  const navigate = useNavigate();

  return (
    <header className={styles.header}>
      {/* Left region: project navigation and Emory identity. */}
      <div className={styles.left}>
        {showHomeButton && (
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
        )}

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

      {/* Center region: page-specific title with an optional version label. */}
      <div className={styles.titleGroup}>
        <h1 className={styles.pageTitle}>{title}</h1>
        {subtitle && <p className={styles.pageSubtitle}>{subtitle}</p>}
      </div>

      {/* Right region: only completed destinations are interactive. */}
      <nav className={styles.nav} aria-label="Primary navigation">
        {homeNavigation ? (
          <>
            <button className={styles.navLink} type="button" onClick={onWhatsNew}>
              What’s New
            </button>
            <button
              className={styles.navLink}
              type="button"
              onClick={() => navigate('/loading', {
                state: { from: 'Home Page', to: 'Tutorial', path: '/tutorial' },
              })}
            >
              Tutorial
            </button>
            <button
              className={styles.navLink}
              type="button"
              onClick={() => navigate('/loading', {
                state: {
                  from: 'Home Page',
                  to: '3rd Gen Simulation',
                  path: '/simulation-3rd-gen',
                },
              })}
            >
              Launch Simulation
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </nav>
    </header>
  );
}
