import { Layers3, Redo2, Trash2, Undo2, Wrench } from 'lucide-react';
import Header from '../components/simulation-3rd-gen/Header3rdGen.jsx';
import Footer from '../components/shared/Footer.jsx';
import WorkspaceExplorer from '../components/workspace/WorkspaceExplorer.jsx';
import WorkspaceInspector from '../components/workspace/WorkspaceInspector.jsx';
import styles from '../styles/3rd-gen/simulation.module.css';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

export default function ScenarioBuilder3rdGen() {
  function renderScenarioExplorer() {
    return (
      <WorkspaceExplorer title="Scenario Explorer">
        <div className={styles.explorerContent}>
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

          <div className={styles.runtimeOptions}>
            <span className={styles.runtimeLabel}>History</span>
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
          </div>

          <div className={styles.runtimeOptions}>
            <span className={styles.runtimeLabel}>Scenario</span>
            <button
              className={`${styles.secondaryAction} ${styles.runtimeOptionButton}`}
              type="button"
              disabled
            >
              <Layers3 size={14} aria-hidden="true" />
              Layers
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
