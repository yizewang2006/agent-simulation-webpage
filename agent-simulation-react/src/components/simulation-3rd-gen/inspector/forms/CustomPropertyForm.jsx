import { useState } from "react";
import styles from "../../../../styles/3rd-gen/simulation.module.css";
import { FORM_MODES } from "../formRegistry";
import { PROPERTY_TYPE } from "../../../../models/properties.js";
import { ENTITY_TYPES, SHAPE_TYPES } from "../../../../utils/constants.js";
import TargetEntitySelector from "../sub-components/TargetEntitySelector.jsx";
import { Check, CopyPlus, X } from "lucide-react";

export const CUSTOM_PROPERTY_FORM_DESCRIPTION = "Add a property of your own."

export default function CustomPropertyForm({
    mode,
    initialValues,
    entityTypeDefinitions,
    onSubmit,
    onCancel,
}) {
    const defaultAssignments = Object.fromEntries(
        entityTypeDefinitions.map(({ id }) => [id, id === ENTITY_TYPES.AGENT])
    );
    defaultAssignments[ENTITY_TYPES.OBSTACLE] = {
        enabled: true,
        [SHAPE_TYPES.CIRCLE]: true,
        [SHAPE_TYPES.POLYGON]: true,
    };

    const [propertyDraft, setPropertyDraft] = useState(initialValues ?? {
        name: "",
        type: PROPERTY_TYPE.NUMERICAL,
        lower: "",
        upper: "",
        vinit: "",
        assignments: defaultAssignments,
    })

    const [formError, setFormError] = useState("");
    const isEditing = mode === FORM_MODES.EDIT;

    function submitForm(event) {
        event.preventDefault();
        setFormError("");

        const result = onSubmit(propertyDraft);

        if (result?.ok === false) {
            setFormError(result.error);
        }
    }

    return (
        <div className={styles.inspectorFormViewport}>
            <form
                className={styles.inspectorForm}
                onSubmit={submitForm}
            >
                <div className={styles.formIntroduction}>
                    <h3 className={styles.formTitle}>
                        {isEditing ? "Edit Custom Property" : "Create a Custom Property"}
                    </h3>
                    <p className={styles.formDescription}>
                        {isEditing
                            ? "Update this property's name and numerical values."
                            : "Define a property that entities can use during the simulation. Currently, only numerical property is available."}
                    </p>
                </div>

                <fieldset className={styles.formSection}>
                    <legend className={styles.formSectionTitle}>
                        Property Basics
                    </legend>

                    <div className={styles.inputGroup}>
                        <label className={styles.formLabel} htmlFor="property-name">
                            Property Name
                        </label>
                        <input
                            id="property-name"
                            className={styles.formInput}
                            type="text"
                            placeholder="e.g. Energy"
                            value={propertyDraft.name}
                            onChange={(event) => setPropertyDraft({
                                ...propertyDraft,
                                name: event.target.value,
                            })}
                        />
                    </div>

                    {mode === FORM_MODES.CREATE &&
                    <div className={styles.inputGroup}>
                        <span className={styles.formLabel} id="property-type-label">
                            Property Type
                        </span>
                        {/* Categorical will be enabled after numerical properties work end to end. */}
                        <div
                            className={styles.formRadioGroup}
                            role="radiogroup"
                            aria-labelledby="property-type-label"
                            onChange={(event) => setPropertyDraft({
                                ...propertyDraft,
                                type: event.target.value,
                            })}
                        >
                            <label className={styles.formRadioOption}>
                                <input
                                    type="radio"
                                    name="property-type"
                                    value={PROPERTY_TYPE.NUMERICAL}
                                    defaultChecked
                                />
                                Numerical
                            </label>

                            <label className={styles.formRadioOption}>
                                <input
                                    type="radio"
                                    name="property-type"
                                    value={PROPERTY_TYPE.CATEGORICAL}
                                    disabled
                                />
                                Categorical (Coming Soon)
                            </label>
                        </div>
                    </div>
                    }

                </fieldset>

                <fieldset className={styles.formSection}>
                    <legend className={styles.formSectionTitle}>
                        Numerical Values
                    </legend>

                    <div className={styles.formFieldRow}>
                        <div className={styles.inputGroup}>
                            <label className={styles.formLabel} htmlFor="property-lower">
                                Minimum
                            </label>
                            <input
                                id="property-lower"
                                className={styles.formInput}
                                type="number"
                                value={propertyDraft.lower}
                                onChange={(event) => setPropertyDraft({
                                    ...propertyDraft,
                                    lower: event.target.value,
                                })}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.formLabel} htmlFor="property-upper">
                                Maximum
                            </label>
                            <input
                                id="property-upper"
                                className={styles.formInput}
                                type="number"
                                value={propertyDraft.upper}
                                onChange={(event) => setPropertyDraft({
                                    ...propertyDraft,
                                    upper: event.target.value,
                                })}
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.formLabel} htmlFor="property-vinit">
                            Initial Value (optional)
                        </label>
                        <input
                            id="property-vinit"
                            className={styles.formInput}
                            type="number"
                            value={propertyDraft.vinit}
                            onChange={(event) => setPropertyDraft({
                                ...propertyDraft,
                                vinit: event.target.value,
                            })}
                        />
                        <p className={styles.formHelperText}>
                            Leave empty to generate a random initial value.
                        </p>
                    </div>
                </fieldset>

                <fieldset className={styles.formSection}>
                    <legend className={styles.formSectionTitle}>
                        Property Logistics
                    </legend>

                    <div className={styles.inputGroup}>
                        <span className={styles.formLabel}>
                            Entity Assignment
                        </span>
                        <p className={styles.formHelperText}>
                            Please indicate which entity types will have this property.
                        </p>
                        <TargetEntitySelector
                            idPrefix="property-assignment"
                            entityTypeDefinitions={entityTypeDefinitions}
                            value={propertyDraft.assignments}
                            onChange={(assignments) => setPropertyDraft({
                                ...propertyDraft,
                                assignments,
                            })}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.formLabel} htmlFor="behavior-group">
                            Behavior Group
                        </label>
                        <p className={styles.formHelperText}>
                            Please select a behavior group.
                        </p>
                        <select className={`${styles.formInput} ${styles.formSelect}`}>
                            <option>Placeholder 1</option>
                        </select>
                    </div>
                </fieldset>

                {formError && (
                    <p className={styles.formError} role="alert">
                        {formError}
                    </p>
                )}

                <div className={styles.formActions}>
                    <button
                        className={`${styles.primaryAction} ${styles.formActionButton}`}
                        type="submit"
                    >
                        {isEditing
                            ? <Check size={16} aria-hidden="true" />
                            : <CopyPlus size={16} aria-hidden="true" />}
                        {isEditing ? "Apply Changes" : "Create Property"}
                    </button>
                    <button
                        className={`${styles.secondaryAction} ${styles.formActionButton}`}
                        type="button"
                        onClick={onCancel}
                    >
                        <X size={16} aria-hidden="true" />
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}
