import styles from '../../styles/3rd-gen/simulation.module.css';

export default function EntityExplorerFilter({ value: filters, onChange }) {
  const obstacleFilters = filters.obstacle;
  const allObstacleShapesSelected = obstacleFilters.circle && obstacleFilters.polygon;
  const someObstacleShapesSelected = obstacleFilters.circle || obstacleFilters.polygon;
  const allSelected = filters.agent && allObstacleShapesSelected;

  // This function selects or clears every Scenario Entity filter.
  function handleSelectAll(checked) {
    onChange({
      agent: checked,
      obstacle: {
        circle: checked,
        polygon: checked,
      },
    });
  }

  // This function updates one top-level Entity filter.
  function handleEntityChange(entityType, checked) {
    if (entityType === 'agent') {
      onChange({ ...filters, agent: checked });
      return;
    }

    onChange({
      ...filters,
      obstacle: {
        circle: checked,
        polygon: checked,
      },
    });
  }

  // This function updates one Obstacle shape filter.
  function handleObstacleShapeChange(shapeType, checked) {
    onChange({
      ...filters,
      obstacle: {
        ...obstacleFilters,
        [shapeType]: checked,
      },
    });
  }

  // This function keeps only the requested Entity type or Obstacle shape.
  function handleOnly(entityType, shapeType = null) {
    onChange({
      agent: entityType === 'agent',
      obstacle: {
        circle: entityType === 'obstacle'
          && (shapeType === null || shapeType === 'circle'),
        polygon: entityType === 'obstacle'
          && (shapeType === null || shapeType === 'polygon'),
      },
    });
  }

  return (
    <div className={`${styles.behaviorTargetBox} ${styles.explorerFilterPanel}`}>
      <div className={styles.targetSelectorAllRow}>
        <span className={styles.targetSelectorAllLabel}>Select All</span>
        <label className={styles.formSwitch}>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => handleSelectAll(event.target.checked)}
            aria-label="Select all Entity Explorer filters"
          />
          <span aria-hidden="true" />
        </label>
      </div>

      <div className={styles.targetSelectorDivider} />

      <div className={styles.targetSelectorGroup}>
        <div className={styles.targetSelectorRow}>
          <label className={styles.formCheckbox}>
            <input
              type="checkbox"
              checked={filters.agent}
              onChange={(event) => handleEntityChange(
                'agent',
                event.target.checked
              )}
            />
            Agents
          </label>
          <button
            className={styles.targetSelectorOnly}
            type="button"
            onClick={() => handleOnly('agent')}
          >
            Only
          </button>
        </div>
      </div>

      <div className={styles.targetSelectorGroup}>
        <div className={styles.targetSelectorRow}>
          <label className={styles.formCheckbox}>
            <input
              type="checkbox"
              checked={allObstacleShapesSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = someObstacleShapesSelected
                    && !allObstacleShapesSelected;
                }
              }}
              onChange={(event) => handleEntityChange(
                'obstacle',
                event.target.checked
              )}
            />
            Obstacles
          </label>
          <button
            className={styles.targetSelectorOnly}
            type="button"
            onClick={() => handleOnly('obstacle')}
          >
            Only
          </button>
        </div>

        <div className={styles.behaviorObstacleTargets}>
          {['circle', 'polygon'].map((shapeType) => (
            <div className={styles.targetSelectorRow} key={shapeType}>
              <label className={styles.formCheckbox}>
                <input
                  type="checkbox"
                  checked={obstacleFilters[shapeType]}
                  onChange={(event) => handleObstacleShapeChange(
                    shapeType,
                    event.target.checked
                  )}
                />
                {shapeType[0].toUpperCase() + shapeType.slice(1)}
              </label>
              <button
                className={styles.targetSelectorOnly}
                type="button"
                onClick={() => handleOnly('obstacle', shapeType)}
              >
                Only
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
