import { ClipboardPen } from "lucide-react";
import { INSPECTOR_MODES } from "./inspector/inspectorModes.js";
import InspectorBuild from "./inspector/forms/InspectorBuild.jsx";
import styles from "../../styles/3rd-gen/simulation.module.css";

import RuntimeSettingsForm from "./inspector/forms/RuntimeSettingsForm.jsx";

export default function Inspector({
  view,
  onChangeView,
  hasSimulationContent,
  runtimeSettings,
  onApplyRuntimeSettings,
  onCloseRuntimeSettings,
}) {
  function renderContent() {
    switch (view.mode) {
      case INSPECTOR_MODES.ADD_AGENT:
        return (
          <div>
            <p>Add Agent will go here.</p>

            <button
              type="button"
              onClick={() =>
                onChangeView({ mode: INSPECTOR_MODES.EMPTY })
              }
            >
              Back
            </button>
          </div>
        );
        
      case INSPECTOR_MODES.RUNTIME_SETTINGS:
        return (
          <RuntimeSettingsForm
            initialSettings={runtimeSettings}
            onApply={onApplyRuntimeSettings}
            onCancel={onCloseRuntimeSettings}
          />
        );

      // Default is to AddToSimulationMenu
      default:
        return (
          <InspectorBuild
            hasContent={hasSimulationContent}
            onChangeView={onChangeView}
          />
        );
    }
  }

  return (
    <aside className={`${styles.sidePanel} ${styles.workspaceSidePanel}`}>
      <header className={styles.panelHeader}>
        <ClipboardPen
          className={styles.panelTitleIcon}
          size={20}
          aria-hidden="true"
        />

        <h2 className={styles.panelTitle}>
          Inspector
        </h2>
      </header>

      <div className={styles.inspectorContent}>
        {renderContent()}
      </div>
    </aside>
  );
}
