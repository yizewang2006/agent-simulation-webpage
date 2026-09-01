import {
  Clapperboard,
  Info,
  Pause,
  Play,
  StepBack,
  StepForward,
} from 'lucide-react';
import { BEHAVIOR_GROUPS } from '../../utils/behaviorGroups.js';
import styles from '../../styles/3rd-gen/simulation.module.css';

function formatHeading(angle) {
  return (((-angle * 180 / Math.PI) % 360) + 360) % 360;
}

export default function DebuggingControlCard({
  selectedAgent,
  hasAgents,
  currentFrame,
  canStepBackward,
  canStepForward,
  stepsPerClick,
  onStepsPerClickChange,
  onStepBackward,
  onStepForward,
  isPlaying,
  onTogglePlay,
}) {
  const decision = selectedAgent?.debugDecision;
  const headingBehaviors =
    decision?.activeBehaviorGroups[BEHAVIOR_GROUPS.HEADING_DIRECTION] ?? [];
  const speedBehaviors =
    decision?.activeBehaviorGroups[BEHAVIOR_GROUPS.SPEED] ?? [];

  return (
    <div className={styles.debugWorkspace}>
      <section className={styles.debugTransport} aria-label="Debug transport controls">
        <div className={styles.debugPanelHeading}>
          <Clapperboard size={13} aria-hidden="true" />
          Frame Control
        </div>
        <div className={styles.debugFrameStatus}>
          <span>Current Frame</span>
          <output>{currentFrame}</output>
        </div>
        <div className={styles.debugTransportActions}>
          <button
            className={`${styles.secondaryAction} ${styles.debugTransportButton}`}
            type="button"
            disabled={isPlaying || !canStepBackward}
            title="Step backward"
            aria-label="Step backward"
            onClick={onStepBackward}
          >
            <StepBack size={15} aria-hidden="true" />
          </button>
          <button
            className={`${styles.primaryAction} ${styles.debugPlayButton}`}
            type="button"
            disabled={!hasAgents}
            title={isPlaying ? 'Pause debug playback' : 'Play debug simulation'}
            aria-label={isPlaying ? 'Pause debug playback' : 'Play debug simulation'}
            onClick={onTogglePlay}
          >
            {isPlaying ? (
              <Pause size={15} fill="currentColor" aria-hidden="true" />
            ) : (
              <Play size={15} fill="currentColor" aria-hidden="true" />
            )}
          </button>
          <button
            className={`${styles.secondaryAction} ${styles.debugTransportButton}`}
            type="button"
            disabled={isPlaying || !canStepForward}
            title="Step forward"
            aria-label="Step forward"
            onClick={onStepForward}
          >
            <StepForward size={15} aria-hidden="true" />
          </button>
        </div>
        <label className={styles.debugStepsControl}>
          <span>Steps per click</span>
          <input
            type="number"
            min="1"
            step="1"
            value={stepsPerClick}
            disabled={isPlaying}
            onChange={(event) => {
              const nextValue = event.target.valueAsNumber;
              if (Number.isInteger(nextValue) && nextValue >= 1) {
                onStepsPerClickChange(nextValue);
              }
            }}
          />
        </label>
      </section>

      <section className={styles.debugInformation} aria-label="Debug information">
        <div className={styles.debugPanelHeading}>
          <Info size={14} aria-hidden="true" />
          Information
          {selectedAgent && (
            <strong className={styles.debugInformationAgent}>
              {selectedAgent.name}
            </strong>
          )}
        </div>

        {selectedAgent && decision ? (
          <div className={styles.debugInformationBody}>
            <div className={styles.debugDecisionGrid}>
              {headingBehaviors.map((activeBehavior) => (
                <article
                  className={styles.debugDecisionCard}
                  key={activeBehavior.behavior.id}
                >
                  <div className={styles.debugDecisionCardTitle}>
                    <span
                      className={styles.debugDecisionColor}
                      style={{
                        backgroundColor: activeBehavior.behavior.visualSettings.color,
                      }}
                    />
                    {activeBehavior.behavior.name}
                  </div>
                  <dl>
                    <div>
                      <dt>Weight</dt>
                      <dd>{activeBehavior.normalizedActivationWeight.toFixed(3)}</dd>
                    </div>
                    <div>
                      <dt>Decision Angle</dt>
                      <dd>{formatHeading(activeBehavior.desiredAngle).toFixed(1)}°</dd>
                    </div>
                  </dl>
                </article>
              ))}

              {speedBehaviors.map((activeBehavior) => (
                <article
                  className={styles.debugDecisionCard}
                  key={activeBehavior.behavior.id}
                >
                  <div className={styles.debugDecisionCardTitle}>
                    <span
                      className={styles.debugDecisionColor}
                      style={{
                        backgroundColor: activeBehavior.behavior.visualSettings.color,
                      }}
                    />
                    {activeBehavior.behavior.name}
                  </div>
                  <dl>
                    <div>
                      <dt>Weight</dt>
                      <dd>{activeBehavior.normalizedActivationWeight.toFixed(3)}</dd>
                    </div>
                    <div>
                      <dt>Speed Change</dt>
                      <dd>{`${activeBehavior.speedChange >= 0 ? '+' : ''}${activeBehavior.speedChange.toFixed(2)}`}</dd>
                    </div>
                  </dl>
                </article>
              ))}

              <div className={styles.debugFinalDecision}>
                <strong>Final Decision</strong>
                <span>
                  Heading
                  <output>{formatHeading(decision.finalAngle).toFixed(1)}°</output>
                </span>
                <span>
                  Speed
                  <output>{decision.finalSpeed.toFixed(2)} px/frame</output>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className={styles.debugInformationEmpty}>
            Select an Agent to inspect its decisions.
          </p>
        )}
      </section>
    </div>
  );
}
