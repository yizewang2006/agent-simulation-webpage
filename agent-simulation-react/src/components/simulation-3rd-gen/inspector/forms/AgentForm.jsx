// If mode = create, render one
// If mode = edit, render another one

import { FORM_MODES } from "../formRegistry.js";

import { useEffect, useRef, useState } from "react";
import { Check, CopyPlus, RefreshCw, Trash2, X } from "lucide-react";
import ColorSelector from "../sub-components/ColorSelector.jsx";
import styles from "../../../../styles/3rd-gen/simulation.module.css";

export const AGENT_FORM_DESCRIPTION = "Create one or more simulation agents.";

const AGENT_CREATION_DEFAULTS = {
    count: '1',
    xMin: '0',
    xMax: '500',
    yMin: '0',
    yMax: '500',
    speedMin: '0.5',
    speedMax: '2.5',
    angleMin: '0',
    angleMax: '360',
    fovRadius: '100',
    fovAngle: '150',
    color: '#000000',
    showFOV: true,
}

export default function AgentForm({
    mode = FORM_MODES.CREATE,
    initialValues,
    onRegeneratePreview,
    onUpdatePreviewAppearance,
    onSubmit,
    onCancel,
    onDelete,
}) {
    const [values, setValues] = useState(() => ({
        ...AGENT_CREATION_DEFAULTS,
        ...initialValues,
    }));
    const [formError, setFormError] = useState("");
    const regeneratePreviewRef = useRef(onRegeneratePreview);
    const updatePreviewAppearanceRef = useRef(onUpdatePreviewAppearance);

    // Keep the latest parent callback without making the preview effect rerun
    // whenever Simulation3rdGen renders for an unrelated reason.
    useEffect(() => {
      regeneratePreviewRef.current = onRegeneratePreview;
    }, [onRegeneratePreview]);

    useEffect(() => {
      updatePreviewAppearanceRef.current = onUpdatePreviewAppearance;
    }, [onUpdatePreviewAppearance]);

    // Canvas dragging and Look At Cursor change live geometry while this form stays mounted.
    // Pull those fields back into the draft so Apply cannot restore stale values.
    useEffect(() => {
      if (mode !== FORM_MODES.EDIT) return;

      setValues((currentValues) => ({
        ...currentValues,
        x: initialValues?.x ?? currentValues.x,
        y: initialValues?.y ?? currentValues.y,
        angle: initialValues?.angle ?? currentValues.angle,
      }));
    }, [mode, initialValues?.x, initialValues?.y, initialValues?.angle]);

    /*
     * Only randomization fields belong in this dependency list. Changing one
     * creates a new arrangement after a short debounce. Appearance-only fields
     * such as color, fovRadius, fovAngle, and showFOV are handled separately so agents
     * do not jump to new positions when the user is only changing how they look.
     */
    useEffect(() => {
      if (mode !== FORM_MODES.CREATE) return undefined;

      const timer = window.setTimeout(() => {
        const result = regeneratePreviewRef.current?.(values);

        if (result && !result.ok) {
          setFormError(result.error);
          return;
        }

        setFormError("");
      }, 120);

      return () => window.clearTimeout(timer);
    }, [
      mode,
      values.count,
      values.xMin,
      values.xMax,
      values.yMin,
      values.yMax,
      values.speedMin,
      values.speedMax,
      values.angleMin,
      values.angleMax,
    ]);

    function updateValue(name, nextValue) {
        const nextValues = {
          ...values,
          [name]: nextValue,
        };

        setValues(nextValues);

        setFormError("");

        /*
         * Appearance fields update the current drafts in place. If more
         * appearance controls are added later (for example, radius), include
         * them here rather than in the randomization effect above.
         */
        if (
          name === "color"
          || name === "fovRadius"
          || name === "fovAngle"
          || name === "showFOV"
        ) {
          const result = updatePreviewAppearanceRef.current?.(nextValues);

          if (result && !result.ok) {
            setFormError(result.error);
          }
        }
    }

    // When a field is updated
    function updateField(event) {
        const { name, value, type, checked } = event.target;
        updateValue(name, type === "checkbox" ? checked : value);
    }

    // When submitted (i.e. Add agent)
    function submitForm(event) {
        event.preventDefault();
        const result = onSubmit?.(values);

        if (result && !result.ok) {
          setFormError(result.error);
        }
    }

    function regeneratePreview() {
      const result = onRegeneratePreview?.(values);

      if (result && !result.ok) {
        setFormError(result.error);
        return;
      }

      setFormError("");
    }

    const title =
    mode === FORM_MODES.EDIT
      ? "Edit Agent"
      : "Create Agents";

    return (
    <div className={styles.inspectorFormViewport}>
    <form
      className={styles.inspectorForm}
      onSubmit={submitForm}
    >
      <div className={styles.formIntroduction}>
        <h3 className={styles.formTitle}>
          {title}
        </h3>

        <p className={styles.formDescription}>
          Configure how agents are added to the simulation.
        </p>
      </div>

      {mode === FORM_MODES.CREATE && (
        <>
          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>
              Agent Count
            </legend>

            <div className={styles.inputGroup}>
              <label
                className={styles.formLabel}
                htmlFor="agent-count"
              >
                Number of Agents
              </label>

              <input
                id="agent-count"
                className={styles.formInput}
                type="number"
                name="count"
                value={values.count}
                min="1"
                max="500"
                step="1"
                onChange={updateField}
              />
            </div>
          </fieldset>

          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>
              Spawn Range
            </legend>

            <div className={styles.formFieldRow}>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="agent-x-min">
                  X Min
                </label>
                <input
                  id="agent-x-min"
                  className={styles.formInput}
                  type="number"
                  name="xMin"
                  value={values.xMin}
                  step="1"
                  onChange={updateField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="agent-x-max">
                  X Max
                </label>
                <input
                  id="agent-x-max"
                  className={styles.formInput}
                  type="number"
                  name="xMax"
                  value={values.xMax}
                  step="1"
                  onChange={updateField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="agent-y-min">
                  Y Min
                </label>
                <input
                  id="agent-y-min"
                  className={styles.formInput}
                  type="number"
                  name="yMin"
                  value={values.yMin}
                  step="1"
                  onChange={updateField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="agent-y-max">
                  Y Max
                </label>
                <input
                  id="agent-y-max"
                  className={styles.formInput}
                  type="number"
                  name="yMax"
                  value={values.yMax}
                  step="1"
                  onChange={updateField}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>
              Initial Speed
            </legend>

            <div className={styles.formFieldRow}>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="agent-speed-min">
                  Min
                </label>
                <input
                  id="agent-speed-min"
                  className={styles.formInput}
                  type="number"
                  name="speedMin"
                  value={values.speedMin}
                  step="0.1"
                  onChange={updateField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="agent-speed-max">
                  Max
                </label>
                <input
                  id="agent-speed-max"
                  className={styles.formInput}
                  type="number"
                  name="speedMax"
                  value={values.speedMax}
                  step="0.1"
                  onChange={updateField}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>
              Initial Heading
            </legend>

            <div className={styles.formFieldRow}>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="agent-angle-min">
                  Min
                </label>
                <div className={styles.inputWithUnit}>
                  <input
                    id="agent-angle-min"
                    className={styles.formInput}
                    type="number"
                    name="angleMin"
                    value={values.angleMin}
                    min="0"
                    max="360"
                    step="1"
                    onChange={updateField}
                  />
                  <span className={styles.inputUnit}>degrees</span>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="agent-angle-max">
                  Max
                </label>
                <div className={styles.inputWithUnit}>
                  <input
                    id="agent-angle-max"
                    className={styles.formInput}
                    type="number"
                    name="angleMax"
                    value={values.angleMax}
                    min="0"
                    max="360"
                    step="1"
                    onChange={updateField}
                  />
                  <span className={styles.inputUnit}>degrees</span>
                </div>
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>
              Field of View
            </legend>

            <div className={styles.inputGroup}>
              <label
                className={styles.formLabel}
                htmlFor="agent-global-fov-radius"
              >
                Global FOV Radius
              </label>

              <div className={styles.inputWithUnit}>
                <input
                  id="agent-global-fov-radius"
                  className={styles.formInput}
                  type="number"
                  name="fovRadius"
                  value={values.fovRadius}
                  min="0"
                  step="1"
                  onChange={updateField}
                />
                <span className={styles.inputUnit}>px</span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label
                className={styles.formLabel}
                htmlFor="agent-global-fov-angle"
              >
                Global FOV Angle
              </label>

              <div className={styles.inputWithUnit}>
                <input
                  id="agent-global-fov-angle"
                  className={styles.formInput}
                  type="number"
                  name="fovAngle"
                  value={values.fovAngle}
                  min="0"
                  max="360"
                  step="1"
                  onChange={updateField}
                />
                <span className={styles.inputUnit}>degrees</span>
              </div>
            </div>
          </fieldset>
        </>
      )}

      {mode === FORM_MODES.EDIT && (
        <>
          {/* Edit mode uses exact values instead of randomized ranges. */}
          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>
              Identity
            </legend>

            <div className={styles.inputGroup}>
              <label className={styles.formLabel} htmlFor="agent-name">
                Name
              </label>
              <input
                id="agent-name"
                className={styles.formInput}
                type="text"
                name="name"
                value={values.name}
                onChange={updateField}
              />
            </div>
          </fieldset>

          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>
              Position
            </legend>

            <div className={styles.formFieldRow}>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="agent-x">
                  X Position
                </label>
                <input
                  id="agent-x"
                  className={styles.formInput}
                  type="number"
                  name="x"
                  value={values.x}
                  min="0"
                  max="500"
                  step="0.01"
                  onChange={updateField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="agent-y">
                  Y Position
                </label>
                <input
                  id="agent-y"
                  className={styles.formInput}
                  type="number"
                  name="y"
                  value={values.y}
                  min="0"
                  max="500"
                  step="0.01"
                  onChange={updateField}
                />
              </div>
            </div>
          </fieldset>

          <fieldset className={styles.formSection}>
            <legend className={styles.formSectionTitle}>
              Motion
            </legend>

            <div className={styles.formFieldRow}>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="agent-speed">
                  Speed
                </label>
                <input
                  id="agent-speed"
                  className={styles.formInput}
                  type="number"
                  name="speed"
                  value={values.speed}
                  min="0"
                  step="0.01"
                  onChange={updateField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="agent-angle">
                  Heading
                </label>
                <div className={styles.inputWithUnit}>
                  <input
                    id="agent-angle"
                    className={styles.formInput}
                    type="number"
                    name="angle"
                    value={values.angle}
                    min="0"
                    max="360"
                    step="0.01"
                    onChange={updateField}
                  />
                  <span className={styles.inputUnit}>degrees</span>
                </div>
              </div>
            </div>
          </fieldset>
        </>
      )}

      <fieldset className={styles.formSection}>
        <legend className={styles.formSectionTitle}>
          Appearance
        </legend>

        <div className={styles.inputGroup}>
          <label
            className={styles.formLabel}
            htmlFor="agent-color"
          >
            Color
          </label>

          <ColorSelector
            id="agent-color"
            value={values.color}
            onChange={(color) => updateValue("color", color)}
          />
        </div>

        <label className={styles.formCheckbox}>
          <input
            type="checkbox"
            name="showFOV"
            checked={values.showFOV}
            onChange={updateField}
          />

          Show Field of View
        </label>

        {mode === FORM_MODES.EDIT && (
          <>
            <div className={styles.inputGroup}>
              <label className={styles.formLabel} htmlFor="agent-fov-radius">
                FOV Radius
              </label>
              <div className={styles.inputWithUnit}>
                <input
                  id="agent-fov-radius"
                  className={styles.formInput}
                  type="number"
                  name="fovRadius"
                  value={values.fovRadius}
                  min="0"
                  step="0.01"
                  onChange={updateField}
                />
                <span className={styles.inputUnit}>px</span>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.formLabel} htmlFor="agent-fov-angle">
                FOV Angle
              </label>
              <div className={styles.inputWithUnit}>
                <input
                  id="agent-fov-angle"
                  className={styles.formInput}
                  type="number"
                  name="fovAngle"
                  value={values.fovAngle}
                  min="0"
                  max="360"
                  step="0.01"
                  onChange={updateField}
                />
                <span className={styles.inputUnit}>degrees</span>
              </div>
            </div>
          </>
        )}
      </fieldset>

      {formError && (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      )}

      <div className={styles.formActions}>
        {mode === FORM_MODES.CREATE && (
          <button
            className={`${styles.secondaryAction} ${styles.formActionButton}`}
            type="button"
            onClick={regeneratePreview}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Regenerate Preview
          </button>
        )}

        <button
          className={`${styles.primaryAction} ${styles.formActionButton}`}
          type="submit"
        >
          {mode === FORM_MODES.EDIT ? (
            <Check size={16} aria-hidden="true" />
          ) : (
            <CopyPlus size={16} aria-hidden="true" />
          )}
          {mode === FORM_MODES.EDIT ? "Apply Changes" : "Create Agents"}
        </button>

        <button
          className={`${styles.secondaryAction} ${styles.formActionButton}`}
          type="button"
          onClick={onCancel}
        >
          <X size={16} aria-hidden="true" />
          Cancel
        </button>

        {mode === FORM_MODES.EDIT && onDelete && (
          <button
            className={`${styles.dangerAction} ${styles.formActionButton}`}
            type="button"
            onClick={onDelete}
          >
            <Trash2 size={16} aria-hidden="true" />
            Delete Agent
          </button>
        )}
      </div>
    </form>
    </div>
  );
}
