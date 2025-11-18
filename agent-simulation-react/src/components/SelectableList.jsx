import { useState } from "react";
import './selectableList.css';

export default function SelectableList({ items, onSelect }) {
    const [value, setValue] = useState("");

  function handleChange(e) {
    const newValue = e.target.value;
    setValue(newValue);
    onSelect && onSelect(newValue);   // callback to parent
  }

  return (
    <select value={value} onChange={handleChange} className="selectable-list">
      <option value="">-- Select --</option>

      {items.map((item, index) => (
        <option key={index} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}