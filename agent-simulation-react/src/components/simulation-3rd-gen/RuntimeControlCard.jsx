import { Circle, MonitorPlay, Play, Settings } from 'lucide-react';
import styles from '../../styles/3rd-gen/simulation.module.css';

export default function RuntimeControlCard({
  isSettingsOpen,
  onToggleSettings,
}) {
  return (
    <section className={styles.runtimeCard} aria-labelledby="runtime-control-title">
      <h2 className={styles.runtimeTitle} id="runtime-control-title">
        <MonitorPlay size={20} aria-hidden="true" />
        Runtime Control
      </h2>

      <div className={styles.runtimeRow}>
        <span className={styles.runtimeLabel}>Simulation</span>
        <span className={styles.runtimeStatus}>Paused</span>
        <button className={`${styles.primaryAction} ${styles.runtimeAction}`} type="button">
          <Play size={13} fill="currentColor" aria-hidden="true" />
          Play
        </button>
      </div>

      <div className={styles.runtimeRow}>
        <span className={styles.runtimeLabel}>Recording</span>
        <span className={styles.runtimeStatus}>Standby</span>
        <button className={`${styles.primaryAction} ${styles.runtimeAction}`} type="button">
          <Circle size={11} fill="currentColor" aria-hidden="true" />
          Start
        </button>
      </div>

      <div className={styles.runtimeOptions}>
        <label className={styles.recordOption}>
          <input type="checkbox" defaultChecked />
          <span>Record when playing</span>
        </label>

        {/* This becomes an active two-state toggle when Inspector logic is connected. */}
        <button
          className={styles.runtimeSettings}
          type="button"
          aria-pressed={isSettingsOpen}
          onClick={onToggleSettings}
        >
          <Settings size={14} aria-hidden="true" />
          Runtime Settings
        </button>
      </div>
    </section>
  );
}
