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

function Simulation() {
  /* Canvas */
  const canvasRef = useRef(null);

  const [targetFPS, setTargetFPS] = useState('30'); // State to hold the target FPS, initially set to 24
  const fpsRef = useRef(targetFPS); // Ref to hold the current FPS value, reference this value without the need of rendering

  const [agents, setAgents] = useState([]); // State to hold agents for display in the control panel
  const [agentsListExpanded, setAgentsListExpanded] = useState(false); // State to toggle agents list visibility
  
  useEffect(() => {
    fpsRef.current = Number(targetFPS) || 1; // Update the ref whenever targetFPS state changes, default to 1 if empty/invalid
  }, [targetFPS]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* create the canvas */
    const ctx = canvas.getContext('2d'); // same thing as the HTML version

    // Change canvas dimensions here
    canvas.width = 500;
    canvas.height = 500;

    // Array to hold all agents
    const agentsArray = [];

    // Create 3 agents
    const agent = new Agent(true, 375, 375, 5, 3, 4, '#000000', 100, Math.PI/3, 0, "Elaine", ctx, canvas, agentsArray);
    const agent2 = new Agent(true, 250, 250, 5, -5, 6, '#000000', 100, Math.PI/3, 0, "Kevin", ctx, canvas, agentsArray);
    const agent3 = new Agent(true, 125, 125, 5, -7, -8, '#000000', 100, Math.PI/3, 0, "Robin", ctx, canvas, agentsArray);

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
            <h2>Simulation Settings</h2>
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

            <h2>Agent Control</h2>

            <div className="agents-list-container">
              <button
                className="agents-list-toggle"
                onClick={() => setAgentsListExpanded(!agentsListExpanded)}
              >
                Agents ({agents.length}) {agentsListExpanded ? '▲' : '▼'}
              </button>
              {agentsListExpanded && (
                <ul className="agents-list">
                  {agents.map((agent, index) => (
                    <li key={index} className="agent-item">
                      <span className="agent-color" style={{ backgroundColor: agent.color }}></span>
                      {agent.id}
                      <span className="agent-pos">
                        ({Math.round(agent.position.x)}, {Math.round(agent.position.y)})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <h2>Miscellaneous</h2>
            <div className="input-group">
              <button onClick={() => window.location.reload()}>Reset Simulation</button>
            </div>
            <div className="input-group">
              <button onClick={() => window.open('/simulation-legacy/index.html', '_blank', 'noopener,noreferrer')}>Open Legacy Simulation</button>
            </div>
            
          </div>
        </div>
        <Footer />
    </div>
  );
}

export default Simulation;