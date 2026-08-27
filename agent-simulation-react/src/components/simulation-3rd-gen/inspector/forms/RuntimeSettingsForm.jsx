// Brought up by the Runtime Settings toggle button.

import { useState } from "react";
import { Check } from "lucide-react";
import styles from "../../../../styles/3rd-gen/simulation.module.css";

const DEFAULT_SETTINGS = {
  targetFPS: "30",
  canvasWidth: "500",
  canvasHeight: "500",
  maximumSpeed: "5.0",
  maximumTurnAngle: "45",
  smoothingFactor: "0.15",
};

const MIN_FPS = 1;
const MAX_FPS = 60;
const MIN_SMOOTHING_FACTOR = 0.05;
const MAX_SMOOTHING_FACTOR = 1;

export default function RuntimeSettingsForm({
  initialSettings,
  onApply,
  onCancel,
}) {
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  }));

  function updateSettings(event) {
    const { name, value } = event.target;

    setSettings((currentSettings) => ({
      ...currentSettings,
      [name]: value,
    }));
  }

  function submitSettings(event) {
    event.preventDefault();
    onApply?.(settings);
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
  }

  const fpsProgress =
    ((Number(settings.targetFPS) - MIN_FPS) / (MAX_FPS - MIN_FPS)) * 100;
  const smoothingProgress =
    ((Number(settings.smoothingFactor) - MIN_SMOOTHING_FACTOR) /
      (MAX_SMOOTHING_FACTOR - MIN_SMOOTHING_FACTOR)) * 100;

  return (
    <div className={styles.inspectorFormViewport}>
    <form
      className={styles.settingsForm}
      onSubmit={submitSettings}
    >
      <div className={styles.formIntroduction}>
        <h3 className={styles.formTitle}>Runtime Settings</h3>
        <p className={styles.formDescription}>
          Configure how the simulation runs.
        </p>
      </div>

      <fieldset className={styles.formSection}>
        <legend className={styles.formSectionTitle}>Debugging</legend>

        <div className={styles.inputGroup}>
          <label className={styles.formCheckbox}>
            <input
              type="checkbox"
              name="debuggingMode"
              disabled="true"
            />
            Enable Debug Mode
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.formSection}>
        <legend className={styles.formSectionTitle}>Simulation Rate</legend>

        {/* inputGroup is shared by labels, controls, and helper text. */}
        <div className={styles.inputGroup}>
          <div className={styles.rangeHeader}>
            <label className={styles.formLabel} htmlFor="target-fps">
              Target FPS
            </label>

            <output
              className={styles.rangeValue}
              htmlFor="target-fps"
            >
              {settings.targetFPS} FPS
            </output>
          </div>

          <input
            id="target-fps"
            className={styles.formRange}
            type="range"
            name="targetFPS"
            value={settings.targetFPS}
            min={MIN_FPS}
            max={MAX_FPS}
            step="1"
            style={{ "--range-progress": `${fpsProgress}%` }}
            onChange={updateSettings}
          />

          <div className={styles.rangeLabels} aria-hidden="true">
            <span>{MIN_FPS}</span>
            <span>{MAX_FPS}</span>
          </div>

          <p className={styles.formHelperText}>
            Controls how many simulation frames are processed each second.
          </p>
        </div>
      </fieldset>

      <fieldset className={styles.formSection}>
        <legend className={styles.formSectionTitle}>Canvas Size</legend>

        <div className={styles.formFieldRow}>
          <div className={styles.inputGroup}>
            <label className={styles.formLabel} htmlFor="canvas-width">
              Canvas Width
            </label>

            <div className={`${styles.inputWithUnit} ${styles.shortInputUnit}`}>
              <input
                id="canvas-width"
                className={styles.formInput}
                type="number"
                name="canvasWidth"
                value={settings.canvasWidth}
                min="100"
                max="5000"
                step="10"
                disabled
                onChange={updateSettings}
              />
              <span className={styles.inputUnit}>px</span>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.formLabel} htmlFor="canvas-height">
              Canvas Height
            </label>

            <div className={`${styles.inputWithUnit} ${styles.shortInputUnit}`}>
              <input
                id="canvas-height"
                className={styles.formInput}
                type="number"
                name="canvasHeight"
                value={settings.canvasHeight}
                min="100"
                max="5000"
                step="10"
                disabled
                onChange={updateSettings}
              />
              <span className={styles.inputUnit}>px</span>
            </div>
          </div>
        </div>

        <p className={styles.formHelperText}>
          Entities will be scaled to fit the displayed canvas.
        </p>
      </fieldset>

      <fieldset className={styles.formSection}>
        <legend className={styles.formSectionTitle}>
          Movement Constraints
        </legend>

        <div className={styles.inputGroup}>
          <label className={styles.formLabel} htmlFor="maximum-speed">
            Maximum Speed
          </label>

          <input
            id="maximum-speed"
            className={styles.formInput}
            type="number"
            name="maximumSpeed"
            value={settings.maximumSpeed}
            min="0"
            step="0.1"
            onChange={updateSettings}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.formLabel} htmlFor="maximum-turn-angle">
            Maximum Turn Angle
          </label>

          <div className={styles.inputWithUnit}>
            <input
              id="maximum-turn-angle"
              className={styles.formInput}
              type="number"
              name="maximumTurnAngle"
              value={settings.maximumTurnAngle}
              min="0"
              max="180"
              step="1"
              onChange={updateSettings}
            />
            <span className={styles.inputUnit}>degrees</span>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <div className={styles.rangeHeader}>
            <label className={styles.formLabel} htmlFor="smoothing-factor">
              Smoothing Factor
            </label>

            <output
              className={styles.rangeValue}
              htmlFor="smoothing-factor"
            >
              {Number(settings.smoothingFactor).toFixed(2)}
            </output>
          </div>

          <input
            id="smoothing-factor"
            className={styles.formRange}
            type="range"
            name="smoothingFactor"
            value={settings.smoothingFactor}
            min={MIN_SMOOTHING_FACTOR}
            max={MAX_SMOOTHING_FACTOR}
            step="0.05"
            style={{ "--range-progress": `${smoothingProgress}%` }}
            onChange={updateSettings}
          />

          <div className={styles.rangeLabels} aria-hidden="true">
            <span>{MIN_SMOOTHING_FACTOR}</span>
            <span>{MAX_SMOOTHING_FACTOR.toFixed(2)}</span>
          </div>

          <p className={styles.formHelperText}>
            Lower values turn more smoothly. Applied globally to all agents.
          </p>
        </div>
      </fieldset>

      <div className={styles.formActions}>
        <button
          className={`${styles.primaryAction} ${styles.formActionButton}`}
          type="submit"
        >
          <Check size={16} aria-hidden="true" />
          Apply Settings
        </button>

        <button
          className={`${styles.dangerAction} ${styles.formActionButton}`}
          type="button"
          onClick={resetSettings}
        >
          Reset to Defaults
        </button>

        <button
          className={`${styles.secondaryAction} ${styles.formActionButton}`}
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
    </div>
  );
}
