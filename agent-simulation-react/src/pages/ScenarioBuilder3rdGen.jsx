import { Bot, FileDown, FileUp, MonitorPlay, Redo2, Shapes, Trash2, Undo2, Wrench } from 'lucide-react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/simulation-3rd-gen/Header3rdGen.jsx';
import { getFormComponent } from '../components/simulation-3rd-gen/inspector/formRegistry.js';
import { INSPECTOR_MODES } from '../components/simulation-3rd-gen/inspector/modeConstants.js';
import AddToSimulationMenu from '../components/simulation-3rd-gen/inspector/sub-components/AddToSimulationMenu.jsx';
import ScenarioBuilderCanvas from '../components/scenario-builder-3rd-gen/ScenarioBuilderCanvas.jsx';
import Footer from '../components/shared/Footer.jsx';
import ExplorerEntry from '../components/workspace/ExplorerEntry.jsx';
import WorkspaceExplorer from '../components/workspace/WorkspaceExplorer.jsx';
import WorkspaceInspector from '../components/workspace/WorkspaceInspector.jsx';
import InlineNameEdit from '../components/workspace/InlineNameEdit.jsx';
import { BUILDER_TABS, ENTITY_TYPES } from '../utils/constants.js';
import { createEntityID, formatID } from '../utils/utilities.js';
import {
  createAgentDrafts,
  getAgentCreationKey,
  getAgentPreviewRange,
  MAX_SCENARIO_AGENTS,
  parseAgentCreationValues,
} from '../utils/scenarioBuilderAgents.js';
import { parseObstacleCreationValues } from '../utils/scenarioBuilderObstacles.js';
import styles from '../styles/3rd-gen/simulation.module.css';

const BUILDER_ENTITY_TYPES = [ENTITY_TYPES.AGENT, ENTITY_TYPES.OBSTACLE];

export default function ScenarioBuilder3rdGen() {
  const navigate = useNavigate();
  const agentPreviewRef = useRef([]);
  const agentPreviewKeyRef = useRef('');
  const [scenarioName, setScenarioName] = useState('Untitled Scenario');
  const [builderTab, setBuilderTab] = useState(BUILDER_TABS.ENTITIES);
  const [agents, setAgents] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [previewAgents, setPreviewAgents] = useState([]);
  const [previewRange, setPreviewRange] = useState(null);
  const [previewObstacle, setPreviewObstacle] = useState(null);
  const [inspectorMode, setInspectorMode] = useState(INSPECTOR_MODES.EMPTY);

  function storeAgentPreview(nextAgents, config) {
    agentPreviewRef.current = nextAgents;
    agentPreviewKeyRef.current = getAgentCreationKey(config);
    setPreviewAgents(nextAgents);
    setPreviewRange(getAgentPreviewRange(config));
  }

  function clearAgentPreview() {
    agentPreviewRef.current = [];
    agentPreviewKeyRef.current = '';
    setPreviewAgents([]);
    setPreviewRange(null);
  }

  function regenerateAgentPreview(values) {
    try {
      const config = parseAgentCreationValues(values);
      const remainingCapacity = MAX_SCENARIO_AGENTS - agents.length;
      if (config.count > remainingCapacity) {
        throw new Error(`Only ${remainingCapacity} more Agents can be added.`);
      }

      storeAgentPreview(createAgentDrafts(config), config);
      return { ok: true };
    } catch (error) {
      clearAgentPreview();
      return { ok: false, error: error.message };
    }
  }

  function updateAgentPreviewAppearance(values) {
    try {
      const config = parseAgentCreationValues(values);
      const nextAgents = agentPreviewRef.current.map((agent) => ({
        ...agent,
        colorHex: config.colorHex,
        fovAngle: config.fovAngle,
        showFOV: config.showFOV,
      }));
      storeAgentPreview(nextAgents, config);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function createAgents(values) {
    try {
      const config = parseAgentCreationValues(values);
      const remainingCapacity = MAX_SCENARIO_AGENTS - agents.length;
      if (config.count > remainingCapacity) {
        throw new Error(`Only ${remainingCapacity} more Agents can be added.`);
      }

      const configKey = getAgentCreationKey(config);
      const drafts = (
        agentPreviewKeyRef.current === configKey
        && agentPreviewRef.current.length === config.count
      )
        ? agentPreviewRef.current
        : createAgentDrafts(config);
      const createdAgents = drafts.map((draft, index) => ({
        ...draft,
        id: createEntityID(ENTITY_TYPES.AGENT),
        name: `Agent_${agents.length + index + 1}`,
      }));

      setAgents([...agents, ...createdAgents]);
      clearAgentPreview();
      setBuilderTab(BUILDER_TABS.ENTITIES);
      setInspectorMode(INSPECTOR_MODES.EMPTY);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function cancelAgentCreation() {
    clearAgentPreview();
    setInspectorMode(INSPECTOR_MODES.EMPTY);
  }

  function updateObstaclePreview(values) {
    try {
      setPreviewObstacle(parseObstacleCreationValues(values));
    } catch {
      setPreviewObstacle(null);
    }
  }

  function clearObstaclePreview() {
    setPreviewObstacle(null);
  }

  function createObstacle(values) {
    try {
      const config = parseObstacleCreationValues(values);
      let obstacleName = config.name;

      if (!obstacleName) {
        let nextNumber = obstacles.length + 1;
        do {
          obstacleName = `Obstacle_${nextNumber}`;
          nextNumber += 1;
        } while (obstacles.some((obstacle) => obstacle.name === obstacleName));
      }

      const obstacle = {
        ...config,
        id: createEntityID(ENTITY_TYPES.OBSTACLE),
        name: obstacleName,
      };

      setObstacles([...obstacles, obstacle]);
      clearObstaclePreview();
      setBuilderTab(BUILDER_TABS.ENTITIES);
      setInspectorMode(INSPECTOR_MODES.EMPTY);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function cancelObstacleCreation() {
    clearObstaclePreview();
    setInspectorMode(INSPECTOR_MODES.EMPTY);
  }

  function renderScenarioExplorer() {
    return (
      <WorkspaceExplorer title="Scenario Explorer">
        <div className={styles.explorerContent}>
          <section className={styles.scenarioCard} aria-labelledby="builder-current-scenario-title">
            <p className={styles.scenarioEyebrow} id="builder-current-scenario-title">
              Current Scenario
            </p>
            <InlineNameEdit
              value={scenarioName}
              onCommit={setScenarioName}
              fallback="Untitled Scenario"
              ariaLabel="Scenario name"
            />

            <div className={styles.scenarioActions}>
              <button className={styles.scenarioLoadButton} type="button" disabled>
                <FileUp size={16} aria-hidden="true" />
                Import JSON
              </button>
              {/* Will export scenario created here (not including behavior/activation...). */}
              <button className={styles.scenarioLoadButton} type="button" disabled>
                <FileDown size={16} aria-hidden="true" />
                Export JSON
              </button>
            </div>

            <button
              className={`${styles.scenarioBuilderButton} ${styles.scenarioLaunchButton}`}
              type="button"
              onClick={() => navigate('/loading', {
                state: {
                  from: 'Scenario Builder',
                  to: 'Main Simulation',
                  path: '/simulation',
                },
              })}
            >
              <MonitorPlay size={16} aria-hidden="true" />
              Main Simulation
            </button>
          </section>

          <div
            className={`${styles.explorerTabs} ${styles.builderExplorerTabs}`}
            role="tablist"
            aria-label="Scenario Builder contents"
          >
            {Object.values(BUILDER_TABS).map((tab) => (
              <button
                id={`builder-tab-${tab}`}
                key={tab}
                className={styles.explorerTab}
                type="button"
                role="tab"
                aria-controls={`builder-tabpanel-${tab}`}
                aria-selected={builderTab === tab}
                onClick={() => setBuilderTab(tab)}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {builderTab === BUILDER_TABS.ENTITIES && (
            <div
              id={`builder-tabpanel-${BUILDER_TABS.ENTITIES}`}
              className={styles.explorerListViewport}
              role="tabpanel"
              aria-labelledby={`builder-tab-${BUILDER_TABS.ENTITIES}`}
            >
              <div className={styles.explorerList}>
                {agents.length === 0 && obstacles.length === 0 ? (
                  <p className={styles.explorerEmpty}>No entities yet.</p>
                ) : (
                  <>
                    {agents.length > 0 && (
                      <section className={styles.explorerGroup}>
                        <h3 className={styles.builderGroupHeading}>
                          <span>Agents</span>
                          <span className={styles.explorerGroupCount}>{agents.length}</span>
                        </h3>
                        <div className={styles.explorerGroupEntries}>
                          {agents.map((agent) => (
                            <ExplorerEntry
                              key={agent.id}
                              name={agent.name}
                              type="Agent"
                              Icon={Bot}
                              subtitle="Agent"
                              trimmedId={`#${formatID(agent.id)}`}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {obstacles.length > 0 && (
                      <section className={styles.explorerGroup}>
                        <h3 className={styles.builderGroupHeading}>
                          <span>Obstacles</span>
                          <span className={styles.explorerGroupCount}>{obstacles.length}</span>
                        </h3>
                        <div className={styles.explorerGroupEntries}>
                          {obstacles.map((obstacle) => (
                            <ExplorerEntry
                              key={obstacle.id}
                              name={obstacle.name}
                              type="Obstacle"
                              Icon={Shapes}
                              subtitle={`${obstacle.shapeType === 'circle' ? 'Circle' : 'Polygon'} Obstacle`}
                              trimmedId={`#${formatID(obstacle.id)}`}
                            />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </WorkspaceExplorer>
    );
  }

  function renderScenarioBuilderCanvas() {
    return (
      <section className={styles.centerWorkspace} aria-label="Scenario Builder canvas">
        <ScenarioBuilderCanvas
          agents={agents}
          obstacles={obstacles}
          previewAgents={previewAgents}
          previewRange={previewRange}
          previewObstacle={previewObstacle}
        />

        <section className={styles.runtimeCard} aria-labelledby="build-tools-title">
          <h2 className={styles.runtimeTitle} id="build-tools-title">
            <Wrench size={20} aria-hidden="true" />
            Build Tools
          </h2>

          <div className={`${styles.runtimeOptions} ${styles.buildToolActions}`}>
            <button
              className={`${styles.secondaryAction} ${styles.runtimeOptionButton}`}
              type="button"
              disabled
            >
              <Undo2 size={14} aria-hidden="true" />
              Undo
            </button>
            <button
              className={`${styles.secondaryAction} ${styles.runtimeOptionButton}`}
              type="button"
              disabled
            >
              <Redo2 size={14} aria-hidden="true" />
              Redo
            </button>
            <button
              className={`${styles.dangerAction} ${styles.runtimeOptionButton}`}
              type="button"
              disabled
            >
              <Trash2 size={14} aria-hidden="true" />
              Clear
            </button>
          </div>
        </section>
      </section>
    );
  }

  function renderScenarioInspector() {
    const FormComponent = getFormComponent(inspectorMode);

    return (
      <WorkspaceInspector>
        <div className={styles.inspectorContent}>
          {inspectorMode === INSPECTOR_MODES.ADD_AGENT && FormComponent ? (
            <FormComponent
              onRegeneratePreview={regenerateAgentPreview}
              onUpdatePreviewAppearance={updateAgentPreviewAppearance}
              onSubmit={createAgents}
              onCancel={cancelAgentCreation}
            />
          ) : inspectorMode === INSPECTOR_MODES.ADD_OBSTACLE && FormComponent ? (
            <FormComponent
              onUpdatePreview={updateObstaclePreview}
              onClearPreview={clearObstaclePreview}
              onSubmit={createObstacle}
              onCancel={cancelObstacleCreation}
            />
          ) : (
            <div className={styles.inspectorBuild}>
              <h3 className={styles.inspectorBuildTitle}>
                {agents.length === 0 && obstacles.length === 0
                  ? 'Build Your Scenario'
                  : 'Nothing Selected'}
              </h3>
              <p className={styles.inspectorBuildInstruction}>
                {agents.length === 0 && obstacles.length === 0
                  ? 'Add an entity to begin building the scenario.'
                  : 'Select an entity to edit it, or add another entity.'}
              </p>
              <AddToSimulationMenu
                entityTypes={BUILDER_ENTITY_TYPES}
                showBehaviors={false}
                triggerLabel="Scenario Components"
                onSelectMode={setInspectorMode}
              />
            </div>
          )}
        </div>
      </WorkspaceInspector>
    );
  }

  return (
    <div className={styles.simulationPage}>
      <Header title="Scenario Builder" subtitle="3rd Generation" />

      <main className={styles.simulationArea} aria-label="Scenario Builder workspace">
        {renderScenarioExplorer()}
        {renderScenarioBuilderCanvas()}
        {renderScenarioInspector()}
      </main>

      <Footer />
    </div>
  );
}
