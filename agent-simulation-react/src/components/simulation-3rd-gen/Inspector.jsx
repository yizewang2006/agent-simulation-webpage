import { useEffect, useRef, useState } from "react";
import { FORM_MODES, INSPECTOR_MODES } from "./inspector/formRegistry.js";
import InspectorBuild from "./inspector/forms/InspectorBuild.jsx";
import WorkspaceInspector from '../workspace/WorkspaceInspector.jsx';
import styles from "../../styles/3rd-gen/simulation.module.css";

import RuntimeSettingsForm from "./inspector/forms/RuntimeSettingsForm.jsx";
import { getFormComponent } from "./inspector/formRegistry.js";

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
  behaviors,
  selectedBehavior,
  behaviorEditValues,
  onApplyBehaviorEdits,
  onApplyActivation,
  onCancelBehaviorEdit,
  selectedAgent,
  agentEditValues,
  onApplyAgentEdits,
  onCancelAgentEdit,
  onDeleteSelectedAgent,
  onDeleteSelectedObstacle,
}) {
  const contentRef = useRef(null);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;

    function getScroller() {
      return content.querySelector(
        `.${styles.inspectorForm}, .${styles.settingsForm}`
      );
    }

    function updateScrollHint() {
      const scroller = getScroller();
      setHasMoreBelow(Boolean(
        scroller &&
        scroller.scrollTop + scroller.clientHeight < scroller.scrollHeight - 2
      ));
    }

    updateScrollHint();
    content.addEventListener("scroll", updateScrollHint, true);

    const resizeObserver = new ResizeObserver(updateScrollHint);
    resizeObserver.observe(content);
    const scroller = getScroller();
    if (scroller) resizeObserver.observe(scroller);

    const mutationObserver = new MutationObserver(updateScrollHint);
    mutationObserver.observe(content, { childList: true, subtree: true });

    return () => {
      content.removeEventListener("scroll", updateScrollHint, true);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [view.mode]);

  function renderContent() {
    // The registry is also what enables or disables Add-menu entries.
    const FormComponent = getFormComponent(view.mode);

    switch (view.mode) {
      case INSPECTOR_MODES.CREATE_AGENT:
        return (
          <FormComponent
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
          <FormComponent
            key={selectedAgent.id}
            mode={FORM_MODES.EDIT}
            initialValues={agentEditValues}
            onSubmit={onApplyAgentEdits}
            onCancel={onCancelAgentEdit}
            onDelete={onDeleteSelectedAgent}
          />
        );

      case INSPECTOR_MODES.CREATE_OBSTACLE:
        return (
          <FormComponent
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
          <FormComponent
            key={selectedObstacle.id}
            mode={FORM_MODES.EDIT}
            initialValues={obstacleEditValues}
            onSubmit={onApplyObstacleEdits}
            onCancel={onCancelObstacleEdit}
            onDelete={onDeleteSelectedObstacle}
          />
        );

      case INSPECTOR_MODES.CREATE_AGENT_BEHAVIOR:
        return (
          <FormComponent
            mode={FORM_MODES.CREATE}
            onSubmit={onCreateBehavior}
            onCancel={() =>
              onChangeView({ mode: INSPECTOR_MODES.EMPTY })
            }
          />
        );

      case INSPECTOR_MODES.CREATE_OBSTACLE_BEHAVIOR:
      case INSPECTOR_MODES.EDIT_OBSTACLE_BEHAVIOR:
        return (
          <FormComponent
            onCancel={() =>
              onChangeView({ mode: INSPECTOR_MODES.EMPTY })
            }
          />
        );

      case INSPECTOR_MODES.CREATE_ACTIVATION:
        return (
          <FormComponent
            mode={FORM_MODES.CREATE}
            behaviors={behaviors}
            onApply={onApplyActivation}
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
          <FormComponent
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
    <WorkspaceInspector>
      <div
        ref={contentRef}
        className={`${styles.inspectorContent} ${
          hasMoreBelow ? styles.hasMoreBelow : ""
        }`}
      >
        {renderContent()}
      </div>
    </WorkspaceInspector>
  );
}
