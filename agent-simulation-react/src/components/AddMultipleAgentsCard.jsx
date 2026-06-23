import { useState, useEffect, useRef } from 'react';
import { Agent } from '../js_files/agent.js';

export default function AddMultipleAgentsCard({ canvasRef, ctxRef, agentsArrayRef, canvasWidth, canvasHeight, maxAgents, onAgentsAdded, onClose }) {
  const [count, setCount] = useState('1');
  const [countError, setCountError] = useState('');
  const [randomColor, setRandomColor] = useState(true);
  const [color, setColor] = useState('#000000');
  const [showFOV, setShowFOV] = useState(false);
  const [limitWarning, setLimitWarning] = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  function create() {
    const n = Number(count);
    if (!count || isNaN(n) || n < 1 || !Number.isInteger(n) || n > maxAgents) {
      setCountError(`Error! Please enter a valid whole number ≥ 1 and ≤ ${maxAgents}!`);
      return;
    }
    setCountError('');

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const roster = agentsArrayRef.current;
    if (!canvas || !ctx) return;

    const allowed = Math.min(n, maxAgents - roster.length);
    if (allowed <= 0) {
      setLimitWarning(`Agent limit reached! Maximum ${maxAgents} agents allowed.`);
      return;
    }
    if (allowed < n) {
      setLimitWarning(`Only ${allowed} agent(s) added — agent limit of ${maxAgents} reached.`);
    } else {
      setLimitWarning('');
    }

    for (let i = 0; i < allowed; i++) {
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;
      const agentColor = randomColor
        ? '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        : color;
      const speed = Math.random() * 2 + 0.5;
      const dir = Math.random() * 2 * Math.PI;
      new Agent(
        showFOV,
        x, y,
        5, Math.cos(dir) * speed, Math.sin(dir) * speed,
        agentColor,
        100,
        150 * Math.PI / 180,
        0,
        `Agent_${roster.length + 1}`,
        ctx, canvas, roster
      );
    }

    onAgentsAdded([...roster]);
    onClose();
  }

  function cancel() {
    onClose();
  }

  return (
    <div ref={cardRef} className="panel-card panel-card-highlight" style={{ position: 'relative' }}>
      <button
        className="btn-secondary"
        onClick={cancel}
        aria-label="Close"
        style={{ position: 'absolute', top: 8, right: 10, width: 28, height: 28, padding: 0, fontSize: 16 }}
      >×</button>
      <h2 className="panel-section-title">Create Multiple Agents</h2>

      <div className="input-group">
        <label>Number of Agents</label>
        <input
          type="number" min="1" max="500" value={count}
          onChange={(e) => { setCount(e.target.value); setCountError(''); }}
        />
        {countError && <span style={{ color: 'red', fontSize: '0.85em' }}>{countError}</span>}
      </div>

      <div className="input-group">
        <label>
          <input type="checkbox" checked={randomColor} onChange={(e) => setRandomColor(e.target.checked)} />
          {' '}Randomized Color
        </label>
        {!randomColor && (
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        )}
      </div>

      <div className="input-group">
        <label>
          <input type="checkbox" checked={showFOV} onChange={(e) => setShowFOV(e.target.checked)} />
          {' '}Show FOV (Not recommended ≥ 50 agents)
        </label>
      </div>

      {limitWarning && <span style={{ color: '#d32f2f', fontSize: '0.85em' }}>{limitWarning}</span>}

      <div className="btn-row">
        <button className="btn-primary" onClick={create}>Create</button>
        <button className="btn-secondary" onClick={cancel}>Cancel</button>
      </div>
    </div>
  );
}

