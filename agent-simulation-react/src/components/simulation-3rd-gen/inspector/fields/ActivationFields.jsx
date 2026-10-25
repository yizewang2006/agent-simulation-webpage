import {
  ACTIVATION_MEASUREMENT_OPTIONS,
  MEASUREMENT_TYPES,
} from "../../../../utils/constants.js";
import {
  ACTIVATION_TYPES,
  createActivationDraft,
} from "../../../../models/behavior.js";
import FilterFields from "./FilterFields.jsx";
import styles from "../../../../styles/3rd-gen/simulation.module.css";

export default function ActivationFields({
  value,
  onChange,
  entityTypeDefinitions,
  idPrefix = "activation",
}) {
  const draft = createActivationDraft(value);

  function update(updates) {
    onChange({ ...draft, ...updates });
  }

  return (
    <>
      <fieldset className={styles.formSection}>
        <legend className={styles.formSectionTitle}>Activation Graph</legend>
        <ActivationGraph activation={draft} />
      </fieldset>

      <fieldset className={styles.formSection}>
        <legend className={styles.formSectionTitle}>Activation Function</legend>
        <div className={styles.formRadioGroup}>
          {[
            [ACTIVATION_TYPES.BINARY, "Binary"],
            [ACTIVATION_TYPES.LINEAR, "Linear"],
            [ACTIVATION_TYPES.ALWAYS_ACTIVE, "Always active"],
          ].map(([type, label]) => (
            <label className={styles.formRadioOption} key={type}>
              <input
                type="radio"
                name={`${idPrefix}-type`}
                value={type}
                checked={draft.type === type}
                onChange={() => update({ type })}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Create a field based on the selected AF type. */}
      {draft.type === ACTIVATION_TYPES.ALWAYS_ACTIVE ? (
        <AlwaysActiveFields draft={draft} update={update} idPrefix={idPrefix} />
      ) : (
        <VariableActivationFields draft={draft} update={update} idPrefix={idPrefix} />
      )}

      {/* For Filters */}
      {draft.type === ACTIVATION_TYPES.ALWAYS_ACTIVE ? (
        <fieldset className={styles.formSection}>
          <legend className={styles.formSectionTitle}>
            <span className={styles.activationFilterTitle}>Activation</span>{" "}
            Filters
          </legend>
          <p className={styles.formHelperText}>
            Filters are not available for this type of Activation Function. Try 'Binary' or 'Linear' instead.
          </p>
        </fieldset>
      ) : (
        <FilterFields
          filterKind="Activation"
          filters={draft.filters}
          entityTypeDefinitions={entityTypeDefinitions}
          // Only this Activation draft receives these filter changes.
          onChange={(filters) => update({ filters })}
          idPrefix={`${idPrefix}-activation`}
          emptyDescription="Without filters, this activation checks all entities currently in view."
        />
      )}
    </>
  );
}

function VariableActivationFields({ draft, update, idPrefix }) {
  const isBinary = draft.type === ACTIVATION_TYPES.BINARY;
  const valueOptions = ACTIVATION_MEASUREMENT_OPTIONS[draft.checkSource];
  const angularRangeMaximum = draft.valueToCheck === MEASUREMENT_TYPES.HEADING
    ? 360
    : [
        MEASUREMENT_TYPES.HEADING_DIFFERENCE,
        MEASUREMENT_TYPES.ANGLE_TO_ENTITY,
      ].includes(draft.valueToCheck) ? 180 : undefined;

  function changeSource(checkSource) {
    const nextOptions = ACTIVATION_MEASUREMENT_OPTIONS[checkSource];
    const optionValues = nextOptions.map(([value]) => value);
    const valueToCheck = optionValues.includes(draft.valueToCheck)
      ? draft.valueToCheck
      : optionValues[0];

    update({ checkSource, valueToCheck });
  }

  return (
    <fieldset className={styles.formSection}>
      <legend className={styles.formSectionTitle}>
        {isBinary ? "Binary" : "Linear"} Settings
      </legend>

      <div className={styles.inputGroup}> {/* If self, don't render the next box*/}
        <label className={styles.formLabel} htmlFor={`${idPrefix}-source`}>
          Value Source
        </label>
        <select
          id={`${idPrefix}-source`}
          className={`${styles.formInput} ${styles.formSelect}`}
          value={draft.checkSource}
          onChange={(event) => changeSource(event.target.value)}
        >
          <option value="neighbor">Neighbor Reference</option>
          <option value="self">Self Reference</option>
        </select>
      </div>

      {/* The Value Source determines which measurements are meaningful. */}
      <div className={styles.inputGroup}>
        <label className={styles.formLabel} htmlFor={`${idPrefix}-property`}>
          Value to Check
        </label>
        <select
          id={`${idPrefix}-property`}
          className={`${styles.formInput} ${styles.formSelect}`}
          value={draft.valueToCheck}
          onChange={(event) => update({ valueToCheck: Number(event.target.value) })}
        >
          {valueOptions.map(([value, label]) => (
            <option value={value} key={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className={styles.formFieldRow}>
        {["lowerRange", "upperRange"].map((field) => (
          <div className={styles.inputGroup} key={field}>
            <label className={styles.formLabel} htmlFor={`${idPrefix}-${field}`}>
              {field === "lowerRange" ? "Lower Range" : "Upper Range"}
            </label>
            <input
              id={`${idPrefix}-${field}`}
              className={styles.formInput}
              type="number"
              step="any"
              min={angularRangeMaximum === undefined ? undefined : 0}
              max={angularRangeMaximum}
              value={draft[field]}
              onChange={(event) => update({ [field]: event.target.value })}
            />
          </div>
        ))}
      </div>

      {isBinary ? (
        <>
          <NumberField id={`${idPrefix}-weight`} label="Weight" value={draft.weight} onChange={(weight) => update({ weight })} min="0" />
          <BooleanField label="Inside" checked={draft.inside} onChange={(inside) => update({ inside })} />
        </>
      ) : (
        <>
          <NumberField id={`${idPrefix}-slope`} label="Slope" value={draft.slope} onChange={(slope) => update({ slope })} min="0" />
          <BooleanField label="Increase" checked={draft.increase} onChange={(increase) => update({ increase })} />
        </>
      )}

      <div className={styles.activationToggleField}>
        <div>
          <span className={styles.formLabel}>No-Entity Activation</span>
          <p className={styles.formHelperText}>
            Use a specified weight when no entities qualify.
          </p>
        </div>
        {/* A switch is a checkbox with clearer two-state styling. */}
        <label className={styles.formSwitch}>
          <input
            type="checkbox"
            role="switch"
            aria-label="Enable No-Entity Activation"
            aria-checked={draft.nullActivation}
            checked={draft.nullActivation}
            onChange={(event) =>
              update({ nullActivation: event.target.checked })
            }
          />
          <span aria-hidden="true" />
        </label>
      </div>

      {draft.nullActivation && (
        <NumberField
          id={`${idPrefix}-fallback-weight`}
          label="No-Entity Weight"
          value={draft.fallbackWeight}
          onChange={(fallbackWeight) => update({ fallbackWeight })}
          min="0"
        />
      )}
    </fieldset>
  );
}

function AlwaysActiveFields({ draft, update, idPrefix }) {
  return (
    <fieldset className={styles.formSection}>
      <legend className={styles.formSectionTitle}>Always Active Settings</legend>
      <NumberField id={`${idPrefix}-weight`} label="Weight" value={draft.weight} onChange={(weight) => update({ weight })} min="0" />
    </fieldset>
  );
}

function NumberField({ id, label, value, onChange, min }) {
  return (
    <div className={styles.inputGroup}>
      <label className={styles.formLabel} htmlFor={id}>{label}</label>
      <input id={id} className={styles.formInput} type="number" min={min} step="any" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function BooleanField({ label, checked, onChange }) {
  return (
    <label className={styles.formCheckbox}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}
// Creates the SVG of AF
function ActivationGraph({ activation }) {
  const xStart = 34, xLower = 104, xUpper = 222, xEnd = 292;
  const yZero = 112, yWeight = 40;
  const lower = Number(activation.lowerRange);
  const upper = Number(activation.upperRange);
  const slope = Number(activation.slope);
  const effectiveSlope = Number.isFinite(slope) && upper > lower ? Math.max(0, slope) : 0;
  const yLinear = yZero - 72 * (effectiveSlope / (effectiveSlope + 1));

  let points;
  if (activation.type === ACTIVATION_TYPES.BINARY) {
    points = activation.inside
      ? `${xStart},${yZero} ${xLower},${yZero} ${xLower},${yWeight} ${xUpper},${yWeight} ${xUpper},${yZero} ${xEnd},${yZero}`
      : `${xStart},${yWeight} ${xLower},${yWeight} ${xLower},${yZero} ${xUpper},${yZero} ${xUpper},${yWeight} ${xEnd},${yWeight}`;
  } else if (activation.type === ACTIVATION_TYPES.LINEAR) {
    points = activation.increase
      ? `${xStart},${yZero} ${xLower},${yZero} ${xUpper},${yLinear} ${xEnd},${yLinear}`
      : `${xStart},${yLinear} ${xLower},${yLinear} ${xUpper},${yZero} ${xEnd},${yZero}`;
  } else {
    points = `${xStart},${yWeight} ${xEnd},${yWeight}`;
  }

  const maximumWeight = activation.type === ACTIVATION_TYPES.LINEAR
    ? Math.max(0, (Number(activation.slope) || 0) * ((Number(activation.upperRange) || 0) - (Number(activation.lowerRange) || 0)))
    : Number(activation.weight) || 0;

  return (
    <div className={styles.activationGraph}>
      <svg viewBox="0 0 310 140" role="img" aria-label={`${activation.type} activation preview`}>
        <line className={styles.activationGraphAxis} x1="24" y1="112" x2="292" y2="112" />
        <line className={styles.activationGraphAxis} x1="24" y1="18" x2="24" y2="112" />
        <polyline className={styles.activationGraphLine} points={points} fill="none" />

        {activation.type !== ACTIVATION_TYPES.ALWAYS_ACTIVE && (
          <>
            <line className={styles.activationGraphTick} x1={xLower} y1={yZero - 6} x2={xLower} y2={yZero + 6} />
            <line className={styles.activationGraphTick} x1={xUpper} y1={yZero - 6} x2={xUpper} y2={yZero + 6} />
            <text className={styles.activationGraphValueLabel} x={xLower} y="132" textAnchor="middle">Lower: {activation.lowerRange}</text>
            <text className={styles.activationGraphValueLabel} x={xUpper} y="132" textAnchor="middle">Upper: {activation.upperRange}</text>
          </>
        )}

        <text className={styles.activationGraphValueLabel} x="29" y={yWeight + 3} textAnchor="end">{Math.round(maximumWeight * 100) / 100}</text>
        <text className={styles.activationGraphLabel} x="7" y="12">Weight</text>
        <text className={styles.activationGraphLabel} x="272" y="102">Value</text>
      </svg>
    </div>
  );
}
