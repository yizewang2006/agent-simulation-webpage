import { useState, useEffect, useRef } from "react";
import { Agent } from "../js_files/agent.js";
import { CircleX, SquarePlus } from "lucide-react";

// State variables
export default function AddAgentCard({ canvasRef, ctxRef, agentsArrayRef, canvasWidth, canvasHeight, maxAgents, onAgentAdded, onClose }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000');
  const [x, setX] = useState(String(canvasWidth / 2));
  const [y, setY] = useState(String(canvasHeight / 2));
  const [fovAngle, setFovAngle] = useState('150');
  const [angle, setAngle] = useState('0');
  const [showFOV, setShowFOV] = useState(true);
  const [limitWarning, setLimitWarning] = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  function create() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const roster = agentsArrayRef.current;
    if (!canvas || !ctx) return;
    if (roster.length >= maxAgents) {
        setLimitWarning(`Agent limit reached! Maximum ${maxAgents} agents allowed.`);
        return;
    }

    // set warning empty
    setLimitWarning('');

    const fovAngleRad = parseNumberOrDefault(fovAngle, 150) * Math.PI / 180;
    const angleRad = -parseNumberOrDefault(angle, 0) * Math.PI / 180;
    const randomSpeed = Math.random() * 2 + 0.5;

    new Agent(
      true,
      parseNumberOrDefault(x, canvasWidth / 2),
      parseNumberOrDefault(y, canvasHeight / 2),
      5,
      Math.cos(angleRad) * randomSpeed,
      Math.sin(angleRad) * randomSpeed,
      color,
      100,
      fovAngleRad,
      angleRad,
      name || `Agent_${roster.length + 1}`,
      ctx, canvas, roster
    );

    roster[roster.length - 1].showFOV = showFOV;
    onAgentAdded([...roster]);
    onClose();
  }

  function parseNumberOrDefault(value, fallback) {
    if (value === '' || value === null || value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function cancel() {
    onClose();
  }

  // HTML component
  return (
    <div ref={cardRef} className="panel-card panel-card-highlight" style={{ position: 'relative' }}>
      <button
        className="btn-secondary icon-only-button"
        onClick={cancel}
        aria-label="Close"
        title="Close"
        style={{ position: 'absolute', top: 8, right: 10, width: 28, height: 28, padding: 0 }}
      >
        <CircleX size={16} aria-hidden="true" />
      </button>
      <h2 className="panel-section-title">Create Agent</h2>

      <div className="input-group">
        <label>Name</label>
        <input type="text" placeholder="e.g. Agent_01" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="input-group">
        <label>
          <input type="checkbox" checked={showFOV} onChange={(e) => setShowFOV(e.target.checked)} />
          {' '}Show FOV
        </label>
      </div>

      <div className="input-group">
        <label>Color</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
      </div>

      <div className="input-row">
        <div className="input-group">
          <label>X Position</label>
          <input type="number" min="0" max={canvasWidth} value={x} onChange={(e) => setX(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Y Position</label>
          <input type="number" min="0" max={canvasHeight} value={y} onChange={(e) => setY(e.target.value)} />
        </div>
      </div>

      <div className="input-row">
        <div className="input-group">
          <label>FOV Angle (deg)</label>
          <input type="number" min="0" max="360" value={fovAngle} onChange={(e) => setFovAngle(e.target.value)} />
        </div>
        <div className="input-group">
          <label>Initial Angle (deg)</label>
          <input type="number" min="0" max="360" value={angle} onChange={(e) => setAngle(e.target.value)} />
        </div>
      </div>

      {limitWarning && <span style={{ color: 'red', fontSize: '0.85em' }}>{limitWarning}</span>}

      <div className="btn-row">
        <button className="btn-primary icon-button" onClick={create}>
          <SquarePlus className="button-icon" size={16} aria-hidden="true" />
          Create
        </button>
        <button className="btn-secondary icon-button" onClick={cancel}>
          <CircleX className="button-icon" size={16} aria-hidden="true" />
          Cancel
        </button>
      </div>
    </div>
  );
}
