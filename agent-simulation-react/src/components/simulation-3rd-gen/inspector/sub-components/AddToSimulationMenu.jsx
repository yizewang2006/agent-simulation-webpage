import { useId, useState } from 'react';
import {
    Activity,
    BrainCircuit,
    ChevronDown,
    CirclePlus,
    ListPlus,
    Shapes,
    UserPlus,
} from 'lucide-react'

import { INSPECTOR_MODES } from '../inspectorModes';
import styles from "../../../../styles/3rd-gen/simulation.module.css";

export default function AddToSimulationMenu( {onSelectMode} ) {
    const [isExpanded, setIsExpanded] = useState(false);
    const menuId = useId();

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
                    Add to Simulation
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

                        <button
                            type="button"
                            className={styles.listEntry}
                            onClick={() => selectMode(INSPECTOR_MODES.ADD_AGENT)}
                        >
                            <UserPlus className={styles.listEntryIcon} size={19} aria-hidden="true" />
                            <span className={styles.listEntryText}>
                                <span className={styles.listEntryName}>Agent</span>
                                <span className={styles.listEntryDescription}>
                                    Create one or more simulation agents
                                </span>
                            </span>
                        </button>
                        <button
                            type="button"
                            className={styles.listEntry}
                            onClick={() => selectMode(INSPECTOR_MODES.ADD_OBSTACLE)}
                        >
                            <Shapes className={styles.listEntryIcon} size={19} aria-hidden="true" />
                            <span className={styles.listEntryText}>
                                <span className={styles.listEntryName}>Obstacle</span>
                                <span className={styles.listEntryDescription}>
                                    Add a circle or polygon obstacle
                                </span>
                            </span>
                        </button>
                    </section>

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
                                    Define what agents do
                                </span>
                            </span>
                        </button>
                    </section>

                    <section className={styles.addMenuSection}>
                        <h4 className={styles.addMenuSectionTitle}>Activations</h4>

                        <button
                            type="button"
                            className={styles.listEntry}
                            onClick={() => selectMode(INSPECTOR_MODES.CREATE_ACTIVATION)}
                        >
                            <Activity className={styles.listEntryIcon} size={19} aria-hidden="true" />
                            <span className={styles.listEntryText}>
                                <span className={styles.listEntryName}>Activation</span>
                                <span className={styles.listEntryDescription}>
                                    Define how weights are distributed across behaviors. This is behavior-specific.
                                </span>
                            </span>
                        </button>
                    </section>

                    <section className={styles.addMenuSection}>
                        <h4 className={styles.addMenuSectionTitle}>Properties</h4>

                        <button
                            type="button"
                            className={styles.listEntry}
                            disabled
                        >
                            <ListPlus className={styles.listEntryIcon} size={19} aria-hidden="true" />
                            <span className={styles.listEntryText}>
                                <span className={styles.listEntryNameRow}>
                                    <span className={styles.listEntryName}>Custom Property</span>
                                    <span className={styles.listEntryBadge}>Coming Soon</span>
                                </span>
                                <span className={styles.listEntryDescription}>
                                    Create custom data at the simulation level
                                </span>
                            </span>
                        </button>
                    </section>
                    </div>
                </div>
            )}
        </div>
    )
}
