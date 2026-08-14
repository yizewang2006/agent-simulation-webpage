import styles from '../../../../styles/3rd-gen/simulation.module.css';
import AddToSimulationMenu from '../sub-components/AddToSimulationMenu.jsx';

// Displayed when the Inspector is not creating or editing anything.
export default function InspectorBuild({ hasContent, onChangeView }) {
    // Change the empty-state copy once the simulation contains components.
    const title = hasContent
    ? "Nothing Selected"
    : "Build Your Simulation";

    const instruction = hasContent
    ? "Select an item from the Simulation Explorer to inspect it, or add another component."
    : "Add or configure components that control how your simulation looks and behaves.";

    // render based on answer
    return (
    <div className={styles.inspectorBuild}>
      <h3 className={styles.inspectorBuildTitle}>
        {title}
      </h3>

      <p className={styles.inspectorBuildInstruction}>
        {instruction}
      </p>

      {/* The menu decides which Inspector mode should open next. */}
      <AddToSimulationMenu
        onSelectMode={(mode) => onChangeView({ mode })}
      />
    </div>
  );
}
