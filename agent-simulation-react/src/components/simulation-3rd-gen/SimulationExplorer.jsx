import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  BrainCircuit,
  ChevronDown,
  Circle,
  Download,
  FileUp,
  PencilRuler,
  PenLine,
  ScanSearch,
  Search,
  Shapes,
  Trash2,
  UserRoundPen,
  Play,
} from 'lucide-react';
import styles from '../../styles/3rd-gen/simulation.module.css';

const EXPLORER_TABS = Object.freeze({
  ENTITIES: 'entities',
  BEHAVIORS: 'behaviors',
  RECORDINGS: 'recordings',
});

export default function SimulationExplorer({
  scenarioName,
  agents,
  obstacles,
  behaviors,
  recordings,
  onLoadJSON,
  onOpenScenarioBuilder,
  onEditAgent,
  onDeleteAgent,
  onEditObstacle,
  onDeleteObstacle,
  onPlayRecording,
  onDownloadRecording,
  onDeleteRecording,
}) {
  const [activeTab, setActiveTab] = useState(EXPLORER_TABS.ENTITIES);
  const [searchTerm, setSearchTerm] = useState('');
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
  }, [activeTab, agents, behaviors, obstacles, recordings]);

  const visibleEntries = entries.filter((entry) =>
    entry.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const activeTabLabel =
    activeTab === EXPLORER_TABS.ENTITIES
      ? 'entities'
      : activeTab === EXPLORER_TABS.BEHAVIORS
        ? 'behaviors'
        : 'recordings';

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

  function renderEntry({ id, name, type, Icon, target, subtitle }) {
    return (
      <div className={styles.explorerEntry} key={id}>
        <div className={styles.explorerEntryInfo}>
          <Icon size={17} aria-hidden="true" />
          <span>
            <strong>{name}</strong>
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
                  : 'Obstacle editing is coming next'
              }
              disabled={type === 'Obstacle'}
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
      </div>
    );
  }

  return (
    <aside className={`${styles.sidePanel} ${styles.workspaceSidePanel}`}>
      <header className={styles.panelHeader}>
        <ScanSearch className={styles.panelTitleIcon} size={20} aria-hidden="true" />
        <h2 className={styles.panelTitle}>Simulation Explorer</h2>
      </header>

      <div className={styles.explorerContent}>
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
                setActiveTab(tab);
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

        <div
          className={`${styles.explorerListViewport} ${
            hasMoreBelow ? styles.hasMoreBelow : ''
          }`}
        >
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

                  if (groupEntries.length === 0) return null;

                  return (
                    <section className={styles.explorerGroup} key={type}>
                      <h3 className={styles.explorerGroupHeading}>
                        <button
                          className={styles.explorerGroupTrigger}
                          type="button"
                          aria-expanded={!collapsedGroups[type]}
                          onClick={() => toggleGroup(type)}
                        >
                          <span className={styles.explorerGroupLabel}>
                            <ChevronDown
                              className={`${styles.explorerGroupChevron} ${
                                collapsedGroups[type] ? styles.isCollapsed : ''
                              }`}
                              size={15}
                              aria-hidden="true"
                            />
                            {type === 'Agent' ? 'Agents' : 'Obstacles'}
                          </span>
                          <span className={styles.explorerGroupCount}>
                            {groupEntries.length}
                          </span>
                        </button>
                      </h3>

                      {!collapsedGroups[type] && (
                        <div className={styles.explorerGroupEntries}>
                          {groupEntries.map(renderEntry)}
                        </div>
                      )}
                    </section>
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
    </aside>
  );
}
