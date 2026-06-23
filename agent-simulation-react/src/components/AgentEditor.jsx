import { useState, useEffect, useRef } from 'react';

export default function AgentEditor({ selectedAgent, onApply, onDeselect }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000');
  const [showFOV, setShowFOV] = useState(false);
  const [fovAngle, setFovAngle] = useState('150');
  const cardRef = useRef(null);

  useEffect(() => {
    if (selectedAgent) {
      setName(selectedAgent.id);
      setColor(selectedAgent.colorHex);
      setShowFOV(selectedAgent.showFOV);
      setFovAngle(String(Math.round(selectedAgent.fovAngle * 180 / Math.PI)));
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedAgent]);

  function apply() {
    onApply({ name, color, showFOV, fovAngle });
  }

  return (
    <div ref={cardRef} className="panel-card">
      <h2 className="panel-section-title">Agent Editor</h2>
      {!selectedAgent && (
        <p style={{ fontSize: '0.85em', color: '#888' }}>Click an agent on the canvas to select it.</p>
      )}
      {selectedAgent && (
        <>
          <div className="input-group">
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Color</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="input-group">
            <label>
              <input type="checkbox" checked={showFOV} onChange={(e) => setShowFOV(e.target.checked)} />
              {' '}Show FOV
            </label>
          </div>
          <div className="input-group">
            <label>FOV Angle (deg)</label>
            <input type="number" min="0" max="360" value={fovAngle} onChange={(e) => setFovAngle(e.target.value)} />
          </div>
          <div className="btn-row">
            <button className="btn-primary" onClick={apply}>Apply</button>
            <button className="btn-secondary" onClick={onDeselect}>Deselect</button>
          </div>
        </>
      )}
    </div>
  );
}
