import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  BrainCircuit,
  Camera,
  ChevronDown,
  Circle,
  Download,
  FileUp,
  History,
  PencilRuler,
  PenLine,
  Search,
  Shapes,
  Trash2,
  UserRoundPen,
  Play,
  RotateCcw,
} from 'lucide-react';
import WorkspaceExplorer from '../workspace/WorkspaceExplorer.jsx';
import AlertBox from '../simulation/AlertBox.jsx';
import {
  BEHAVIOR_GROUP_DEFINITIONS,
  getBehaviorGroupKey,
} from '../../utils/behaviorGroups.js';
import { EXPLORER_TABS } from '../../utils/constants.js';
import styles from '../../styles/3rd-gen/simulation.module.css';

export default function SimulationExplorer({
  activeTab,
  onTabChange,
  scenarioName,
  agents,
  obstacles,
  behaviors,
  recordings,
  snapshots,
  onLoadJSON,
  onLoadBehaviorPreset,
  onExportBehaviors,
  onOpenScenarioBuilder,
  onEditAgent,
  onDeleteAgent,
  onDeleteAllAgents,
  onEditObstacle,
  onDeleteObstacle,
  onDeleteAllObstacles,
  onEditBehavior,
  onSetBehaviorEnabled,
  onDeleteBehavior,
  onDeleteAllBehaviors,
  onPlayRecording,
  onDownloadRecording,
  onDeleteRecording,
  onRestoreSnapshot,
  onRenameSnapshot,
  onDeleteSnapshot,
  onCreateSnapshot,
  snapshotLimit,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [snapshotToRestore, setSnapshotToRestore] = useState(null);
  const [snapshotToDelete, setSnapshotToDelete] = useState(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({
    Agent: false,
    Obstacle: false,
  });
  const listRef = useRef(null);

  const entries = useMemo(() => {
    if (activeTab === EXPLORER_TABS.BEHAVIORS) {
      return behaviors.map((behavior, index) => ({
        id: behavior.id ?? `behavior-${index}`,
        name: behavior.name || `Behavior ${index + 1}`,
        type: 'Behavior',
        Icon: BrainCircuit,
        target: behavior,
        subtitle: behavior.enabled === false ? 'Disabled' : 'Enabled',
        trimmedId: behavior.id ? `#${behavior.id.slice(0, 6)}` : '',
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
      ...agents.map((agent, index) => ({
        id: agent.id ?? `agent-${index}`,
        name: agent.id || agent.name || `Agent ${index + 1}`,
        type: 'Agent',
        Icon: Bot,
        target: agent,
        subtitle: 'Agent',
      })),
      ...obstacles.map((obstacle, index) => ({
        id: obstacle.ID ?? obstacle.id ?? `obstacle-${index}`,
        name: obstacle.ID || obstacle.id || `Obstacle ${index + 1}`,
        type: 'Obstacle',
        Icon: Shapes,
        target: obstacle,
        subtitle: 'Obstacle',
      })),
    ];
  }, [activeTab, agents, behaviors, obstacles, recordings, snapshots]);

  const visibleEntries = entries.filter((entry) =>
    entry.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

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

  function requestSnapshotRename(snapshot) {
    // Renaming changes only the History label, not the saved Entity data.
    const nextName = window.prompt('Rename snapshot:', snapshot.name)?.trim();
    if (nextName) onRenameSnapshot(snapshot.id, nextName);
  }

  function renderEntry({ id, name, type, Icon, target, subtitle, trimmedId }) {
    return (
      <div className={styles.explorerEntry} key={id}>
        <div className={styles.explorerEntryInfo}>
          {createElement(Icon, { size: 17, 'aria-hidden': true })}
          <span>
            <span className={styles.explorerEntryTitleRow}>
              <strong>{name}</strong>
              {trimmedId && <small>{trimmedId}</small>}
            </span>
            <small>{subtitle || type}</small>
          </span>
        </div>

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
              className={`${styles.secondaryAction} ${styles.explorerIconButton}`}
              type="button"
              aria-label={`Rename ${name}`}
              title="Rename Snapshot"
              onClick={() => requestSnapshotRename(target)}
            >
              <PenLine size={15} aria-hidden="true" />
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
      </div>
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
          <h3 className={styles.scenarioName}>{scenarioName}</h3>

          <div className={styles.scenarioActions}>
            <button
              className={styles.scenarioLoadButton}
              type="button"
              onClick={onLoadJSON}
            >
              <FileUp size={16} aria-hidden="true" />
              Load JSON
            </button>

            <button
              className={styles.scenarioBuilderButton}
              type="button"
              onClick={onOpenScenarioBuilder}
            >
              <PencilRuler size={16} aria-hidden="true" />
              Scenario Builder
            </button>
          </div>
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
              }}
            >
              {tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

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
                {searchTerm
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
