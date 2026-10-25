import {
  ENTITY_TYPES,
  SHAPE_LABELS,
} from "../../../../utils/constants.js";
import styles from "../../../../styles/3rd-gen/simulation.module.css";

const obstacleShapeOptions = Object.entries(SHAPE_LABELS).map(
  ([type, label]) => ({ type: Number(type), label })
);

export default function TargetEntitySelector({
  value: targets,
  onChange,
  idPrefix,
  entityTypeDefinitions,
  entityTypes,
}) {
  const entityOptions = entityTypeDefinitions.map(({ id, name }) => ({
    type: id,
    label: name,
  }));
  const availableEntityOptions = entityOptions.filter(
    ({ type }) => !entityTypes || entityTypes.includes(type)
  );
  const obstacleTargets = targets[ENTITY_TYPES.OBSTACLE] ?? {};

  // Select All is derived from the current checkboxes. It is true only when
  // every regular entity and every obstacle shape is selected.
  const allSelected = availableEntityOptions.every(({ type }) => {
    if (type === ENTITY_TYPES.OBSTACLE) {
      return obstacleShapeOptions.every(
        ({ type: shapeType }) => obstacleTargets[shapeType] === true
      );
    }

    return targets[type] === true;
  });

  const allObstacleShapesSelected = obstacleShapeOptions.every(
    ({ type }) => obstacleTargets[type] === true
  );
  const someObstacleShapesSelected = obstacleShapeOptions.some(
    ({ type }) => obstacleTargets[type] === true
  );

  function handleSelectAll(checked) {
    const nextTargets = { ...targets };

    // Use the option lists so newly registered entity types and obstacle
    // shapes automatically participate in Select All.
    availableEntityOptions.forEach(({ type }) => {
      if (type === ENTITY_TYPES.OBSTACLE) {
        const nextObstacleTargets = { ...obstacleTargets, enabled: checked };
        obstacleShapeOptions.forEach(({ type: shapeType }) => {
          nextObstacleTargets[shapeType] = checked;
        });
        nextTargets[type] = nextObstacleTargets;
      } else {
        nextTargets[type] = checked;
      }
    });

    onChange(nextTargets);
  }

  function handleCheckboxChange(typeId, checked, shapeType = null) {
    // Regular entity checkbox: update that one value only.
    if (typeId !== ENTITY_TYPES.OBSTACLE) {
      onChange({ ...targets, [typeId]: checked });
      return;
    }

    const nextObstacleTargets = { ...obstacleTargets };

    if (shapeType === null) {
      // Obstacle parent checkbox controls all of its shapes.
      obstacleShapeOptions.forEach(({ type }) => {
        nextObstacleTargets[type] = checked;
      });
    } else {
      nextObstacleTargets[shapeType] = checked;
    }

    // The runtime uses enabled to decide whether obstacle targets are active.
    nextObstacleTargets.enabled = obstacleShapeOptions.some(
      ({ type }) => nextObstacleTargets[type] === true
    );

    onChange({
      ...targets,
      [ENTITY_TYPES.OBSTACLE]: nextObstacleTargets,
    });
  }

  function handleOnly(typeId, shapeType = null) {
    // Start with a completely cleared target object, then enable only the
    // requested entity or obstacle shape.
    const nextTargets = { ...targets };

    availableEntityOptions.forEach(({ type }) => {
      if (type === ENTITY_TYPES.OBSTACLE) {
        const nextObstacleTargets = { ...obstacleTargets, enabled: false };
        obstacleShapeOptions.forEach(({ type: currentShapeType }) => {
          nextObstacleTargets[currentShapeType] = false;
        });
        nextTargets[type] = nextObstacleTargets;
      } else {
        nextTargets[type] = false;
      }
    });

    if (typeId === ENTITY_TYPES.OBSTACLE) {
      const nextObstacleTargets = nextTargets[ENTITY_TYPES.OBSTACLE];

      if (shapeType === null) {
        // Obstacle Only means every obstacle shape, but no other entity type.
        obstacleShapeOptions.forEach(({ type }) => {
          nextObstacleTargets[type] = true;
        });
      } else {
        nextObstacleTargets[shapeType] = true;
      }

      nextObstacleTargets.enabled = true;
    } else {
      nextTargets[typeId] = true;
    }

    onChange(nextTargets);
  }

  return (
    <div className={styles.behaviorTargetBox}>
      <div className={styles.targetSelectorAllRow}>
        <span className={styles.targetSelectorAllLabel}>Select All</span>
        <label className={styles.formSwitch}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => handleSelectAll(event.target.checked)}
            aria-label="Select all target entity types"
          />
          <span aria-hidden="true" />
        </label>
      </div>

      <div className={styles.targetSelectorDivider} />

      {availableEntityOptions.map(({ type: typeId, label }) => {
        const isObstacle = typeId === ENTITY_TYPES.OBSTACLE;
        const checked = isObstacle
          ? allObstacleShapesSelected
          : targets[typeId] === true;

        return (
          <div className={styles.targetSelectorGroup} key={typeId}>
            <div className={styles.targetSelectorRow}>
              <label className={styles.formCheckbox}>
                <input
                  id={`${idPrefix}-target-${typeId}`}
                  type="checkbox"
                  checked={checked}
                  ref={(input) => {
                    // Show the mixed state when only some obstacle shapes are checked.
                    if (input) {
                      input.indeterminate =
                        isObstacle &&
                        someObstacleShapesSelected &&
                        !allObstacleShapesSelected;
                    }
                  }}
                  onChange={(event) =>
                    handleCheckboxChange(typeId, event.target.checked)
                  }
                />
                {label}
              </label>
              <button
                className={styles.targetSelectorOnly}
                type="button"
                onClick={() => handleOnly(typeId)}
              >
                Only
              </button>
            </div>

            {isObstacle && (
              <div className={styles.behaviorObstacleTargets}>
                {obstacleShapeOptions.map(({ type: shapeType, label: shapeLabel }) => (
                  <div className={styles.targetSelectorRow} key={shapeType}>
                    <label className={styles.formCheckbox}>
                      <input
                        id={`${idPrefix}-obstacle-shape-${shapeType}`}
                        type="checkbox"
                        checked={obstacleTargets[shapeType] === true}
                        onChange={(event) =>
                          handleCheckboxChange(
                            ENTITY_TYPES.OBSTACLE,
                            event.target.checked,
                            shapeType
                          )
                        }
                      />
                      {shapeLabel}
                    </label>
                    <button
                      className={styles.targetSelectorOnly}
                      type="button"
                      onClick={() => handleOnly(ENTITY_TYPES.OBSTACLE, shapeType)}
                    >
                      Only
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
