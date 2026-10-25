import { useState } from "react";
import {
  Activity,
  BrainCircuit,
  Check,
  ChevronDown,
  CopyPlus,
  X,
} from "lucide-react";
import { FORM_MODES } from "../formRegistry.js";
import ActivationFields from "../fields/ActivationFields.jsx";
import FilterFields from "../fields/FilterFields.jsx";
import {
  ACTIVATION_TYPES,
  createActivationDraft,
  getNextBehaviorColor,
} from "../../../../models/behavior.js";
import {
  ENTITY_TYPES,
  REFERENCE_LABELS,
  REFERENCE_TYPES,
  PROPERTY_LABELS,
  TARGET_PROPERTIES,
} from "../../../../utils/constants.js";
import styles from "../../../../styles/3rd-gen/simulation.module.css";

export const AGENT_BEHAVIOR_FORM_DESCRIPTION = "Create a definition of how agents respond to other entities.";

export default function AgentBehaviorForm({
  mode = FORM_MODES.CREATE,
  initialValues,
  properties,
  entityTypeDefinitions,
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState(initialValues?.name ?? "Behavior");
  const [color, setColor] = useState(
    () => initialValues?.visualSettings?.color ?? getNextBehaviorColor()
  );
  const [targetProperty, setTargetProperty] = useState(
    initialValues?.targetProperty ?? TARGET_PROPERTIES.POSITION
  );
  const [referenceSource, setReferenceSource] = useState(
    initialValues?.referenceSource ?? REFERENCE_TYPES.NEIGHBOR_REFERENCE
  );
  const [offset, setOffset] = useState(initialValues?.offset ?? "");
  const [filters, setFilters] = useState(() =>
    (initialValues?.filters ?? []).map((filter) => ({
      ...filter,
      targets: {
        ...filter.targets,
        [ENTITY_TYPES.OBSTACLE]: {
          ...filter.targets[ENTITY_TYPES.OBSTACLE],
        },
      },
    }))
  );
  // Action Filters and Activation Filters keep separate arrays.
  const [formError, setFormError] = useState("");
  // Activation is optional to configure, but never optional in saved data.
  const [activation, setActivation] = useState(() =>
    createActivationDraft(initialValues?.activation)
  );
  const [isActionExpanded, setIsActionExpanded] = useState(false);
  const [isActivationExpanded, setIsActivationExpanded] = useState(false);

  const propertyOptions = [
    ...Object.entries(PROPERTY_LABELS).map(([id, label]) => ({
      id: Number(id),
      label,
    })),
    ...properties.map((property) => ({
      id: property.id,
      label: property.name,
    })),
  ];

  // Position and Angle are angular; Speed uses distance per update.
  const offsetUnit =
    targetProperty === TARGET_PROPERTIES.SPEED ? "px/frame" : "degrees";
  const isEditing = mode === FORM_MODES.EDIT;

  function submitForm(event) {
    event.preventDefault();

    // Submit the complete draft only when the user clicks Create.
    const result = onSubmit?.({
      name,
      visualSettings: { color },
      targetProperty,
      referenceSource,
      offset,
      filters,
      activation,
    });

    if (result && !result.ok) {
      setFormError(result.error);
    }
  }

  return (
    <div className={styles.inspectorFormViewport}>
      <form
        className={styles.inspectorForm}
        onSubmit={submitForm}
      >
        <div className={styles.formIntroduction}>
          <div className={styles.formHeadingRow}>
            <BrainCircuit
              className={styles.formHeadingIcon}
              size={20}
              aria-hidden="true"
            />
            <div>
              <h3 className={styles.formTitle}>
                {isEditing ? "Edit Behavior" : "Create Behavior"}
              </h3>
              <p className={styles.formDescription}>
                Define how agents respond to a reference source.
              </p>
            </div>
          </div>
        </div>

        <div
          className={`${styles.formSection} ${styles.behaviorGeneralSection}`}
          role="group"
          aria-labelledby="behavior-general-title"
        >
          <div id="behavior-general-title" className={styles.formSectionTitle}>
            General
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.formLabel} htmlFor="behavior-name">
              Behavior Name
            </label>
            <input
              id="behavior-name"
              className={styles.formInput}
              type="text"
              value={name}
              placeholder="Behavior"
              onChange={(event) => setName(event.target.value)}
            />
            {initialValues?.id && (
              <p className={styles.formHelperText}>
                Behavior ID: #{initialValues.id.slice(0, 6)}
              </p>
            )}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.formLabel} htmlFor="behavior-color">
              Decision Vector Color
            </label>
            <div className={styles.formColorControl}>
              <input
                id="behavior-color"
                className={styles.formColorInput}
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
              <span className={styles.formColorValue}>
                {color.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`${styles.formSection} ${styles.specificationSection} ${styles.actionSpecificationSection}`}
          role="group"
          aria-labelledby="action-specifications-title"
        >
          <div
            id="action-specifications-title"
            className={styles.formSectionTitle}
          >
            <span className={styles.actionFilterTitle}>Action</span>{" "}
            Specifications
          </div>
          <div className={styles.specificationSummary}>
            <p className={styles.formHelperText}>
              Current: {PROPERTY_LABELS[targetProperty]} · {REFERENCE_LABELS[referenceSource]}
            </p>
            <p className={styles.formHelperText}>
              {getFilterCountLabel(filters.length)}
            </p>
          </div>

          <button
            className={`${styles.secondaryAction} ${styles.formActionButton} ${styles.specificationConfigureButton}`}
            type="button"
            aria-expanded={isActionExpanded}
            onClick={() => setIsActionExpanded((current) => !current)}
          >
            <span className={styles.specificationConfigureLabel}>
              <BrainCircuit size={16} aria-hidden="true" />
              Configure Action
            </span>
            <ChevronDown
              className={`${styles.explorerGroupChevron} ${
                isActionExpanded ? "" : styles.isCollapsed
              }`}
              size={18}
              aria-hidden="true"
            />
          </button>

          {isActionExpanded && (
            <div className={styles.specificationDisclosureBody}>
              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="behavior-target-property">
                  Target Property
                </label>
                <select
                  id="behavior-target-property"
                  className={`${styles.formInput} ${styles.formSelect}`}
                  value={String(targetProperty)}
                  onChange={(event) => {
                    const selectedProperty = propertyOptions.find(
                      (property) => String(property.id) === event.target.value
                    );
                    setTargetProperty(selectedProperty.id);
                  }}
                >
                  {propertyOptions.map((property) => (
                    <option value={String(property.id)} key={property.id}>
                      {property.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="behavior-reference-source">
                  Reference Source
                </label>
                <select
                  id="behavior-reference-source"
                  className={`${styles.formInput} ${styles.formSelect}`}
                  value={referenceSource}
                  onChange={(event) =>
                    setReferenceSource(Number(event.target.value))
                  }
                >
                  {Object.entries(REFERENCE_LABELS).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.formLabel} htmlFor="behavior-offset">
                  Offset
                </label>
                <div className={styles.inputWithUnit}>
                  <input
                    id="behavior-offset"
                    className={styles.formInput}
                    type="number"
                    value={offset}
                    min={targetProperty === TARGET_PROPERTIES.SPEED ? undefined : -360}
                    max={targetProperty === TARGET_PROPERTIES.SPEED ? undefined : 360}
                    onChange={(event) => setOffset(event.target.value)}
                  />
                  <span className={styles.inputUnit}>{offsetUnit}</span>
                </div>
              </div>

              <FilterFields
                filterKind="Action"
                filters={filters}
                entityTypeDefinitions={entityTypeDefinitions}
                onChange={setFilters}
                idPrefix="action"
                emptyDescription="Without filters, this behavior uses the average value from all neighbors currently in view."
              />
            </div>
          )}
        </div>

        <div
          className={`${styles.formSection} ${styles.specificationSection}`}
          role="group"
          aria-labelledby="activation-specifications-title"
        >
          <div
            id="activation-specifications-title"
            className={styles.formSectionTitle}
          >
            <span className={styles.activationFilterTitle}>Activation</span>{" "}
            Specifications
          </div>
          <div className={styles.specificationSummary}>
            <p className={styles.formHelperText}>
              Current: {getActivationSummary(activation)}
            </p>
            <p className={styles.formHelperText}>
              {getFilterCountLabel(activation.filters?.length ?? 0)}
            </p>
          </div>

          <button
            className={`${styles.secondaryAction} ${styles.formActionButton} ${styles.specificationConfigureButton}`}
            type="button"
            aria-expanded={isActivationExpanded}
            onClick={() => setIsActivationExpanded((current) => !current)}
          >
            <span className={styles.specificationConfigureLabel}>
              <Activity size={16} aria-hidden="true" />
              Configure Activation
            </span>
            <ChevronDown
              className={`${styles.explorerGroupChevron} ${
                isActivationExpanded ? "" : styles.isCollapsed
              }`}
              size={18}
              aria-hidden="true"
            />
          </button>

          {isActivationExpanded && (
            <div className={styles.specificationDisclosureBody}>
              {/* Shared fields keep inline and standalone Activation consistent. */}
              <ActivationFields
                value={activation}
                onChange={setActivation}
                entityTypeDefinitions={entityTypeDefinitions}
                idPrefix="behavior-activation"
              />
            </div>
          )}
        </div>

        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}

        <div className={styles.formActions}>
          <button
            className={`${styles.primaryAction} ${styles.formActionButton}`}
            type="submit"
          >
            {isEditing ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <CopyPlus size={16} aria-hidden="true" />
            )}
            {isEditing ? "Apply Changes" : "Create Behavior"}
          </button>

          <button
            className={`${styles.secondaryAction} ${styles.formActionButton}`}
            type="button"
            onClick={onCancel}
          >
            <X size={16} aria-hidden="true" />
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function getActivationSummary(activation) {
  if (activation.type === ACTIVATION_TYPES.BINARY) {
    return `Binary · Weight ${activation.weight}`;
  }
  if (activation.type === ACTIVATION_TYPES.LINEAR) {
    return `Linear · Slope ${activation.slope}`;
  }
  return `Always Active · Weight ${activation.weight}`;
}

function getFilterCountLabel(count) {
  return `${count} ${count === 1 ? "Filter" : "Filters"}`;
}
