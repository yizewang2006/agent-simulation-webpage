import { useState, useEffect, useRef } from 'react';
import { Agent } from '../../models/agent.js';
import { CircleX, CopyPlus } from 'lucide-react';
import AlertBox from './AlertBox.jsx';
import { ENTITY_TYPES } from '../../utils/constants.js';
import { createEntityID } from '../../utils/utilities.js';

export default function AddMultipleAgentsCard({ canvasRef, ctxRef, agentsArrayRef, canvasWidth, canvasHeight, maxAgents, onAgentsAdded, onClose }) {
  const [count, setCount] = useState('1');
  const [countError, setCountError] = useState('');
  const [randomColor, setRandomColor] = useState(true);
  const [color, setColor] = useState('#000000');
  const [showFOV, setShowFOV] = useState(false);
  const [showCapacityAlert, setShowCapacityAlert] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  function create() {
    const n = Number(count);
    if (!count || isNaN(n) || n < 1 || !Number.isInteger(n)) {
      setCountError('Please enter a whole number greater than or equal to 1.');
      return;
    }
    setCountError('');

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const roster = agentsArrayRef.current;
    if (!canvas || !ctx) return;

    const remainingCapacity = maxAgents - roster.length;

    // Do not partially fulfill a bulk-create request. Ask the user to lower the
    // requested amount so the resulting agent count stays within the safe limit.
    if (n > remainingCapacity) {
      setShowCapacityAlert(true);
      return;
    }

    for (let i = 0; i < n; i++) {
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;
      const agentColor = randomColor
        ? '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
        : color;
      const speed = Math.random() * 2 + 0.5;
      const dir = Math.random() * 2 * Math.PI;
      const agent = new Agent(
        showFOV,
        x, y,
        5, Math.cos(dir) * speed, Math.sin(dir) * speed,
        agentColor,
        100,
        150 * Math.PI / 180,
        0,
        createEntityID(ENTITY_TYPES.AGENT),
        `Agent_${roster.length + 1}`,
        canvas, roster
      );

      agent.showFOV = showFOV;
      agent.move();
      agent.draw(ctx);
    }

    onAgentsAdded([...roster]);
    onClose();
  }

  function cancel() {
    onClose();
  }

  return (
    <>
      {showCapacityAlert && (
        <AlertBox
          title="Sorry, the Canvas Is at Full Capacity!"
          primMessage={`You're trying to create too many agents. The limit is ${maxAgents} agents, and the canvas currently contains ${agentsArrayRef.current.length}.`}
          secMessage="We impose this limit to ensure the best possible performance. Try reducing the number of agents you want to create, or remove some existing agents first."
          type="warning"
          confirmLabel="Got It"
          cancelLabel="Close"
          onConfirm={() => setShowCapacityAlert(false)}
          onCancel={() => setShowCapacityAlert(false)}
        />
      )}
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

      <div className="btn-row">
        <button className="btn-primary icon-button" onClick={create}>
          <CopyPlus className="button-icon" size={16} aria-hidden="true" />
          Create
        </button>
        <button className="btn-secondary icon-button" onClick={cancel}>
          <CircleX className="button-icon" size={16} aria-hidden="true" />
          Cancel
        </button>
      </div>
      </div>
    </>
  );
}
