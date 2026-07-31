import { ClipboardPen } from "lucide-react";
import { FORM_MODES, INSPECTOR_MODES } from "./inspector/modeConstants.js";
import InspectorBuild from "./inspector/forms/InspectorBuild.jsx";
import styles from "../../styles/3rd-gen/simulation.module.css";

import RuntimeSettingsForm from "./inspector/forms/RuntimeSettingsForm.jsx";
import AgentForm from "./inspector/forms/AgentForm.jsx";
import ObstacleForm from "./inspector/forms/ObstacleForm.jsx";
import BehaviorForm from "./inspector/forms/BehaviorForm.jsx";

export default function Inspector({
  view,
  onChangeView,
  hasSimulationContent,
  runtimeSettings,
  onApplyRuntimeSettings,
  onCloseRuntimeSettings,
  onCreateAgents,
  onRegenerateAgentPreview,
  onUpdateAgentPreviewAppearance,
  onCancelAgentCreation,
  onUpdateObstaclePreview,
  onClearObstaclePreview,
  onCreateObstacle,
  onCancelObstacleCreation,
  selectedObstacle,
  obstacleEditValues,
  onApplyObstacleEdits,
  onCancelObstacleEdit,
  onCreateBehavior,
  selectedBehavior,
  behaviorEditValues,
  onApplyBehaviorEdits,
  onCancelBehaviorEdit,
  selectedAgent,
  agentEditValues,
  onApplyAgentEdits,
  onCancelAgentEdit,
}) {
  function renderContent() {
    switch (view.mode) {
      case INSPECTOR_MODES.ADD_AGENT:
        return (
          <AgentForm
            mode={FORM_MODES.CREATE}
            onRegeneratePreview={onRegenerateAgentPreview}
            onUpdatePreviewAppearance={onUpdateAgentPreviewAppearance}
            onSubmit={onCreateAgents}
            onCancel={onCancelAgentCreation}
        />
      );

      case INSPECTOR_MODES.EDIT_AGENT:
        if (!selectedAgent || !agentEditValues) {
          return (
            <InspectorBuild
              hasContent={hasSimulationContent}
              onChangeView={onChangeView}
            />
          );
        }

        return (
          <AgentForm
            key={selectedAgent.id}
            mode={FORM_MODES.EDIT}
            initialValues={agentEditValues}
            onSubmit={onApplyAgentEdits}
            onCancel={onCancelAgentEdit}
          />
        );

      case INSPECTOR_MODES.ADD_OBSTACLE:
        return (
          <ObstacleForm
            mode={FORM_MODES.CREATE}
            onUpdatePreview={onUpdateObstaclePreview}
            onClearPreview={onClearObstaclePreview}
            onSubmit={onCreateObstacle}
            onCancel={onCancelObstacleCreation}
          />
        );

      case INSPECTOR_MODES.EDIT_OBSTACLE:
        if (!selectedObstacle || !obstacleEditValues) {
          return (
            <InspectorBuild
              hasContent={hasSimulationContent}
              onChangeView={onChangeView}
            />
          );
        }

        return (
          <ObstacleForm
            key={selectedObstacle.ID ?? selectedObstacle.id}
            mode={FORM_MODES.EDIT}
            initialValues={obstacleEditValues}
            onSubmit={onApplyObstacleEdits}
            onCancel={onCancelObstacleEdit}
          />
        );

      case INSPECTOR_MODES.CREATE_BEHAVIOR:
        return (
          <BehaviorForm
            mode={FORM_MODES.CREATE}
            onSubmit={onCreateBehavior}
            onCancel={() =>
              onChangeView({ mode: INSPECTOR_MODES.EMPTY })
            }
          />
        );

      case INSPECTOR_MODES.EDIT_BEHAVIOR:
        if (!selectedBehavior || !behaviorEditValues) {
          return (
            <InspectorBuild
              hasContent={hasSimulationContent}
              onChangeView={onChangeView}
            />
          );
        }

        return (
          <BehaviorForm
            key={selectedBehavior.id}
            mode={FORM_MODES.EDIT}
            initialValues={behaviorEditValues}
            onSubmit={onApplyBehaviorEdits}
            onCancel={onCancelBehaviorEdit}
          />
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
