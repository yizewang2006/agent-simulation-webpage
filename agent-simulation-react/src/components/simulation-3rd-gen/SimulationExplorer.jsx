import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  BrainCircuit,
  Camera,
  ChevronDown,
  Circle,
  Download,
  FileDown,
  FileUp,
  History,
  PencilRuler,
  PenLine,
  Search,
  Shapes,
  SlidersHorizontal,
  Trash2,
  UserRoundPen,
  Play,
  RotateCcw,
} from 'lucide-react';
import WorkspaceExplorer from '../workspace/WorkspaceExplorer.jsx';
import ExplorerEntry from '../workspace/ExplorerEntry.jsx';
import InlineNameEdit from '../workspace/InlineNameEdit.jsx';
import AlertBox from '../simulation/AlertBox.jsx';
import EntityExplorerFilter from '../workspace/EntityExplorerFilter.jsx';
import {
  BEHAVIOR_GROUP_DEFINITIONS,
  getBehaviorGroupKey,
} from '../../utils/behaviorGroups.js';
import {
  ENTITY_LABELS,
  ENTITY_TYPES,
  EXPLORER_TABS,
  MEASUREMENT_LABELS,
  METHOD_LABELS_BY_PROPERTY,
  OBSTACLE_SHAPE_LABELS,
  OBSTACLE_SHAPE_TYPES,
  PROPERTY_LABELS,
  REFERENCE_LABELS,
} from '../../utils/constants.js';
import { ACTIVATION_TYPES } from '../../models/activation.js';
import { formatID } from '../../utils/utilities.js';
import styles from '../../styles/3rd-gen/simulation.module.css';

export default function SimulationExplorer({
  activeTab,
  onTabChange,
  scenarioName,
  onRenameScenario,
  agents,
  obstacles,
  behaviors,
  recordings,
  snapshots,
  onLoadJSON,
  onExportScenario,
  onLoadBehaviorPreset,
  onExportBehaviors,
  onOpenScenarioBuilder,
  onEditAgent,
  onRenameAgent,
  onDeleteAgent,
  onDeleteAllAgents,
  onEditObstacle,
  onRenameObstacle,
  onDeleteObstacle,
  onDeleteAllObstacles,
  onEditBehavior,
  onRenameBehavior,
  onSetBehaviorEnabled,
  onDeleteBehavior,
  onDeleteAllBehaviors,
  onPlayRecording,
  onRenameRecording,
  onDownloadRecording,
  onDeleteRecording,
  onRestoreSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
  onCreateSnapshot,
  snapshotLimit,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showEntityFilters, setShowEntityFilters] = useState(false);
  const [entityFilters, setEntityFilters] = useState({
    agent: true,
    obstacle: {
      circle: true,
      polygon: true,
    },
  });
  const [snapshotToRestore, setSnapshotToRestore] = useState(null);
  const [snapshotToDelete, setSnapshotToDelete] = useState(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({
    Agent: false,
    Obstacle: false,
  });
  const [expandedBehaviorIds, setExpandedBehaviorIds] = useState(new Set());
  const listRef = useRef(null);

  const entries = useMemo(() => {
    if (activeTab === EXPLORER_TABS.BEHAVIORS) {
      return behaviors.map((behavior, index) => ({
        id: behavior.id ?? `behavior-${index}`,
        name: behavior.name || `Behavior ${index + 1}`,
        type: 'Behavior',
        Icon: BrainCircuit,
        target: behavior,
        subtitle: behavior.id ? `#${behavior.id.slice(0, 6)}` : 'Behavior',
      }));
    }

    if (activeTab === EXPLORER_TABS.RECORDINGS) {
      return recordings.map((recording, index) => ({
        id: recording.id ?? `recording-${index}`,
        name: recording.name || `Recording ${index + 1}`,
        type: 'Recording',
        Icon: Circle,
        target: recording,
        subtitle: `${recording.frames?.length ?? 0} frames`,
      }));
    }

    if (activeTab === EXPLORER_TABS.HISTORY) {
      return snapshots.map((snapshot) => ({
        id: snapshot.id,
        name: snapshot.name,
        type: 'Snapshot',
        Icon: History,
        target: snapshot,
        subtitle: snapshot.createdAt,
      }));
    }

    return [
      ...agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        type: 'Agent',
        Icon: Bot,
        target: agent,
        subtitle: 'Agent',
        trimmedId: `#${formatID(agent.id)}`,
      })),
      ...obstacles.map((obstacle) => ({
        id: obstacle.id,
        name: obstacle.name,
        type: 'Obstacle',
        Icon: Shapes,
        target: obstacle,
        subtitle: 'Obstacle',
        trimmedId: `#${formatID(obstacle.id)}`,
      })),
    ];
  }, [activeTab, agents, behaviors, obstacles, recordings, snapshots]);

  const visibleEntries = entries.filter((entry) => {
    const matchesSearch = entry.name
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    if (!matchesSearch || activeTab !== EXPLORER_TABS.ENTITIES) {
      return matchesSearch;
    }
    if (entry.type === 'Agent') return entityFilters.agent;

    const shapeFilter = entry.target.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE
      ? 'circle'
      : 'polygon';
    return entityFilters.obstacle[shapeFilter];
  });

  const hasActiveEntityFilters = !entityFilters.agent
    || !entityFilters.obstacle.circle
    || !entityFilters.obstacle.polygon;

  const activeTabLabel = activeTab;

  function updateScrollHint() {
    const list = listRef.current;

    if (!list) return;

    setHasMoreBelow(
      list.scrollTop + list.clientHeight < list.scrollHeight - 2
    );
  }

  useEffect(() => {
    const list = listRef.current;

    if (!list) return undefined;

    updateScrollHint();

    const resizeObserver = new ResizeObserver(updateScrollHint);
    resizeObserver.observe(list);

    return () => resizeObserver.disconnect();
  }, [activeTab, searchTerm, visibleEntries.length, collapsedGroups]);

  function toggleGroup(type) {
    setCollapsedGroups((currentGroups) => ({
      ...currentGroups,
      [type]: !currentGroups[type],
    }));
  }

  function toggleBehaviorDetails(behaviorId) {
    setExpandedBehaviorIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(behaviorId)) nextIds.delete(behaviorId);
      else nextIds.add(behaviorId);
      return nextIds;
    });
  }

  function formatFilterTargets(targets) {
    const selectedTargets = Object.values(ENTITY_TYPES)
      .filter((entityType) => entityType !== ENTITY_TYPES.OBSTACLE)
      .filter((entityType) => targets[entityType] === true)
      .map((entityType) => ENTITY_LABELS[entityType]);
    const obstacleTargets = targets[ENTITY_TYPES.OBSTACLE];

    if (obstacleTargets.enabled) {
      const selectedShapes = Object.values(OBSTACLE_SHAPE_TYPES)
        .filter((shapeType) => obstacleTargets[shapeType] === true);

      if (selectedShapes.length === Object.keys(OBSTACLE_SHAPE_LABELS).length) {
        selectedTargets.push(ENTITY_LABELS[ENTITY_TYPES.OBSTACLE]);
      } else {
        selectedTargets.push(...selectedShapes.map(
          (shapeType) => `${OBSTACLE_SHAPE_LABELS[shapeType]} Obstacle`
        ));
      }
    }

    if (selectedTargets.length === Object.keys(ENTITY_LABELS).length) return 'All Entities';
    if (selectedTargets.length === 1) return `${selectedTargets[0]} Only`;
    return selectedTargets.join(', ');
  }

  function renderBehaviorDetails(behavior) {
    const activation = behavior.activation;
    const activationTypeLabels = {
      [ACTIVATION_TYPES.ALWAYS_ACTIVE]: 'Always Active',
      [ACTIVATION_TYPES.BINARY]: 'Binary',
      [ACTIVATION_TYPES.LINEAR]: 'Linear',
    };

    return (
      <div className={styles.behaviorDetails}>
        <dl>
          <h4>Action Specifications</h4>
          <div><dt>Property</dt><dd>{PROPERTY_LABELS[behavior.targetProperty]}</dd></div>
          <div><dt>Reference</dt><dd>{REFERENCE_LABELS[behavior.action]}</dd></div>
          <div><dt>Offset</dt><dd>{behavior.offset || 0}</dd></div>
        </dl>

        {behavior.filters.length > 0 && <h4>Action Filters</h4>}
        {behavior.filters.map((filter, index) => (
          <dl key={filter.id}>
            <h5>Filter {index + 1}</h5>
            <div><dt>Targets</dt><dd>{formatFilterTargets(filter.targets)}</dd></div>
            <div><dt>Property</dt><dd>{MEASUREMENT_LABELS[filter.propertyType]}</dd></div>
            {filter.filterType === 'ranged' ? (
              <div><dt>Range</dt><dd>{filter.low}–{filter.high}</dd></div>
            ) : (
              <div><dt>Method</dt><dd>{METHOD_LABELS_BY_PROPERTY[filter.propertyType]?.[filter.methodType]}</dd></div>
            )}
          </dl>
        ))}

        <dl>
          <h4>Activation Specification</h4>
          <div><dt>Activation Function</dt><dd>{activationTypeLabels[activation.type]}</dd></div>
          {activation.type === ACTIVATION_TYPES.ALWAYS_ACTIVE ? (
            <div><dt>Weight</dt><dd>{activation.weight}</dd></div>
          ) : (
            <>
              <div><dt>Value Source</dt><dd>{activation.checkSource === 'self' ? 'Self Reference' : 'Neighbor Reference'}</dd></div>
              <div><dt>Value to Check</dt><dd>{MEASUREMENT_LABELS[activation.valueToCheck]}</dd></div>
              <div><dt>Range</dt><dd>{activation.lowerRange}–{activation.upperRange}</dd></div>
              {activation.type === ACTIVATION_TYPES.BINARY ? (
                <>
                  <div><dt>Weight</dt><dd>{activation.weight}</dd></div>
                  <div><dt>Active Range</dt><dd>{activation.inside ? 'Inside' : 'Outside'}</dd></div>
                </>
              ) : (
                <>
                  <div><dt>Slope</dt><dd>{activation.slope}</dd></div>
                  <div><dt>Direction</dt><dd>{activation.increase ? 'Increasing' : 'Decreasing'}</dd></div>
                </>
              )}
            </>
          )}
        </dl>

        {(activation.filters ?? []).length > 0 && <h4>Activation Filters</h4>}
        {(activation.filters ?? []).map((filter, index) => (
          <dl key={filter.id}>
            <h5>Filter {index + 1}</h5>
            <div><dt>Targets</dt><dd>{formatFilterTargets(filter.targets)}</dd></div>
            <div><dt>Property</dt><dd>{MEASUREMENT_LABELS[filter.propertyType]}</dd></div>
            {filter.filterType === 'ranged' ? (
              <div><dt>Range</dt><dd>{filter.low}–{filter.high}</dd></div>
            ) : (
              <div><dt>Method</dt><dd>{METHOD_LABELS_BY_PROPERTY[filter.propertyType]?.[filter.methodType]}</dd></div>
            )}
          </dl>
        ))}

        <div className={styles.behaviorDetailsActions}>
          <button
            className={`${styles.secondaryAction} ${styles.behaviorDetailsAction}`}
            type="button"
            onClick={() => onEditBehavior(behavior)}
          >
            <PenLine size={15} aria-hidden="true" />
            Edit Behavior
          </button>

          <button
            className={`${styles.secondaryAction} ${styles.behaviorDetailsAction}`}
            type="button"
            onClick={() => toggleBehaviorDetails(behavior.id)}
          >
            <ChevronDown className={styles.behaviorDetailsCollapseIcon} size={15} aria-hidden="true" />
            Collapse
          </button>
        </div>
      </div>
    );
  }

  function renderEntry({ id, name, type, Icon, target, subtitle, trimmedId }) {
    // Renaming changes only the History label, not the saved Entity data.
    const renameHandlers = {
      Agent: onRenameAgent,
      Obstacle: onRenameObstacle,
      Behavior: onRenameBehavior,
      Recording: onRenameRecording,
      Snapshot: onRenameSnapshot,
    };
    const renameHandler = renameHandlers[type];
    const onRename = renameHandler
      ? (nextName) => renameHandler(target.id, nextName)
      : undefined;
    const isBehaviorExpanded = type === 'Behavior' && expandedBehaviorIds.has(target.id);

    return (
      <ExplorerEntry
        key={id}
        name={name}
        type={type}
        Icon={Icon}
        subtitle={subtitle}
        trimmedId={trimmedId}
        onRename={onRename}
        details={isBehaviorExpanded ? renderBehaviorDetails(target) : undefined}
      >

        {/* If more entry types are added, come back here to assign their available actions. */}
        {(type === 'Agent' || type === 'Obstacle') && (
          <div className={styles.explorerEntryActions}>
            <button
              className={`${styles.secondaryAction} ${styles.explorerIconButton}`}
              type="button"
              aria-label={`Edit ${name}`}
              title={
                type === 'Agent'
                  ? 'Edit Agent'
                  : 'Edit Obstacle'
              }
              onClick={() => {
                if (type === 'Agent') onEditAgent(target);
                else onEditObstacle(target);
              }}
            >
              {type === 'Agent' ? (
                <UserRoundPen size={16} aria-hidden="true" />
              ) : (
                <PenLine size={16} aria-hidden="true" />
              )}
            </button>

            <button
              className={`${styles.secondaryAction} ${styles.explorerIconButton} ${styles.explorerDeleteButton}`}
              type="button"
              aria-label={`Delete ${name}`}
              title={`Delete ${type}`}
              onClick={() => {
                if (type === 'Agent') onDeleteAgent(target);
                else onDeleteObstacle(target);
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>

          </div>
        )}

        {type === 'Behavior' && (
          <div className={styles.explorerEntryActions}>
            <label
              className={styles.formSwitch}
              title={target.enabled === false ? 'Enable Behavior' : 'Disable Behavior'}
            >
              <input
                type="checkbox"
                role="switch"
                aria-label={`${target.enabled === false ? 'Enable' : 'Disable'} ${name}`}
                aria-checked={target.enabled !== false}
                checked={target.enabled !== false}
                onChange={(event) =>
                  onSetBehaviorEnabled(target.id, event.target.checked)
                }
              />
              <span aria-hidden="true" />
            </label>
            <button
              className={`${styles.secondaryAction} ${styles.explorerIconButton}`}
              type="button"
              aria-label={`Edit ${name}`}
              title="Edit Behavior"
              onClick={() => onEditBehavior(target)}
            >
              <PenLine size={16} aria-hidden="true" />
            </button>

            <button
              className={`${styles.secondaryAction} ${styles.explorerIconButton} ${styles.explorerDeleteButton}`}
              type="button"
              aria-label={`Delete ${name}`}
              title="Delete Behavior"
              onClick={() => onDeleteBehavior(target)}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>

            <button
              className={`${styles.secondaryAction} ${styles.explorerIconButton}`}
              type="button"
              aria-label={`${isBehaviorExpanded ? 'Collapse' : 'Expand'} ${name}`}
              aria-expanded={isBehaviorExpanded}
              title={`${isBehaviorExpanded ? 'Collapse' : 'Expand'} Behavior`}
              onClick={() => toggleBehaviorDetails(target.id)}
            >
              <ChevronDown
                className={`${styles.behaviorDetailsChevron} ${
                  isBehaviorExpanded ? styles.isExpanded : ''
                }`}
                size={16}
                aria-hidden="true"
              />
            </button>
          </div>
        )}

        {type === 'Recording' && (
          <div className={styles.explorerEntryActions}>
            <button
              className={`${styles.secondaryAction} ${styles.explorerIconButton}`}
              type="button"
              aria-label={`Play ${name}`}
              title="Open Playback"
              onClick={() => onPlayRecording(target)}
            >
              <Play size={15} fill="currentColor" aria-hidden="true" />
            </button>

            <button
              className={`${styles.secondaryAction} ${styles.explorerIconButton}`}
              type="button"
              aria-label={`Download ${name}`}
              title="Download Recording"
              onClick={() => onDownloadRecording(target)}
            >
              <Download size={15} aria-hidden="true" />
            </button>

            <button
              className={`${styles.secondaryAction} ${styles.explorerIconButton} ${styles.explorerDeleteButton}`}
              type="button"
              aria-label={`Delete ${name}`}
              title="Delete Recording"
              onClick={() => onDeleteRecording(target)}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        {type === 'Snapshot' && (
          <div className={styles.explorerEntryActions}>
            <button
              className={`${styles.secondaryAction} ${styles.explorerIconButton}`}
              type="button"
              aria-label={`Restore ${name}`}
              title="Restore Snapshot"
              onClick={() => setSnapshotToRestore(target)}
            >
              <RotateCcw size={15} aria-hidden="true" />
            </button>

            <button
              className={`${styles.secondaryAction} ${styles.explorerIconButton} ${styles.explorerDeleteButton}`}
              type="button"
              aria-label={`Delete ${name}`}
              title="Delete Snapshot"
              onClick={() => setSnapshotToDelete(target)}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          </div>
        )}
      </ExplorerEntry>
    );
  }

  function renderGroup(groupKey, label, groupEntries, onDeleteAll) {
    if (groupEntries.length === 0) return null;

    return (
      <section className={styles.explorerGroup} key={groupKey}>
        <h3 className={styles.explorerGroupHeading}>
          <button
            className={styles.explorerGroupTrigger}
            type="button"
            aria-expanded={!collapsedGroups[groupKey]}
            onClick={() => toggleGroup(groupKey)}
          >
            <span className={styles.explorerGroupLabel}>
              <ChevronDown
                className={`${styles.explorerGroupChevron} ${
                  collapsedGroups[groupKey] ? styles.isCollapsed : ''
                }`}
                size={15}
                aria-hidden="true"
              />
              {label}
            </span>
            <span className={styles.explorerGroupCount}>
              {groupEntries.length}
            </span>
          </button>

          <button
            className={`${styles.secondaryAction} ${styles.explorerIconButton} ${styles.explorerDeleteButton} ${styles.explorerDeleteAllButton}`}
            type="button"
            aria-label={`Delete all ${label.toLowerCase()}`}
            title={`Delete All ${label}`}
            onClick={onDeleteAll}
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </h3>

        {!collapsedGroups[groupKey] && (
          <div className={styles.explorerGroupEntries}>
            {groupEntries.map(renderEntry)}
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      {snapshotToRestore && (
        <AlertBox
          title={`Restore ${snapshotToRestore.name}?`}
          primMessage="Restore the simulation to this snapshot?"
          secMessage="Current runtime progress will be lost."
          type="danger"
          confirmLabel="Restore"
          cancelLabel="Cancel"
          onConfirm={() => {
            // Restore only after the user confirms the selected History item.
            onRestoreSnapshot(snapshotToRestore.data);
            setSnapshotToRestore(null);
          }}
          onCancel={() => setSnapshotToRestore(null)}
        />
      )}

      {snapshotToDelete && (
        <AlertBox
          title={`Delete ${snapshotToDelete.name}?`}
          primMessage="This snapshot will be permanently removed from History."
          secMessage="This action cannot be undone."
          type="danger"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => {
            // Delete only the selected Snapshot; the current Scenario is unchanged.
            onDeleteSnapshot(snapshotToDelete.id);
            setSnapshotToDelete(null);
          }}
          onCancel={() => setSnapshotToDelete(null)}
        />
      )}

      <WorkspaceExplorer title="Simulation Explorer">
      <div
        className={`${styles.explorerContent} ${
          hasMoreBelow ? styles.hasMoreBelow : ''
        }`}
      >
        <section className={styles.scenarioCard} aria-labelledby="current-scenario-title">
          <p className={styles.scenarioEyebrow} id="current-scenario-title">
            Current Scenario
          </p>
          <InlineNameEdit
            value={scenarioName}
            onCommit={onRenameScenario}
            fallback="Untitled Scenario"
            ariaLabel="Scenario name"
          />

          <div className={styles.scenarioActions}>
            <button
              className={styles.scenarioLoadButton}
              type="button"
              onClick={onLoadJSON}
            >
              <FileUp size={16} aria-hidden="true" />
              Import JSON
            </button>

            {/* Will export scenario created here (not including behavior/activation...). */}
            <button
              className={styles.scenarioLoadButton}
              type="button"
              onClick={onExportScenario}
            >
              <FileDown size={16} aria-hidden="true" />
              Export JSON
            </button>
          </div>

            <button
              className={`${styles.scenarioBuilderButton} ${styles.scenarioLaunchButton}`}
              type="button"
              onClick={onOpenScenarioBuilder}
            >
              <PencilRuler size={16} aria-hidden="true" />
              Scenario Builder
            </button>
        </section>

        <div className={styles.explorerTabs} role="tablist" aria-label="Simulation contents">
          {Object.values(EXPLORER_TABS).map((tab) => (
            <button
              key={tab}
              className={styles.explorerTab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => {
                onTabChange(tab);
                setSearchTerm('');
                setShowEntityFilters(false);
              }}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.explorerSearchRow}>
          <label className={styles.explorerSearch}>
            <Search size={15} aria-hidden="true" />
            <span className={styles.visuallyHidden}>Search {activeTabLabel}</span>
            <input
              type="search"
              value={searchTerm}
              placeholder={`Search ${activeTabLabel}...`}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          {activeTab === EXPLORER_TABS.ENTITIES && (
            <button
              className={`${styles.secondaryAction} ${styles.explorerFilterButton}`}
              type="button"
              aria-label="Filter entities"
              title="Filter Entities"
              aria-controls="simulation-entity-filters"
              aria-expanded={showEntityFilters}
              data-active={hasActiveEntityFilters || undefined}
              onClick={() => setShowEntityFilters((currentValue) => !currentValue)}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        {activeTab === EXPLORER_TABS.ENTITIES && showEntityFilters && (
          <div id="simulation-entity-filters">
            <EntityExplorerFilter
              value={entityFilters}
              onChange={setEntityFilters}
            />
          </div>
        )}

        {activeTab === EXPLORER_TABS.BEHAVIORS && (
          <div className={styles.explorerPresetAction}>
            <button
              className={`${styles.secondaryAction} ${styles.explorerPresetButton}`}
              type="button"
              onClick={onLoadBehaviorPreset}
            >
              <FileUp size={16} aria-hidden="true" />
              Load Behavior Preset
            </button>
            <button
              className={`${styles.secondaryAction} ${styles.explorerPresetButton}`}
              type="button"
              disabled={behaviors.length === 0}
              onClick={onExportBehaviors}
            >
              <Download size={16} aria-hidden="true" />
              Export Behaviors
            </button>
          </div>
        )}

        {activeTab === EXPLORER_TABS.HISTORY && (
          <div className={styles.explorerPresetAction}>
            <button
              className={`${styles.secondaryAction} ${styles.explorerPresetButton}`}
              type="button"
              disabled={snapshots.length >= snapshotLimit}
              title={
                snapshots.length >= snapshotLimit
                  ? 'Delete a snapshot before creating another.'
                  : 'Create a Snapshot'
              }
              onClick={onCreateSnapshot}
            >
              <Camera size={16} aria-hidden="true" />
              Create a Snapshot ({snapshots.length}/{snapshotLimit})
            </button>
          </div>
        )}

        <div className={styles.explorerListViewport}>
          <div
            ref={listRef}
            className={styles.explorerList}
            onScroll={updateScrollHint}
          >
            {visibleEntries.length > 0 ? (
              activeTab === EXPLORER_TABS.ENTITIES ? (
                // If more entity types are added, come back here to add their Explorer group.
                ['Agent', 'Obstacle'].map((type) => {
                  const groupEntries = visibleEntries.filter(
                    (entry) => entry.type === type
                  );

                  return renderGroup(
                    type,
                    type === 'Agent' ? 'Agents' : 'Obstacles',
                    groupEntries,
                    type === 'Agent' ? onDeleteAllAgents : onDeleteAllObstacles
                  );
                })
              ) : activeTab === EXPLORER_TABS.BEHAVIORS ? (
                BEHAVIOR_GROUP_DEFINITIONS.map(({ key, label }) => {
                  const groupEntries = visibleEntries.filter(
                    (entry) => getBehaviorGroupKey(entry.target.targetProperty) === key
                  );

                  return renderGroup(
                    `behavior-${key}`,
                    label,
                    groupEntries,
                    () => onDeleteAllBehaviors(key)
                  );
                })
              ) : (
                visibleEntries.map(renderEntry)
              )
            ) : (
              <p className={styles.explorerEmpty}>
                {/* Keep this empty-state copy aligned with the Scenario Builder Explorer. */}
                {activeTab === EXPLORER_TABS.ENTITIES
                  && (searchTerm || hasActiveEntityFilters)
                  ? `Don't see ${activeTabLabel} you're looking for? Try adjusting the filters.`
                  : searchTerm
                    ? `No matching ${activeTabLabel}.`
                  : `No ${activeTabLabel} yet.`}
              </p>
            )}
          </div>
        </div>
      </div>
      </WorkspaceExplorer>
    </>
  );
}
