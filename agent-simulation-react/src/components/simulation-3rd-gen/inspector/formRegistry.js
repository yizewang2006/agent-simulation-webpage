import { ENTITY_TYPES } from "../../../utils/constants.js";
import AgentForm from "./forms/AgentForm.jsx";
import BehaviorForm from "./forms/BehaviorForm.jsx";
import ObstacleForm from "./forms/ObstacleForm.jsx";
import ActivationForm from "./forms/ActivationForm.jsx";
import { INSPECTOR_MODES } from "./modeConstants.js";

// Register a mode only after its form can actually be rendered.
const FORM_COMPONENTS = Object.freeze({
  [INSPECTOR_MODES.ADD_AGENT]: AgentForm,
  [INSPECTOR_MODES.EDIT_AGENT]: AgentForm,
  [INSPECTOR_MODES.ADD_OBSTACLE]: ObstacleForm,
  [INSPECTOR_MODES.EDIT_OBSTACLE]: ObstacleForm,
  [INSPECTOR_MODES.CREATE_BEHAVIOR]: BehaviorForm,
  [INSPECTOR_MODES.EDIT_BEHAVIOR]: BehaviorForm,
  [INSPECTOR_MODES.CREATE_ACTIVATION]: ActivationForm, // ActivationForm,
  [INSPECTOR_MODES.EDIT_ACTIVATION]: ActivationForm, // ActivationForm,
});

// Adding an entity type to constants makes it appear in the menu. Add its
// create mode here when a matching form and Inspector route are ready.
export const ENTITY_CREATE_MODES = Object.freeze({
  [ENTITY_TYPES.AGENT]: INSPECTOR_MODES.ADD_AGENT,
  [ENTITY_TYPES.OBSTACLE]: INSPECTOR_MODES.ADD_OBSTACLE,
});

export function getFormComponent(mode) {
  return FORM_COMPONENTS[mode] ?? null;
}

export function hasFormComponent(mode) {
  return getFormComponent(mode) !== null;
}
