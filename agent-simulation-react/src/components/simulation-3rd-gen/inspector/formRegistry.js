import { ENTITY_TYPES } from "../../../utils/constants.js";
import AgentForm, { AGENT_FORM_DESCRIPTION } from "./forms/AgentForm.jsx";
import AgentBehaviorForm, { AGENT_BEHAVIOR_FORM_DESCRIPTION } from "./forms/AgentBehaviorForm.jsx";
import ObstacleForm, { OBSTACLE_FORM_DESCRIPTION } from "./forms/ObstacleForm.jsx";
import ActivationForm, { ACTIVATION_FORM_DESCRIPTION } from "./forms/ActivationForm.jsx";
import ObstacleBehaviorForm, { OBSTACLE_BEHAVIOR_FORM_DESCRIPTION } from "./forms/ObstacleBehaviorForm.jsx";
import { Inspect } from "lucide-react";

export const INSPECTOR_MODES = Object.freeze({
    EMPTY : "empty",
    CREATE_AGENT: "create-agent",
    CREATE_OBSTACLE: "create-obstacle",
    CREATE_AGENT_BEHAVIOR: "create-agent-behavior",
    CREATE_OBSTACLE_BEHAVIOR: "create-obstacle-behavior",
    CREATE_ACTIVATION: "create-activation",
    EDIT_AGENT: "edit-agent",
    EDIT_OBSTACLE: "edit-obstacle",
    EDIT_BEHAVIOR: "edit-behavior",
    EDIT_OBSTACLE_BEHAVIOR: "edit-obstacle-behavior",
    EDIT_ACTIVATION: "edit-activation",
    RUNTIME_SETTINGS: "runtime-settings",
});

export const FORM_MODES = Object.freeze({
    // A shared form uses this mode to choose its create or edit fields.
    CREATE: "create",
    EDIT: "edit"
})

// Register a mode only after its form can actually be rendered.
const FORM_REGISTRY = Object.freeze({
  [INSPECTOR_MODES.CREATE_AGENT]: { Component: AgentForm, description: AGENT_FORM_DESCRIPTION },
  [INSPECTOR_MODES.EDIT_AGENT]: { Component: AgentForm, description: AGENT_FORM_DESCRIPTION },
  [INSPECTOR_MODES.CREATE_OBSTACLE]: { Component: ObstacleForm, description: OBSTACLE_FORM_DESCRIPTION },
  [INSPECTOR_MODES.EDIT_OBSTACLE]: { Component: ObstacleForm, description: OBSTACLE_FORM_DESCRIPTION },
  [INSPECTOR_MODES.CREATE_AGENT_BEHAVIOR]: { Component: AgentBehaviorForm, description: AGENT_BEHAVIOR_FORM_DESCRIPTION },
  [INSPECTOR_MODES.EDIT_BEHAVIOR]: { Component: AgentBehaviorForm, description: AGENT_BEHAVIOR_FORM_DESCRIPTION },
  [INSPECTOR_MODES.CREATE_OBSTACLE_BEHAVIOR]: { Component: ObstacleBehaviorForm, description: OBSTACLE_BEHAVIOR_FORM_DESCRIPTION },
  [INSPECTOR_MODES.EDIT_OBSTACLE_BEHAVIOR]: { Component: ObstacleBehaviorForm, description: OBSTACLE_BEHAVIOR_FORM_DESCRIPTION },
  [INSPECTOR_MODES.CREATE_ACTIVATION]: { Component: ActivationForm, description: ACTIVATION_FORM_DESCRIPTION },
  [INSPECTOR_MODES.EDIT_ACTIVATION]: { Component: ActivationForm, description: ACTIVATION_FORM_DESCRIPTION },
});

// Adding an entity type to constants makes it appear in the menu. Add its
// create mode here when a matching form and Inspector route are ready.
export const ENTITY_CREATE_MODES = Object.freeze({
  [ENTITY_TYPES.AGENT]: INSPECTOR_MODES.CREATE_AGENT,
  [ENTITY_TYPES.OBSTACLE]: INSPECTOR_MODES.CREATE_OBSTACLE,
});

export function getFormComponent(mode) {
  return FORM_REGISTRY[mode]?.Component ?? null;
}

export function getFormDescription(mode) {
  return FORM_REGISTRY[mode]?.description ?? "";
}

export function hasFormComponent(mode) {
  return getFormComponent(mode) !== null;
}
