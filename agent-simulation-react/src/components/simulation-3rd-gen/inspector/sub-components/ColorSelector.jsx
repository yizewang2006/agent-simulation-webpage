import { useState, useSyncExternalStore } from "react";
import styles from "../../../../styles/3rd-gen/simulation.module.css";
import {
  getRegisteredColors,
  subscribeToColorRegistry,
} from "../colorRegistry.js";

const CUSTOM_OPTION = "custom";

export default function ColorSelector({ id, value, onChange }) {
  const colors = useSyncExternalStore(
    subscribeToColorRegistry,
    getRegisteredColors
  );
  const normalizedValue = value.toUpperCase();
  const valueIsRegistered = colors.some(
    (option) => option.value === normalizedValue
  );
  const [isCustom, setIsCustom] = useState(!valueIsRegistered);

  function selectColor(event) {
    const selectedValue = event.target.value;

    if (selectedValue === CUSTOM_OPTION) {
      setIsCustom(true);
      return;
    }

    setIsCustom(false);
    onChange(selectedValue);
  }

  return (
    <div className={styles.colorSelector}>
      <select
        id={id}
        className={`${styles.formInput} ${styles.formSelect}`}
        value={isCustom ? CUSTOM_OPTION : normalizedValue}
        onChange={selectColor}
      >
        {colors.map((option) => (
          <option key={option.value} value={option.value}>
            {option.name === option.value
              ? option.value
              : `${option.name} (${option.value})`}
          </option>
        ))}
        <option value={CUSTOM_OPTION}>Custom</option>
      </select>

      {isCustom && (
        <div className={styles.formColorControl}>
          <input
            className={styles.formColorInput}
            type="color"
            value={value}
            aria-label="Custom color"
            onChange={(event) => onChange(event.target.value)}
          />
          <span className={styles.formColorValue}>
            {normalizedValue}
          </span>
        </div>
      )}
    </div>
  );
}
