import { useState } from 'react';
import { Circle, MonitorPlay, Pause, Play, RotateCcw, Settings, Square } from 'lucide-react';
import AlertBox from '../simulation/AlertBox.jsx';
import styles from '../../styles/3rd-gen/simulation.module.css';

export default function RuntimeControlCard({
  isSettingsOpen,
  onToggleSettings,
  isSimulationRunning,
  onToggleSimulation,
  recordWhenPlaying,
  onRecordWhenPlayingChange,
  isRecording,
  onStartRecording,
  onStopRecording,
  hasAgents,
  hasSnapshots,
  onNoAgents,
  onRestoreLatest,
  onOpenHistory,
}) {
  const [showRestoreAlert, setShowRestoreAlert] = useState(false);

  function requestRestore() {
    // Restore follows the same Agent requirement as Play.
    if (!hasAgents) {
      onNoAgents();
      return;
    }

    setShowRestoreAlert(true);
  }

  function openHistory() {
    // This card closes its AlertBox; Main only switches the Explorer tab.
    setShowRestoreAlert(false);
    onOpenHistory();
  }

  return (
    <>
      {showRestoreAlert && (
        <AlertBox
          title="Restore Latest Snapshot?"
          primMessage="Restore the most recent state saved before Play?"
          secMessage={(
            <>
              To restore an earlier snapshot, visit the{' '}
              <button
                className={styles.alertInlineLink}
                type="button"
                onClick={openHistory}
              >
                history
              </button>{' '}
              tab.
            </>
          )}
          type="danger"
          confirmLabel="Restore"
          cancelLabel="Cancel"
          onConfirm={() => {
            onRestoreLatest();
            setShowRestoreAlert(false);
          }}
          onCancel={() => setShowRestoreAlert(false)}
        />
      )}

      <section className={styles.runtimeCard} aria-labelledby="runtime-control-title">
      <h2 className={styles.runtimeTitle} id="runtime-control-title">
        <MonitorPlay size={20} aria-hidden="true" />
        Runtime Control
      </h2>

      <div className={styles.runtimeRow}>
        <span className={styles.runtimeLabel}>Simulation</span>
        <span
          className={`${styles.runtimeStatus} ${
            isSimulationRunning ? styles.runtimeStatusRunning : ''
          }`}
        >
          {isSimulationRunning ? 'Playing' : 'Paused'}
        </span>
        <button
          className={`${styles.primaryAction} ${styles.runtimeAction}`}
          type="button"
          disabled={isRecording && !recordWhenPlaying}
          onClick={onToggleSimulation}
        >
          {isSimulationRunning ? (
            <Pause size={13} fill="currentColor" aria-hidden="true" />
          ) : (
            <Play size={13} fill="currentColor" aria-hidden="true" />
          )}
          {isSimulationRunning ? 'Pause' : 'Play'}
        </button>
      </div>

      <div className={styles.runtimeRow}>
        <span className={styles.runtimeLabel}>Recording</span>
        <span
          className={`${styles.runtimeStatus} ${
            isRecording ? styles.runtimeStatusRecording : ''
          }`}
        >
          {isRecording ? 'Recording' : 'Standby'}
        </span>
        <button
          className={`${styles.primaryAction} ${styles.runtimeAction}`}
          type="button"
          onClick={isRecording ? onStopRecording : onStartRecording}
        >
          {isRecording ? (
            <Square size={11} fill="currentColor" aria-hidden="true" />
          ) : (
            <Circle size={11} fill="currentColor" aria-hidden="true" />
          )}
          {isRecording ? 'Stop' : 'Start'}
        </button>
      </div>

      <div className={styles.runtimeOptions}>
        <label className={`${styles.formCheckbox} ${styles.recordOption}`}>
          <input
            type="checkbox"
            checked={recordWhenPlaying}
            disabled={isSimulationRunning || isRecording}
            onChange={(event) =>
              onRecordWhenPlayingChange(event.target.checked)
            }
          />
          <span>Record when playing</span>
        </label>

        <button
          className={`${styles.dangerAction} ${styles.runtimeOptionButton}`}
          type="button"
          disabled={!hasSnapshots}
          onClick={requestRestore}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Restore
        </button>

        <button
          className={`${styles.secondaryAction} ${styles.runtimeOptionButton}`}
          type="button"
          aria-expanded={isSettingsOpen}
          onClick={onToggleSettings}
        >
          <Settings size={14} aria-hidden="true" />
          Runtime Settings
        </button>
      </div>
      </section>
    </>
  );
}
