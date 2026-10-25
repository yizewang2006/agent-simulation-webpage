import { useId, useState } from 'react';
import {
    // Activity, // Standalone Activation menu entry is intentionally hidden.
    BrainCircuit,
    Workflow,
    ChevronDown,
    CirclePlus,
    Flag,
    LogOut,
    ListPlus,
    Shapes,
    UserPlus,
} from 'lucide-react'

import {
  ENTITY_CREATE_MODES,
  getFormDescription,
  hasFormComponent,
  INSPECTOR_MODES,
} from '../formRegistry.js';
import { ENTITY_LABELS, ENTITY_TYPES } from '../../../../utils/constants.js';
import styles from "../../../../styles/3rd-gen/simulation.module.css";

const ENTITY_MENU_DETAILS = Object.freeze({
    [ENTITY_TYPES.AGENT]: {
        Icon: UserPlus,
    },
    [ENTITY_TYPES.OBSTACLE]: {
        Icon: Shapes,
    },
    [ENTITY_TYPES.LEADER]: {
        Icon: Flag,
    },
    [ENTITY_TYPES.EXIT]: {
        Icon: LogOut,
    },
});

export default function AddToSimulationMenu({
    onSelectMode,
    entityTypes = Object.values(ENTITY_TYPES),
    showBehaviors = true,
    triggerLabel = 'Simulation Components',
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const menuId = useId();
    const availableEntityTypes = entityTypes.filter(
        (typeId) => hasFormComponent(ENTITY_CREATE_MODES[typeId])
    );
    const hasAgentBehaviorForm = showBehaviors
        && hasFormComponent(INSPECTOR_MODES.CREATE_AGENT_BEHAVIOR);
    const hasObstacleBehaviorForm = showBehaviors
        && hasFormComponent(INSPECTOR_MODES.CREATE_OBSTACLE_BEHAVIOR);
    const hasCustomPropertyForm = hasFormComponent(
        INSPECTOR_MODES.CREATE_CUSTOM_PROPERTY
    );
    // Activation is configured inside BehaviorForm, not added as a separate component.
    // const hasActivationForm = hasFormComponent(INSPECTOR_MODES.CREATE_ACTIVATION);

    // Select Mode (when clicking on an entry)
    function selectMode(mode) {
        setIsExpanded(false);
        onSelectMode(mode);
    }

    return (
        <div 
        className={styles.addMenu}
        onKeyDown={(event) => {
            if (event.key === "Escape") {
                setIsExpanded(false);
            }
        }}>
            {/* Button to trigger the dropdown */}
            <button className={`${styles.primaryAction} ${styles.addMenuTrigger}`}
            type='button'
            aria-expanded={isExpanded}
            aria-controls={menuId}
            onClick={() => setIsExpanded((current) => !current)} // Flip the variable current
            >
                <span className={styles.addMenuTriggerContent}>
                    <CirclePlus size={18} aria-hidden="true" />
                    {triggerLabel}
                </span>
                <ChevronDown
                className={`${styles.addMenuChevron} ${
                    isExpanded ? styles.isOpen : ""
                }`}
                size={18}
                aria-hidden="true"
                />
            </button>

            {/* Actual Dropdown */}
            {isExpanded && (
                <div
                    id={menuId}
                    className={styles.addMenuPopover}
                >
                    <div className={styles.addMenuScrollArea}>
                    <section className={styles.addMenuSection}>
                        <h4 className={styles.addMenuSectionTitle}>Entities</h4>

                        {/* Hide entity types until their creation form is registered. */}
                        {availableEntityTypes.map((typeId) => {
                            const createMode = ENTITY_CREATE_MODES[typeId];
                            const details = ENTITY_MENU_DETAILS[typeId] ?? {};
                            const EntityIcon = details.Icon ?? Shapes;

                            return (
                                <button
                                    key={typeId}
                                    type="button"
                                    className={styles.listEntry}
                                    onClick={() => selectMode(createMode)}
                                >
                                    <EntityIcon
                                        className={styles.listEntryIcon}
                                        size={19}
                                        aria-hidden="true"
                                    />
                                    <span className={styles.listEntryText}>
                                        <span className={styles.listEntryName}>
                                            {ENTITY_LABELS[typeId] ?? `Entity ${typeId}`}
                                        </span>
                                        <span className={styles.listEntryDescription}>
                                            {getFormDescription(createMode)}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </section>

                    {hasCustomPropertyForm && (
                    <section className={styles.addMenuSection}>
                        <h4 className={styles.addMenuSectionTitle}>Properties</h4>

                        <button
                            type="button"
                            className={styles.listEntry}
                            onClick={() => selectMode(INSPECTOR_MODES.CREATE_CUSTOM_PROPERTY)}
                        >
                            <ListPlus className={styles.listEntryIcon} size={19} aria-hidden="true" />
                            <span className={styles.listEntryText}>
                                <span className={styles.listEntryName}>Custom Property</span>
                                <span className={styles.listEntryDescription}>
                                    {getFormDescription(INSPECTOR_MODES.CREATE_CUSTOM_PROPERTY)}
                                </span>
                            </span>
                        </button>
                    </section>
                    )}

                    {(hasAgentBehaviorForm || hasObstacleBehaviorForm) && (
                    <section className={styles.addMenuSection}>
                        <h4 className={styles.addMenuSectionTitle}>Behaviors</h4>

                        {hasAgentBehaviorForm && (
                        <button
                            type="button"
                            className={styles.listEntry}
                            onClick={() => selectMode(INSPECTOR_MODES.CREATE_AGENT_BEHAVIOR)}
                        >
                            <BrainCircuit className={styles.listEntryIcon} size={19} aria-hidden="true" />
                            <span className={styles.listEntryText}>
                                <span className={styles.listEntryName}>Agent Behavior</span>
                                <span className={styles.listEntryDescription}>
                                    {getFormDescription(INSPECTOR_MODES.CREATE_AGENT_BEHAVIOR)}
                                </span>
                            </span>
                        </button>
                        )}

                        {hasObstacleBehaviorForm && (
                        <button
                            type="button"
                            className={styles.listEntry}
                            onClick={() => selectMode(INSPECTOR_MODES.CREATE_OBSTACLE_BEHAVIOR)}
                        >
                            <Workflow className={styles.listEntryIcon} size={19} aria-hidden="true" />
                            <span className={styles.listEntryText}>
                                <span className={styles.listEntryName}>Obstacle Behavior</span>
                                <span className={styles.listEntryDescription}>
                                    {getFormDescription(INSPECTOR_MODES.CREATE_OBSTACLE_BEHAVIOR)}
                                </span>
                            </span>
                        </button>
                        )}
                    </section>
                    )}

                    {/* Activation belongs to a Behavior. Keep this standalone entry
                        commented out so users do not mistake it for a component.
                    {hasActivationForm && (
                    <section className={styles.addMenuSection}>
                        <h4 className={styles.addMenuSectionTitle}>Activations</h4>

                        <button
                            type="button"
                            className={styles.listEntry}
                            onClick={() => selectMode(INSPECTOR_MODES.CREATE_ACTIVATION)}
                        >
                            <Activity className={styles.listEntryIcon} size={19} aria-hidden="true" />
                            <span className={styles.listEntryText}>
                                <span className={styles.listEntryName}>Configure Activation</span>
                                <span className={styles.listEntryDescription}>
                                    {getFormDescription(INSPECTOR_MODES.CREATE_ACTIVATION)}
                                </span>
                            </span>
                        </button>
                    </section>
                    )}
                    */}
                    </div>
                </div>
            )}
        </div>
    )
}
