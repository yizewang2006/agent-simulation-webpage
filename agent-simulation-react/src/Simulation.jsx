import Header from "./Header";
import Footer from "./Footer";
/* 
These imports ensures the correct styles and components are included for the Simulation page.
*/
import './simulation.css';
import { useRef, useEffect, useState } from 'react'; /* To interact with the canvas we have to use useRef and useEffect*/
import SelectableList from "./components/SelectableList"; // selectable list component
import Instruction from "./components/instruction"; // instruction component

// Import Agent Class from agent.js (make them talk to each other)
import { Agent } from "./js_files/agent.js";

// This is amenable as of now, don't forget to change the dimensions in the CSS file as well if you change these
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

// Meeting Notes (2026-3-16): 
// Large scale and small scale:
// Large scale: may only modify agent's color
// Small scale: may modify all properties of the agent, but only 1 agent at a time

function Simulation() {
  /* Canvas */
  const canvasRef = useRef(null);
  const ctxRef = useRef(null); // Ref to hold the canvas context
  const agentsArrayRef = useRef([]); // Ref to hold the internal agents array (used by animation loop & Agent constructor)

  const [targetFPS, setTargetFPS] = useState('30'); // State to hold the target FPS, initially set to 24
  const [simulationScale, setSimulationScale] = useState('small'); // State to hold the simulation scale (small or large), default to small
  const fpsRef = useRef(targetFPS); // Ref to hold the current FPS value, reference this value without the need of rendering

  const [newAgentShowFOV, setNewAgentShowFOV] = useState(true); // Show FOV setting for the agent being created
  const [agents, setAgents] = useState([]); // State to hold agents for display in the control panel
  const [agentsListExpanded, setAgentsListExpanded] = useState(false); // State to toggle agents list visibility

  // Follow behavior state
  const [followBehavior, setFollowBehavior] = useState(true); // State to toggle follow behavior for all agents (currently only show/hide FOV as an example)

  // Add Agent form state
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showAddMultipleAgents, setShowAddMultipleAgents] = useState(false); // New state for showing the "Add Multiple Agents" form
  const [multiAgentRandomColor, setMultiAgentRandomColor] = useState(true); // Randomized Color checkbox, default on
  const [multiAgentColor, setMultiAgentColor] = useState('#000000'); // Color when not randomized
  const [multiAgentCount, setMultiAgentCount] = useState('1');
  const [multiAgentCountError, setMultiAgentCountError] = useState(''); // Error message when an invalid count is entered for multiple agents
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentColor, setNewAgentColor] = useState('#000000');
  const [newAgentX, setNewAgentX] = useState(String(CANVAS_WIDTH / 2));
  const [newAgentY, setNewAgentY] = useState(String(CANVAS_HEIGHT / 2));
  const [newAgentFovAngle, setNewAgentFovAngle] = useState('150');
  const [newAgentAngle, setNewAgentAngle] = useState(true);
  const [newMultiAgentShowFOV, setNewMultiAgentShowFOV] = useState(false); // Show FOV setting for the agents being created

  // Handler for creating a new agent from the form
  function handleAddAgent() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const roster = agentsArrayRef.current;
    console.log("handleAddAgent called", { canvas, ctx, roster });
    if (!canvas || !ctx) {
      console.log("handleAddAgent aborted: canvas or ctx is null");
      return;
    }

    const fovAngleRad = (Number(newAgentFovAngle) || 150) * Math.PI / 180;
    const angleRad = - (Number(newAgentAngle) || 0) * Math.PI / 180;

    new Agent(
      true,                                          // isSpecial
      Number(newAgentX) || CANVAS_WIDTH / 2,           // x, default = center
      Number(newAgentY) || CANVAS_HEIGHT / 2,          // y, default = center
      5,                                              // radius
      0,                                              // dx (no speed)
      0,                                              // dy (no speed)
      newAgentColor,                                  // color
      100,                                            // fovRadius
      fovAngleRad,                                    // fovAngle
      angleRad,                                       // angle
      newAgentName || `Agent_${roster.length + 1}`,   // id (default name if empty)
      ctx,
      canvas,
      roster
    );

    // Apply showFOV only to the newly created agent (last in roster)
    roster[roster.length - 1].showFOV = newAgentShowFOV;

    setAgents([...roster]); // Update React state to reflect new agent

    // Reset form fields when canceled by the user or after adding an agent
    setNewAgentName('');
    setNewAgentColor('#000000');
    setNewAgentX(String(CANVAS_WIDTH / 2));
    setNewAgentY(String(CANVAS_HEIGHT / 2));
    setNewAgentFovAngle('150');
    setNewAgentAngle('0');
    setNewAgentShowFOV(true);
    setShowAddAgent(false);
  }

  function handleCancelAddAgent() {
    setNewAgentName('');
    setNewAgentColor('#000000');
    setNewAgentX(String(CANVAS_WIDTH / 2));
    setNewAgentY(String(CANVAS_HEIGHT / 2));
    setNewAgentFovAngle('150');
    setNewAgentAngle('0');
    setNewAgentShowFOV(true);
    setShowAddAgent(false);
  }

  function handleAddMultipleAgents() {
    const count = Number(multiAgentCount);
    if (!multiAgentCount || isNaN(count) || count < 1 || !Number.isInteger(count) || count > 500) {
      setMultiAgentCountError('Error! Please enter a valid whole number ≥ 1 and ≤ 500!');
      return;
    }
    setMultiAgentCountError('');

    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const roster = agentsArrayRef.current;
    if (!canvas || !ctx) return;

    // Main loop that creates agent
    for (let i = 0; i < count; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * CANVAS_HEIGHT;
      const color = multiAgentRandomColor
        ? '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0') // AI suggested random color generation, with padding to ensure 6 digits
        : multiAgentColor;

      new Agent(
        newMultiAgentShowFOV, // isSpecial (using this to control FOV visibility for simplicity)
        x, y,
        5, 0, 0,
        color,
        100,
        150 * Math.PI / 180,
        0,
        `Agent_${roster.length + 1}`,
        ctx, canvas, roster
      );
    }

    setAgents([...roster]);
    handleCancelAddMultipleAgents();
  }

  // Cancels adding multiple agents and resets the form to default values
  function handleCancelAddMultipleAgents() {
    setMultiAgentCount('1');
    setMultiAgentCountError('');
    setMultiAgentRandomColor(true);
    setMultiAgentColor('#000000');
    setNewMultiAgentShowFOV(false);
    setShowAddMultipleAgents(false);
  }

  useEffect(() => {
    fpsRef.current = Number(targetFPS) || 1; // Update the ref whenever targetFPS state changes, default to 1 if empty/invalid
  }, [targetFPS]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* create the canvas */
    const ctx = canvas.getContext('2d'); // same thing as the HTML version
    ctxRef.current = ctx; // Store in ref for access outside useEffect

    // Change canvas dimensions here
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Array to hold all agents
    const agentsArray = [];
    agentsArrayRef.current = agentsArray; // Store in ref for access outside useEffect

    // Create 3 agents
    //const agent = new Agent(true, 375, 375, 5, 2, 2, '#000000', 100, Math.PI/3, 0, "Elaine", ctx, canvas, agentsArray);
    //const agent2 = new Agent(true, 250, 250, 5, -5, 6, '#000000', 100, Math.PI/3, 0, "Kevin", ctx, canvas, agentsArray);
    //const agent3 = new Agent(true, 125, 125, 5, -7, -8, '#000000', 100, Math.PI/3, 0, "Robin", ctx, canvas, agentsArray);

    // Update state with agents for the control panel
    setAgents(agentsArray); // explained by Claude: ",,," implies a shallow copy of the array, but not required here

    // Animation loop - borrowed from legacy simulation
    let animationId;
    let lastFrameTime = 0;

    function animate(currentTime) {
      animationId = requestAnimationFrame(animate);
      const frameInterval = 1000 / fpsRef.current; // Recalculated every frame from the ref
      const elapsed = currentTime - lastFrameTime;
      if (elapsed >= frameInterval) {
        lastFrameTime = currentTime - (elapsed % frameInterval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        agentsArray.forEach(agent => {
          agent.updatePosition([agent]); // Update it's own position
        });
      }
    }
    animate(0);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="simulation-page"> 
        <Header />
        <div className="simulation-container">
          <div className="canvas-section"><canvas ref={canvasRef} className="simulation-canvas"></canvas></div>
          <div className="control-panel">
            <h1>Control Panel</h1>
            <div className="panel-card">
              <h2 className="panel-section-title">Simulation Setup</h2>
              <div className="input-group">
                <label htmlFor="fps-input">FPS (Frames Per Second)</label>
                <input
                  type="number"
                  id="fps-input"
                  min="1"
                  max="60"
                  value={targetFPS}
                  onChange={(e) => setTargetFPS(e.target.value)}
                  onBlur={(e) => { if (e.target.value === '') setTargetFPS('1');}} // default to 1 when empty on blur (lose focus)
                />
              </div>
              <div className="input-group">
                <label>Simulation Scale</label>
                <div className="radio-group">
                  {['small', 'large'].map((scale) => (
                    <label key={scale} className="radio-option">
                      <input
                        type="radio"
                        name="simulationScale"
                        value={scale}
                        checked={simulationScale === scale}
                        onChange={() => setSimulationScale(scale)}
                      />
                      {scale === 'small' ? 'Small Scale' : 'Large Scale'}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
              <div className="panel-card">
              <h2 className="panel-section-title">Agent Settings</h2>

              {simulationScale === 'small' && ( // will only show up if we have small simulation scale selected, which allows for detailed agent settings and creation. Large scale will only allow for mass creation with limited settings to avoid overwhelming the user and the system.
              <div className = "input-group">
                  <label htmlFor="agent-count-input">Click here to add a new agent:</label>
                  <button className="btn-primary" disabled={showAddAgent || showAddMultipleAgents} onClick={() => setShowAddAgent(true)}>Create an Agent</button>
              </div>
              )}
              {simulationScale === 'large' && (
              <div className = "input-group">
                <label htmlFor="agent-count-input">Click here to add multiple agents at once:</label>
                <button className="btn-primary" disabled={showAddAgent || showAddMultipleAgents} onClick={() => setShowAddMultipleAgents(true)}>Create Multiple Agents</button>
              </div>
              )}

              <div className="agents-list-container">
                <label>Agent List</label>
                <button
                  className="agents-list-toggle"
                  onClick={() => setAgentsListExpanded(!agentsListExpanded)}>{agents.length} {agents.length == 1? 'Agent' : 'Agents'} {agentsListExpanded ? '▲' : '▼'} {agentsListExpanded ? '(Click to Collpase)' : '(Click to Expand)'}</button>
                {agentsListExpanded && (
                  <ul className="agents-list">
                    {agents.map((agent, index) => (
                      <li key={index} className="agent-item">
                        <span className="agent-color" style={{ backgroundColor: agent.color }}></span>
                        {agent.id}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            {showAddAgent && ( // The panel-card for adding the new agent, only comes up when the user clicks the "Add an Agent" button and disappears when they click "Cancel" or "Create"
              <div className="panel-card panel-card-highlight" style={{ position: 'relative' }}>
                <button
                  className="btn-secondary"
                  onClick={handleCancelAddAgent}
                  aria-label="Close"
                  style={{ position: 'absolute', top: 8, right: 10, width: 28, height: 28, padding: 0, fontSize: 16 }}
                >
                  ×</button>
                <h2 className="panel-section-title">Create Agent</h2> 
                <div className="input-group">
                  <label>Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Agent_01"
                    value={newAgentName}
                    onChange={(e) => setNewAgentName(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newAgentShowFOV}
                      onChange={(e) => setNewAgentShowFOV(e.target.checked)}
                    />
                    {' '}Show FOV
                  </label>
                </div>

                <div className="input-group">
                  <label>Color</label>
                  <input
                    type="color"
                    value={newAgentColor}
                    onChange={(e) => setNewAgentColor(e.target.value)}
                  />
                </div>
                <div className="input-row">
                  <div className="input-group">
                    <label>X Position</label>
                    <input
                      type="number"
                      min="0"
                      max={CANVAS_WIDTH}
                      value={newAgentX}
                      onChange={(e) => setNewAgentX(e.target.value)}
                      onBlur={(e) => { if (e.target.value === '') setTargetFPS('1');}} // default to 1 when empty on blur (lose focus)
                    />
                  </div>
                  <div className="input-group">
                    <label>Y Position</label>
                    <input
                      type="number"
                      min="0"
                      max={CANVAS_HEIGHT}
                      value={newAgentY}
                      onChange={(e) => setNewAgentY(e.target.value)}
                    />
                  </div>
                </div>
                <div className="input-row">
                  <div className="input-group">
                    <label>FOV Angle (deg)</label>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={newAgentFovAngle}
                      onChange={(e) => setNewAgentFovAngle(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Initial Angle (deg)</label>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={newAgentAngle}
                      onChange={(e) => setNewAgentAngle(e.target.value)}
                    />
                  </div>
                  
                </div>
                <div className="btn-row">
                  <button className="btn-primary" onClick={handleAddAgent}>Create</button>
                  <button className="btn-secondary" onClick={handleCancelAddAgent}>Cancel</button>
                </div>
              </div>
            )}

            {showAddMultipleAgents && ( // Panel card for adding multiple agents at once. 
            /*
              This card contains the following features:
              1. How many agents to create (number input)
              2. Postion randomized within a specified area (x1, y1, x2, y2) [Later, now by default whole canvas]
              3. Color options (random, or select from a list of presets) [Later, now by default all black]
              4. FOV angle options (random within a range, or set a specific value for all) [Later, now by default 150 degrees]
              5. Initial angle options (random within a range, or set a specific value for all) [Later, now by default 0 degree]
            */
              <div className="panel-card panel-card-highlight" style={{ position: 'relative' }}>
                <button
                  className="btn-secondary"
                  onClick={handleCancelAddMultipleAgents}
                  aria-label="Close"
                  style={{ position: 'absolute', top: 8, right: 10, width: 28, height: 28, padding: 0, fontSize: 16 }}
                >
                  ×</button>
                <h2 className="panel-section-title">Create Multiple Agents</h2> 
                <div className="input-group">
                  <label>Number of Agents</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={multiAgentCount}
                    onChange={(e) => { setMultiAgentCount(e.target.value); setMultiAgentCountError(''); }}
                  />
                  {multiAgentCountError && (
                    <span style={{ color: 'red', fontSize: '0.85em' }}>{multiAgentCountError}</span>
                  )}
                </div>

                <div className="input-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={multiAgentRandomColor}
                      onChange={(e) => setMultiAgentRandomColor(e.target.checked)}
                    />
                    {' '}Randomized Color 
                  </label>
                  {!multiAgentRandomColor && (
                    <input
                      type="color"
                      value={multiAgentColor}
                      onChange={(e) => setMultiAgentColor(e.target.value)} // If not randomized, allow user to select a color for all agents
                    />
                  )}
                </div>

                <div className="input-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={newMultiAgentShowFOV}
                      onChange={(e) => setNewMultiAgentShowFOV(e.target.checked)}
                    />
                    {' '}Show FOV (Not recommended ≥ 50 agents)
                  </label>
                </div>

                <div className="btn-row">
                  <button className="btn-primary" onClick={handleAddMultipleAgents}>Create</button>
                  <button className="btn-secondary" onClick={handleCancelAddMultipleAgents}>Cancel</button>
                </div>
                  
              </div>
            )}

            <div className="panel-card">
              <h2 className="panel-section-title">Simulation Control</h2>
              <div className="input-group">
                <label>
                  <input type="checkbox" checked={followBehavior} onChange={(e) => setFollowBehavior(e.target.checked)}></input>
                  {' '}Everyone Follow Closest Agent</label>
              </div>
            </div>

            <div className="panel-card">
              <h2 className="panel-section-title">Recording & Replay</h2>
              <div className="btn-row">
                  <button className="btn-secondary" onClick={null}>▶</button>
                  <button className="btn-secondary" onClick={null}>⏸</button>
                  <button className="btn-secondary" onClick={null}>Open in a new tab</button>
                </div>
            </div>

            <div className="panel-card">
              <h2 className="panel-section-title">Miscellaneous</h2>
              <div className="input-group">
                <button className="btn-danger" onClick={() => window.location.reload()}>Reset Simulation</button>
              </div>
              <div className="input-group">
                <button className="btn-secondary" onClick={() => window.open('/simulation-legacy/index.html', '_blank', 'noopener,noreferrer')}>Open Legacy Simulation</button>
              </div>
              <div className="input-group">
                <label>Collision Time Use Only</label>
                <button className="btn-secondary" onClick={() => window.open('/collsion-time-simulation/index.html', '_blank', 'noopener,noreferrer')}>Collison Time Simulation</button>
              </div>
            </div>
            
          </div>
        </div>
        <Footer />
    </div>
  );
}

export default Simulation;