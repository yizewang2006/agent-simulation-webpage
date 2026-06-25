import { useRef } from 'react';
import {
  TARGET_PROPERTIES,
  METHOD_LABELS,
  PROPERTY_LABELS,
  METHOD_LABELS_BY_PROPERTY,
  FILTER_LABELS,
  REFERENCE_LABELS,
} from "../js_files/behavior.js";

function getBehaviorGroups(behaviors) {
  return Object.entries(PROPERTY_LABELS).map(([targetProperty, label]) => {
    const numericTargetProperty = Number(targetProperty);
    const groupBehaviors = behaviors
      .map((behavior, behaviorIndex) => ({ behavior, behaviorIndex }))
      .filter(({ behavior }) => behavior.targetProperty === numericTargetProperty);

    return {
      targetProperty: numericTargetProperty,
      label,
      behaviors: groupBehaviors,
    };
  });
}

function BehaviorCard({
  behaviorList,
  collapsedBehaviorIds,
  onAddBehavior,
  onUpdateBehavior,
  onDeleteBehavior,
  onLoadBehaviorPreset,
  onToggleBehaviorCollapsed,
  onAddFilter,
  onUpdateFilter,
  onDeleteFilter,
}) {
  const presetInputRef = useRef(null);

  function openPresetFilePicker() {
    // Open the hidden file input when the visible preset button is clicked.
    presetInputRef.current?.click();
  }

  async function handlePresetFileChange(e) {
    // Get the first file selected by the user.
    const selectedFile = e.target.files?.[0];

    // If the user closes the file picker without choosing a file, do nothing.
    if (!selectedFile) return;

    try {
      const presetData = await readPresetJsonFile(selectedFile);

      // Send parsed JSON data to Simulation.jsx, where it becomes real behaviors.
      onLoadBehaviorPreset(presetData);
    } catch (error) {
      window.alert(`Unable to load behavior preset: ${error.message}`);
    } finally {
      e.target.value = '';
    }
  }

  async function readPresetJsonFile(file) {
    // Read the selected file as plain text.
    const fileText = await file.text();

    // Convert the text into a JavaScript object/array.
    return JSON.parse(fileText);
  }

  return (
    /* Behavior & Filter Settings*/
    <div className="panel-card">
      <h2 className="panel-section-title">Behavior & Filter Settings</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 8, borderBottom: '1px solid #e0e0e0' }}>
        <button className="btn-primary" onClick={onAddBehavior} style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+ Add Behavior</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #d0d0d0' }} />
          <span style={{ color: '#888', fontSize: 11, fontWeight: 600 }}>OR</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #d0d0d0' }} />
        </div>

        <input
          ref={presetInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handlePresetFileChange}
          style={{ display: 'none' }}
        />
        <button
          className="btn-primary"
          onClick={openPresetFilePicker}
          style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          + Load Behavior Preset
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2 }}>
        {getBehaviorGroups(behaviorList).map((group) => (
          <div key={group.targetProperty} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h3 className="panel-section-title" style={{ margin: '0', fontSize: 14 }}>
              {group.label} Behaviors ({group.behaviors.length})
            </h3>

            {group.behaviors.length === 0 && (
              <p style={{ margin: '0 0 2px 0', color: '#888', fontSize: 12 }}>
                No {group.label.toLowerCase()} behaviors yet.
              </p>
            )}

            {group.behaviors.map(({ behavior, behaviorIndex }) => {
              const isCollapsed = collapsedBehaviorIds.has(behavior.id);

              return (
                <div key={behavior.id} className="panel-card panel-card-highlight" style={{ position: 'relative', marginBottom: 2, padding: '10px 12px' }}>
                  <button
                    className="btn-danger"
                    onClick={() => onDeleteBehavior(behavior.id)}
                    aria-label="Delete behavior"
                    style={{ position: 'absolute', top: 6, right: 8, width: 62, height: 26, padding: 0, fontSize: 12 }}
                  >Delete</button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 72 }}>
                    <button
                      className="btn-secondary"
                      onClick={() => onToggleBehaviorCollapsed(behavior.id)}
                      aria-expanded={!isCollapsed}
                      aria-label={isCollapsed ? 'Expand behavior' : 'Collapse behavior'}
                      style={{ width: 30, height: 26, padding: 0, flex: '0 0 auto' }}
                    >
                      {isCollapsed ? '▼' : '▲'}
                    </button>
                    <h2 className="panel-section-title" style={{ flex: 1, margin: 0 }}>{behavior.name}</h2>
                    <span style={{ color: '#888', fontSize: 12 }}>
                      {PROPERTY_LABELS[behavior.targetProperty]} | {behavior.filters.length} {behavior.filters.length === 1 ? 'filter' : 'filters'}
                    </span>
                  </div>

                  {!isCollapsed && (
                    <>
                      {/* Names */}
                      <div className="input-group">
                        <label>Behavior Name</label>
                        <input
                          type="text"
                          placeholder={`Behavior ${behaviorIndex + 1}`}
                          value={behavior.name}
                          onChange={(e) => onUpdateBehavior(behavior.id, { name: e.target.value })}
                        />
                      </div>

                      <div className="input-group">
                        <label>Option</label>
                        <select
                          value={behavior.action}
                          onChange={(e) => onUpdateBehavior(behavior.id, { action: Number(e.target.value) })}
                        >
                          {Object.entries(REFERENCE_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Target Property Dropdown*/}
                      <div className="input-group">
                        <label>Target Property</label>
                        <select
                          value={behavior.targetProperty}
                          onChange={(e) => onUpdateBehavior(behavior.id, { targetProperty: Number(e.target.value) })}
                        >
                          {Object.entries(PROPERTY_LABELS).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Position: Relative Angle*/}
                      <div className="input-group">
                        <label>Offset {(behavior.targetProperty === TARGET_PROPERTIES.ANGLE || behavior.targetProperty === TARGET_PROPERTIES.POSITION) ? '(degrees)' : ''}</label> {/* Bearing and Angle both use degree offsets */}
                        <input
                          type="number"
                          value={behavior.offset}
                          onChange={(e) => onUpdateBehavior(behavior.id, { offset: e.target.value })}
                        />
                      </div>

                      {/* Filters sub-box */}
                      <div className="panel-card" style={{ marginTop: 6, padding: '10px 12px' }}>
                        <h3 className="panel-section-title" style={{ margin: '0 0 4px 0', fontSize: 14 }}>Filters</h3>

                        {behavior.filters.map((filter) => (
                          <div key={filter.id} className="panel-card panel-card-highlight" style={{ position: 'relative', marginBottom: 4, padding: '10px 12px' }}>
                            <button
                              className="btn-secondary"
                              onClick={() => onDeleteFilter(behavior.id, filter.id)}
                              aria-label="Remove filter"
                              style={{ position: 'absolute', top: 6, right: 8, width: 66, height: 26, padding: 0, fontSize: 12 }}
                            >Remove</button>

                            <div className="input-group">
                              <label>Type</label>
                              <div className="radio-group">
                                {['method', 'ranged'].map(t => ( // method, ranged
                                  <label key={t} className="radio-option">
                                    <input
                                      type="radio"
                                      name={`filter-type-${behavior.id}-${filter.id}`}
                                      value={t}
                                      checked={filter.filterType === t}
                                      onChange={() => onUpdateFilter(behavior.id, filter.id, { filterType: t })}
                                    />
                                    {' '}{t.charAt(0).toUpperCase() + t.slice(1)}
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="input-group">
                              <label>Property</label>
                              <select value={filter.propertyType} onChange={(e) => onUpdateFilter(behavior.id, filter.id, { propertyType: Number(e.target.value) })}>
                                {Object.entries(FILTER_LABELS).map(([val, label]) => (
                                  <option key={val} value={val}>{label}</option>
                                ))}
                              </select>
                            </div>

                            {filter.filterType === 'method' && (
                              <div className="input-group">
                                <label>Method</label>
                                <select value={filter.methodType} onChange={(e) => onUpdateFilter(behavior.id, filter.id, { methodType: Number(e.target.value) })}>
                                  {Object.entries(METHOD_LABELS_BY_PROPERTY[filter.propertyType] ?? METHOD_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {filter.filterType === 'ranged' && (
                              <div className="input-row">
                                <div className="input-group">
                                  <label>Low</label>
                                  <input type="number" value={filter.rangeLow} onChange={(e) => onUpdateFilter(behavior.id, filter.id, { rangeLow: e.target.value })} />
                                </div>
                                <div className="input-group">
                                  <label>High</label>
                                  <input type="number" value={filter.rangeHigh} onChange={(e) => onUpdateFilter(behavior.id, filter.id, { rangeHigh: e.target.value })} />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        <button className="btn-secondary" onClick={() => onAddFilter(behavior.id)}>+ Add Filter</button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default BehaviorCard;
