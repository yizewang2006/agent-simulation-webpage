import { useEffect, useRef, useState } from "react";
import {
  BrainCircuit,
  ChevronDown,
  CopyPlus,
  ListFilterPlus,
  Trash2,
  X,
} from "lucide-react";
import { FORM_MODES } from "../modeConstants.js";
import {
  ENTITY_LABELS,
  ENTITY_TYPES,
  FILTER_LABELS,
  FILTER_TYPES,
  METHOD_LABELS,
  METHOD_LABELS_BY_PROPERTY,
  METHOD_TYPES,
  OBSTACLE_SHAPE_LABELS,
  OBSTACLE_SHAPE_TYPES,
  REFERENCE_LABELS,
  REFERENCE_TYPES,
  PROPERTY_LABELS,
  TARGET_PROPERTIES,
} from "../../../../utils/constants.js";
import styles from "../../../../styles/3rd-gen/simulation.module.css";

export default function BehaviorForm({
  mode = FORM_MODES.CREATE,
  initialValues,
  onSubmit,
  onCancel,
}) {
  const [name, setName] = useState(initialValues?.name ?? "Behavior");
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
  const [collapsedFilterIds, setCollapsedFilterIds] = useState(new Set());
  const [formError, setFormError] = useState("");
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const formRef = useRef(null);

  // Show the fade only when more fields are below.
  function updateScrollHint() {
    const form = formRef.current;
    if (!form) return;

    setHasMoreBelow(
      form.scrollTop + form.clientHeight < form.scrollHeight - 2
    );
  }

  useEffect(() => {
    const form = formRef.current;
    if (!form) return undefined;

    updateScrollHint();
    const resizeObserver = new ResizeObserver(updateScrollHint);
    resizeObserver.observe(form);
    return () => resizeObserver.disconnect();
  }, [filters, collapsedFilterIds]);

  function createFilterDraft() {
    return {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      targets: {
        [ENTITY_TYPES.AGENT]: true,
        [ENTITY_TYPES.OBSTACLE]: {
          enabled: false,
          [OBSTACLE_SHAPE_TYPES.CIRCLE]: true,
          [OBSTACLE_SHAPE_TYPES.POLYGON]: true,
        },
        [ENTITY_TYPES.LEADER]: false,
        [ENTITY_TYPES.EXIT]: false,
      },
      filterType: "method",
      propertyType: FILTER_TYPES.DISTANCE,
      methodType: METHOD_TYPES.CLOSEST,
      low: "",
      high: "",
    };
  }

  function addFilter() {
    setFilters((currentFilters) => [...currentFilters, createFilterDraft()]);
  }

  function updateFilter(filterId, updates) {
    setFilters((currentFilters) =>
      currentFilters.map((filter) =>
        filter.id === filterId ? { ...filter, ...updates } : filter
      )
    );
  }

  function deleteFilter(filterId) {
    setFilters((currentFilters) =>
      currentFilters.filter((filter) => filter.id !== filterId)
    );
    setCollapsedFilterIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(filterId);
      return nextIds;
    });
  }

  function toggleFilter(filterId) {
    setCollapsedFilterIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(filterId)) nextIds.delete(filterId);
      else nextIds.add(filterId);
      return nextIds;
    });
  }

  function updateEntityTarget(filter, entityType, checked) {
    if (entityType === ENTITY_TYPES.OBSTACLE) {
      updateFilter(filter.id, {
        targets: {
          ...filter.targets,
          [ENTITY_TYPES.OBSTACLE]: {
            ...filter.targets[ENTITY_TYPES.OBSTACLE],
            enabled: checked,
          },
        },
      });
      return;
    }

    updateFilter(filter.id, {
      targets: { ...filter.targets, [entityType]: checked },
    });
  }

  function updateObstacleTarget(filter, shapeType, checked) {
    updateFilter(filter.id, {
      targets: {
        ...filter.targets,
        [ENTITY_TYPES.OBSTACLE]: {
          ...filter.targets[ENTITY_TYPES.OBSTACLE],
          [shapeType]: checked,
        },
      },
    });
  }

  function getRangeUnit(propertyType) {
    if (propertyType === FILTER_TYPES.DISTANCE) return "px";
    if (propertyType === FILTER_TYPES.SPEED) return "px/frame";
    return "degrees";
  }

  // Position and Angle are angular; Speed uses distance per update.
  const offsetUnit =
    targetProperty === TARGET_PROPERTIES.SPEED ? "px/frame" : "degrees";
  const isEditing = mode === FORM_MODES.EDIT;

  function submitForm(event) {
    event.preventDefault();

    // Submit the complete draft only when the user clicks Create.
    const result = onSubmit?.({
      name,
      targetProperty,
      referenceSource,
      offset,
      filters,
    });

    if (result && !result.ok) {
      setFormError(result.error);
    }
  }

  return (
    <div
      className={`${styles.inspectorFormViewport} ${
        hasMoreBelow ? styles.hasMoreBelow : ""
      }`}
    >
      <form
        ref={formRef}
        className={styles.inspectorForm}
        onScroll={updateScrollHint}
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

        <fieldset className={styles.formSection}>
          <legend className={styles.formSectionTitle}>General</legend>

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
          </div>
        </fieldset>

        <fieldset className={styles.formSection}>
          <legend className={styles.formSectionTitle}>
            Behavior Specifications
          </legend>

          <div className={styles.inputGroup}>
            <label className={styles.formLabel} htmlFor="behavior-target-property">
              Target Property
            </label>
            <select
              id="behavior-target-property"
              className={`${styles.formInput} ${styles.formSelect}`}
              value={targetProperty}
              onChange={(event) =>
                setTargetProperty(Number(event.target.value))
              }
            >
              {Object.entries(PROPERTY_LABELS).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
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
                onChange={(event) => setOffset(event.target.value)}
              />
              <span className={styles.inputUnit}>{offsetUnit}</span>
            </div>
          </div>
        </fieldset>

        <fieldset className={styles.formSection}>
          <legend className={styles.formSectionTitle}>
            Filter Specifications
          </legend>
          {filters.length === 0 ? (
            <p className={styles.formHelperText}>
              Without filters, this behavior uses the average value from all
              neighbors currently in view.
            </p>
          ) : (
            <div className={styles.behaviorFilterList}>
              {filters.map((filter, index) => {
                const isCollapsed = collapsedFilterIds.has(filter.id);
                const obstacleTargets =
                  filter.targets[ENTITY_TYPES.OBSTACLE];

                return (
                  <section className={styles.behaviorFilterCard} key={filter.id}>
                    <div className={styles.behaviorFilterHeader}>
                      <button
                        className={styles.behaviorFilterToggle}
                        type="button"
                        aria-expanded={!isCollapsed}
                        onClick={() => toggleFilter(filter.id)}
                      >
                        <ChevronDown
                          className={`${styles.explorerGroupChevron} ${
                            isCollapsed ? styles.isCollapsed : ""
                          }`}
                          size={16}
                          aria-hidden="true"
                        />
                        <strong>Filter {index + 1}</strong>
                        <span>
                          {filter.filterType === "method" ? "Method" : "Ranged"}
                          {" · "}
                          {FILTER_LABELS[filter.propertyType]}
                        </span>
                      </button>

                      <button
                        className={`${styles.secondaryAction} ${styles.behaviorFilterDelete}`}
                        type="button"
                        aria-label={`Delete Filter ${index + 1}`}
                        title={`Delete Filter ${index + 1}`}
                        onClick={() => deleteFilter(filter.id)}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>

                    {!isCollapsed && (
                      <div className={styles.behaviorFilterBody}>
                        <div className={styles.inputGroup}>
                          <span className={styles.formLabel}>Target Entity Types</span>
                          <div className={styles.behaviorTargetBox}>
                            {Object.entries(ENTITY_LABELS).map(
                              ([entityTypeValue, label]) => {
                                const entityType = Number(entityTypeValue);

                                if (entityType === ENTITY_TYPES.OBSTACLE) {
                                  return (
                                    <div key={entityType}>
                                      <label className={styles.formCheckbox}>
                                        <input
                                          type="checkbox"
                                          checked={obstacleTargets.enabled}
                                          onChange={(event) =>
                                            updateEntityTarget(
                                              filter,
                                              entityType,
                                              event.target.checked
                                            )
                                          }
                                        />
                                        {label}
                                      </label>

                                      <div className={styles.behaviorObstacleTargets}>
                                        {Object.entries(OBSTACLE_SHAPE_LABELS).map(
                                          ([shapeValue, shapeLabel]) => {
                                            const shapeType = Number(shapeValue);
                                            return (
                                              <label
                                                className={styles.formCheckbox}
                                                key={shapeType}
                                              >
                                                <input
                                                  type="checkbox"
                                                  disabled={!obstacleTargets.enabled}
                                                  checked={obstacleTargets[shapeType]}
                                                  onChange={(event) =>
                                                    updateObstacleTarget(
                                                      filter,
                                                      shapeType,
                                                      event.target.checked
                                                    )
                                                  }
                                                />
                                                {shapeLabel}
                                              </label>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <label className={styles.formCheckbox} key={entityType}>
                                    <input
                                      type="checkbox"
                                      checked={filter.targets[entityType]}
                                      onChange={(event) =>
                                        updateEntityTarget(
                                          filter,
                                          entityType,
                                          event.target.checked
                                        )
                                      }
                                    />
                                    {label}
                                  </label>
                                );
                              }
                            )}
                          </div>
                        </div>

                        <div className={styles.inputGroup}>
                          <span className={styles.formLabel}>Type</span>
                          <div className={styles.formRadioGroup}>
                            {["method", "ranged"].map((filterType) => (
                              <label className={styles.formRadioOption} key={filterType}>
                                <input
                                  type="radio"
                                  name={`filter-type-${filter.id}`}
                                  value={filterType}
                                  checked={filter.filterType === filterType}
                                  onChange={() =>
                                    updateFilter(filter.id, { filterType })
                                  }
                                />
                                {filterType === "method" ? "Method" : "Ranged"}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.formLabel} htmlFor={`filter-property-${filter.id}`}>
                            Property
                          </label>
                          <select
                            id={`filter-property-${filter.id}`}
                            className={`${styles.formInput} ${styles.formSelect}`}
                            value={filter.propertyType}
                            onChange={(event) =>
                              updateFilter(filter.id, {
                                propertyType: Number(event.target.value),
                              })
                            }
                          >
                            {Object.entries(FILTER_LABELS).map(([value, label]) => (
                              <option value={value} key={value}>{label}</option>
                            ))}
                          </select>
                        </div>

                        {filter.filterType === "method" ? (
                          <div className={styles.inputGroup}>
                            <label className={styles.formLabel} htmlFor={`filter-method-${filter.id}`}>
                              Method
                            </label>
                            <select
                              id={`filter-method-${filter.id}`}
                              className={`${styles.formInput} ${styles.formSelect}`}
                              value={filter.methodType}
                              onChange={(event) =>
                                updateFilter(filter.id, {
                                  methodType: Number(event.target.value),
                                })
                              }
                            >
                              {Object.entries(
                                METHOD_LABELS_BY_PROPERTY[filter.propertyType] ?? METHOD_LABELS
                              ).map(([value, label]) => (
                                <option value={value} key={value}>{label}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className={styles.formFieldRow}>
                            {["low", "high"].map((bound) => (
                              <div className={styles.inputGroup} key={bound}>
                                <label className={styles.formLabel} htmlFor={`filter-${bound}-${filter.id}`}>
                                  {bound === "low" ? "Low" : "High"}
                                </label>
                                <div className={styles.inputWithUnit}>
                                  <input
                                    id={`filter-${bound}-${filter.id}`}
                                    className={styles.formInput}
                                    type="number"
                                    value={filter[bound]}
                                    onChange={(event) =>
                                      updateFilter(filter.id, {
                                        [bound]: event.target.value,
                                      })
                                    }
                                  />
                                  <span className={styles.inputUnit}>
                                    {getRangeUnit(filter.propertyType)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          <button
            className={`${styles.secondaryAction} ${styles.formActionButton}`}
            type="button"
            onClick={addFilter}
          >
            <ListFilterPlus size={16} aria-hidden="true" />
            Add Filter
          </button>
        </fieldset>

        <fieldset className={styles.formSection}>
          <legend className={styles.formSectionTitle}>
            Activation Specifications
          </legend>
          <p className={styles.formHelperText}>
            Activation settings will be configured later.
          </p>
        </fieldset>

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
            <CopyPlus size={16} aria-hidden="true" />
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
