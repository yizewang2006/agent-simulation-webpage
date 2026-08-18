import { FileDown, FileUp, MonitorPlay, Redo2, Trash2, Undo2, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/simulation-3rd-gen/Header3rdGen.jsx';
import Footer from '../components/shared/Footer.jsx';
import WorkspaceExplorer from '../components/workspace/WorkspaceExplorer.jsx';
import WorkspaceInspector from '../components/workspace/WorkspaceInspector.jsx';
import InlineNameEdit from '../components/workspace/InlineNameEdit.jsx';
import styles from '../styles/3rd-gen/simulation.module.css';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

export default function ScenarioBuilder3rdGen() {
  const navigate = useNavigate();
  const [scenarioName, setScenarioName] = useState('Untitled Scenario');

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

          <p className={styles.explorerEmpty}>No entities yet.</p>
        </div>
      </WorkspaceExplorer>
    );
  }

  function renderScenarioBuilderCanvas() {
    return (
      <section className={styles.centerWorkspace} aria-label="Scenario Builder canvas">
        <figure className={styles.canvasWrapper}>
          <figcaption className={styles.canvasSize}>
            Scenario Size: {CANVAS_WIDTH} × {CANVAS_HEIGHT}
          </figcaption>

          <div className={styles.canvasFrame}>
            <canvas
              className={styles.canvas}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              aria-label="Scenario editing canvas"
            />
          </div>
        </figure>

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
    return (
      <WorkspaceInspector>
        <div className={styles.inspectorContent}>
          <p className={styles.inspectorBuildInstruction}>
            Select an entity on the canvas to edit it.
          </p>
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
