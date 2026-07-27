import { useMemo, useState } from 'react';
import {
  Bot,
  BrainCircuit,
  Circle,
  FileUp,
  PencilRuler,
  ScanSearch,
  Search,
  Shapes,
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
}) {
  const [activeTab, setActiveTab] = useState(EXPLORER_TABS.ENTITIES);
  const [searchTerm, setSearchTerm] = useState('');

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
      }));
    }

    return [
      ...agents.map((agent, index) => ({
        id: agent.id ?? `agent-${index}`,
        name: agent.id || agent.name || `Agent ${index + 1}`,
        type: 'Agent',
        Icon: Bot,
      })),
      ...obstacles.map((obstacle, index) => ({
        id: obstacle.ID ?? obstacle.id ?? `obstacle-${index}`,
        name: obstacle.ID || obstacle.id || `Obstacle ${index + 1}`,
        type: 'Obstacle',
        Icon: Shapes,
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

        <div className={styles.explorerList}>
          {visibleEntries.length > 0 ? (
            visibleEntries.map(({ id, name, type, Icon }) => (
              <button className={styles.explorerEntry} type="button" key={id}>
                <Icon size={17} aria-hidden="true" />
                <span>
                  <strong>{name}</strong>
                  <small>{type}</small>
                </span>
              </button>
            ))
          ) : (
            <p className={styles.explorerEmpty}>
              {searchTerm
                ? `No matching ${activeTabLabel}.`
                : `No ${activeTabLabel} yet.`}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
