import { useId, useState } from 'react';
import {
    // Activity, // Standalone Activation menu entry is intentionally hidden.
    BrainCircuit,
    ChevronDown,
    CirclePlus,
    Flag,
    LogOut,
    Shapes,
    UserPlus,
} from 'lucide-react'

import { INSPECTOR_MODES } from '../modeConstants';
import {
    ENTITY_CREATE_MODES,
    hasFormComponent,
} from '../formRegistry.js';
import { ENTITY_LABELS, ENTITY_TYPES } from '../../../../utils/constants.js';
import styles from "../../../../styles/3rd-gen/simulation.module.css";

const ENTITY_MENU_DETAILS = Object.freeze({
    [ENTITY_TYPES.AGENT]: {
        Icon: UserPlus,
        description: 'Create one or more simulation agents.',
    },
    [ENTITY_TYPES.OBSTACLE]: {
        Icon: Shapes,
        description: 'Add a circle or polygon obstacle.',
    },
    [ENTITY_TYPES.LEADER]: {
        Icon: Flag,
        description: 'Add a designated simulation leader.',
    },
    [ENTITY_TYPES.EXIT]: {
        Icon: LogOut,
        description: 'Add an exit or escape point.',
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
        (entityType) => hasFormComponent(ENTITY_CREATE_MODES[entityType])
    );
    const hasBehaviorForm = showBehaviors
        && hasFormComponent(INSPECTOR_MODES.CREATE_BEHAVIOR);
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
                        {availableEntityTypes.map((entityType) => {
                            const createMode = ENTITY_CREATE_MODES[entityType];
                            const details = ENTITY_MENU_DETAILS[entityType] ?? {};
                            const EntityIcon = details.Icon ?? Shapes;

                            return (
                                <button
                                    key={entityType}
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
                                            {ENTITY_LABELS[entityType] ?? `Entity ${entityType}`}
                                        </span>
                                        <span className={styles.listEntryDescription}>
                                            {details.description}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </section>

                    {hasBehaviorForm && (
                    <section className={styles.addMenuSection}>
                        <h4 className={styles.addMenuSectionTitle}>Behaviors</h4>

                        <button
                            type="button"
                            className={styles.listEntry}
                            onClick={() => selectMode(INSPECTOR_MODES.CREATE_BEHAVIOR)}
                        >
                            <BrainCircuit className={styles.listEntryIcon} size={19} aria-hidden="true" />
                            <span className={styles.listEntryText}>
                                <span className={styles.listEntryName}>Behavior</span>
                                <span className={styles.listEntryDescription}>
                                    Create a definition of how agents respond to other entities.
                                </span>
                            </span>
                        </button>
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
                                    Configure how a behavior calculates its weight. Each behavior must have one and only one activation function.
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
