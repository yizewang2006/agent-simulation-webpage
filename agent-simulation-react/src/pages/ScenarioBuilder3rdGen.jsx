import Header from '../components/simulation-3rd-gen/Header3rdGen.jsx';
import Footer from '../components/shared/Footer.jsx';
import styles from '../styles/3rd-gen/simulation.module.css';

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

export default function ScenarioBuilder3rdGen() {
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
      </section>
    );
  }

  return (
    <div className={styles.simulationPage}>
      <Header title="Scenario Builder" subtitle="3rd Generation" />

      <main className={styles.simulationArea} aria-label="Scenario Builder workspace">
        {renderScenarioBuilderCanvas()}
      </main>

      <Footer />
    </div>
  );
}
