export const INSPECTOR_MODES = Object.freeze({
    EMPTY : "empty",
    ADD_AGENT: "add-agent",
    ADD_OBSTACLE: "add-obstacle",
    CREATE_BEHAVIOR: "create-behavior",
    CREATE_ACTIVATION: "create-activation",
    EDIT_AGENT: "edit-agent",
    EDIT_OBSTACLE: "edit-obstacle",
    EDIT_BEHAVIOR: "edit-behavior",
    EDIT_ACTIVATION: "edit-activation",
    RUNTIME_SETTINGS: "runtime-settings",
});

export const FORM_MODES = Object.freeze({
    // A shared form uses this mode to choose its create or edit fields.
    CREATE: "create",
    EDIT: "edit"
})
