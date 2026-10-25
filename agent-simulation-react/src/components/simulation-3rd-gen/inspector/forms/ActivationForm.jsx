import { useState } from "react";
import { Activity, Check, X } from "lucide-react";
import ActivationFields from "../fields/ActivationFields.jsx";
import { createActivationDraft } from "../../../../models/behavior.js";
import styles from "../../../../styles/3rd-gen/simulation.module.css";

export const ACTIVATION_FORM_DESCRIPTION = "Configure how a behavior calculates its weight. Each behavior must have one and only one activation function.";

export default function ActivationForm({
  behaviors = [],
  initialValues,
  entityTypeDefinitions,
  onApply,
  onCancel,
}) {
  const [behaviorId, setBehaviorId] = useState(initialValues?.behaviorId ?? "");
  const [activation, setActivation] = useState(() =>
    createActivationDraft(initialValues?.activation)
  );
  const [formError, setFormError] = useState("");

  // Select a behavior from the dropdown, then the form renders its activation configuration. The form is disabled until a behavior is selected.
  function selectBehavior(nextBehaviorId) {
    setBehaviorId(nextBehaviorId);
    const behavior = behaviors.find((item) => item.id === nextBehaviorId);
    setActivation(createActivationDraft(behavior?.activation));
    setFormError("");
  }

  // Submit the form, calling onApply with the selected behavior and its activation configuration. If onApply returns an error, display it.
  function submitForm(event) {
    event.preventDefault();
    const result = onApply?.(behaviorId, activation);
    if (result && !result.ok) setFormError(result.error);
  }

  // This form saves configuration; runtime weighting is connected later.
  return (
    <div className={styles.inspectorFormViewport}>
      <form className={styles.inspectorForm} onSubmit={submitForm}>
        <div className={styles.formIntroduction}>
          <div className={styles.formHeadingRow}>
            <Activity className={styles.formHeadingIcon} size={20} aria-hidden="true" />
            <div>
              <h3 className={styles.formTitle}>Configure Activation</h3>
              <p className={styles.formDescription}>Configure how this behavior calculates its weight.</p>
            </div>
          </div>
        </div>

        <fieldset className={styles.formSection}>
          <legend className={styles.formSectionTitle}>Behavior Affiliation</legend>
          <div className={styles.inputGroup}>
            <label className={styles.formLabel} htmlFor="activation-behavior">Behavior to Configure</label>
            <select
              id="activation-behavior"
              className={`${styles.formInput} ${styles.formSelect}`}
              value={behaviorId}
              disabled={behaviors.length === 0}
              onChange={(event) => selectBehavior(event.target.value)}
            >
              <option value="">{behaviors.length === 0 ? "No behaviors available" : "Select a behavior"}</option>
              {behaviors.map((behavior) => (
                <option key={behavior.id} value={behavior.id}>
                  {behavior.name} · #{behavior.id.slice(0, 6)}
                </option>
              ))}
            </select>
            {behaviors.length === 0 && (
              <p className={styles.formHelperText}>
                No behaviors yet. Create a behavior before configuring its activation.
              </p>
            )}
          </div>
        </fieldset>
        
        {behaviors.length > 0 && behaviorId && (
          <ActivationFields
            value={activation}
            onChange={setActivation}
            entityTypeDefinitions={entityTypeDefinitions}
          />
        )}

        {formError && (
          <p className={styles.formError} role="alert">{formError}</p>
        )}

        <div className={styles.formActions}>
          <button
            className={`${styles.primaryAction} ${styles.formActionButton}`}
            type="submit"
            disabled={!behaviorId}
          >
            <Check size={16} aria-hidden="true" /> Apply Activation
          </button>
          <button className={`${styles.secondaryAction} ${styles.formActionButton}`} type="button" onClick={onCancel}>
            <X size={16} aria-hidden="true" /> Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
