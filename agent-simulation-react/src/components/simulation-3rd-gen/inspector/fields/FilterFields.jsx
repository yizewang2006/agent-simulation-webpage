import { useState } from "react";
import { ChevronDown, ListFilterPlus, Trash2 } from "lucide-react";
import {
  ENTITY_LABELS,
  ENTITY_TYPES,
  MEASUREMENT_LABELS,
  MEASUREMENT_TYPES,
  METHOD_LABELS,
  METHOD_LABELS_BY_PROPERTY,
  METHOD_TYPES,
  OBSTACLE_SHAPE_LABELS,
  OBSTACLE_SHAPE_TYPES,
} from "../../../../utils/constants.js";
import styles from "../../../../styles/3rd-gen/simulation.module.css";

export default function FilterFields({
  filterKind,
  filters = [],
  onChange,
  emptyDescription,
  idPrefix,
}) {
  const [collapsedFilterIds, setCollapsedFilterIds] = useState(new Set());

  // Action and Activation pass different arrays into this shared editor.
  function addFilter() {
    onChange([...filters, createFilterDraft()]);
  }

  function updateFilter(filterId, updates) {
    onChange(
      filters.map((filter) =>
        filter.id === filterId ? { ...filter, ...updates } : filter
      )
    );
  }

  function deleteFilter(filterId) {
    onChange(filters.filter((filter) => filter.id !== filterId));
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

  return (
    <fieldset className={styles.formSection}>
      {/* The title makes the two independent filter sets easy to identify. */}
      <legend className={styles.formSectionTitle}>
        <span
          className={
            filterKind === "Action"
              ? styles.actionFilterTitle
              : styles.activationFilterTitle
          }
        >
          {filterKind}
        </span>{" "}
        Filters
      </legend>
      <p className={styles.formHelperText}>
        Action and Activation use separate filters!
      </p>

      {filters.length === 0 ? (
        <p className={styles.formHelperText}>{emptyDescription}</p>
      ) : (
        <div className={styles.behaviorFilterList}>
          {filters.map((filter, index) => {
            const isCollapsed = collapsedFilterIds.has(filter.id);
            const obstacleTargets = filter.targets[ENTITY_TYPES.OBSTACLE];

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
                    <strong>{filterKind} Filter {index + 1}</strong>
                    <span>
                      {filter.filterType === "method" ? "Method" : "Ranged"}
                      {" · "}
                      {MEASUREMENT_LABELS[filter.propertyType]}
                    </span>
                  </button>

                  <button
                    className={`${styles.secondaryAction} ${styles.behaviorFilterDelete}`}
                    type="button"
                    aria-label={`Delete ${filterKind} Filter ${index + 1}`}
                    title={`Delete ${filterKind} Filter ${index + 1}`}
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
                        {Object.entries(ENTITY_LABELS).map(([value, label]) => {
                          const entityType = Number(value);

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
                                        <label className={styles.formCheckbox} key={shapeType}>
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
                        })}
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <span className={styles.formLabel}>Type</span>
                      <div className={styles.formRadioGroup}>
                        {["method", "ranged"].map((filterType) => (
                          <label className={styles.formRadioOption} key={filterType}>
                            <input
                              type="radio"
                              name={`${idPrefix}-filter-type-${filter.id}`}
                              checked={filter.filterType === filterType}
                              onChange={() => updateFilter(filter.id, { filterType })}
                            />
                            {filterType === "method" ? "Method" : "Ranged"}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className={styles.inputGroup}>
                      <label className={styles.formLabel} htmlFor={`${idPrefix}-property-${filter.id}`}>
                        Property
                      </label>
                      <select
                        id={`${idPrefix}-property-${filter.id}`}
                        className={`${styles.formInput} ${styles.formSelect}`}
                        value={filter.propertyType}
                        onChange={(event) =>
                          updateFilter(filter.id, {
                            propertyType: Number(event.target.value),
                          })
                        }
                      >
                        {Object.entries(MEASUREMENT_LABELS).map(([value, label]) => (
                          <option value={value} key={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {filter.filterType === "method" ? (
                      <div className={styles.inputGroup}>
                        <label className={styles.formLabel} htmlFor={`${idPrefix}-method-${filter.id}`}>
                          Method
                        </label>
                        <select
                          id={`${idPrefix}-method-${filter.id}`}
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
                            <label className={styles.formLabel} htmlFor={`${idPrefix}-${bound}-${filter.id}`}>
                              {bound === "low" ? "Low" : "High"}
                            </label>
                            <div className={styles.inputWithUnit}>
                              <input
                                id={`${idPrefix}-${bound}-${filter.id}`}
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
        Add {filterKind} Filter
      </button>
    </fieldset>
  );
}

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
    propertyType: MEASUREMENT_TYPES.DISTANCE,
    methodType: METHOD_TYPES.CLOSEST,
    low: "",
    high: "",
  };
}

function getRangeUnit(propertyType) {
  if (propertyType === MEASUREMENT_TYPES.DISTANCE) return "px";
  if (
    propertyType === MEASUREMENT_TYPES.SPEED ||
    propertyType === MEASUREMENT_TYPES.SPEED_DIFFERENCE
  ) return "px/frame";
  return "degrees";
}
