import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AddAgentCard from "./components/AddAgentCard.jsx";
import AddMultipleAgentsCard from "./components/AddMultipleAgentsCard.jsx";
import AgentEditor from "./components/AgentEditor.jsx";
/* 
These imports ensures the correct styles and components are included for the Simulation page.
*/
import './simulation.css';
import { useRef, useEffect, useState } from 'react'; /* To interact with the canvas we have to use useRef and useEffect*/

// Import Agent Class from agent.js (make them talk to each other)
import { Agent } from "./js_files/agent.js";
import { TARGET_PROPERTIES, METHOD_LABELS, METHOD_TYPES, PROPERTY_LABELS, METHOD_LABELS_BY_PROPERTY, FILTER_TYPES, FILTER_LABELS, REFERENCE_TYPES, REFERENCE_LABELS } from "./js_files/behavior.js";

// This is amenable as of now, don't forget to change the dimensions in the CSS file as well if you change these
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const MAX_AGENTS = 500; // Maximum number of agents allowed on the canvas at once

function Simulation() {
  /* Canvas */
  const canvasRef = useRef(null);
  const ctxRef = useRef(null); // Ref to hold the canvas context
  const agentsArrayRef = useRef([]); // Ref to hold the internal agents array (used by animation loop & Agent constructor)

  const [targetFPS, setTargetFPS] = useState('30'); // State to hold the target FPS, initially set to 24
  const [simulationScale, setSimulationScale] = useState('large'); // State to hold the simulation scale (small or large), default to small
  const fpsRef = useRef(targetFPS); // Ref to hold the current FPS value, reference this value without the need of rendering
  const [maxSpeed, setMaxSpeed] = useState('3');
  const [maxAngle, setMaxAngle] = useState('45');
  const maxSpeedRef = useRef(maxSpeed);
  const maxAngleRef = useRef(maxAngle);

  const [agents, setAgents] = useState([]); // State to hold agents for display in the control panel
  const [agentsListExpanded, setAgentsListExpanded] = useState(false); // State to toggle agents list visibility

  // Adding Agent States
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showAddMultipleAgents, setShowAddMultipleAgents] = useState(false);

  // Behavior & Filter settings state & Ref
  const [behaviorList, setBehaviorList] = useState([]); // Behavior
  const behaviorListRef = useRef([]); // Ref to hold the current behavior list for access in the animation loop

  // Agent editor state
  const [selectedAgent, setSelectedAgent] = useState(null); // the live Agent object

  // ---- Handlers ----
  // ---- Behavior Handlers ----
  function handleAddBehavior(behaviorIndex, newBehavior) {
    // Add a new behavior to the behavior list (or add a behavior if behaviorIndex is null)
    const newList = [...behaviorList];
    newList.push(newBehavior);
    setBehaviorList(newList);
  }

  function handleUpdateBehavior(behaviorIndex, updatedBehavior) {
    // Update the behavior at behaviorIndex with the updatedBehavior
    const newList = [...behaviorList];
    newList[behaviorIndex] = updatedBehavior;
    setBehaviorList(newList);
  }

  function handleDeleteBehavior(behaviorIndex) {
    // Delete the behavior at behaviorIndex from the behavior list
    const newList = [...behaviorList];
    newList.splice(behaviorIndex, 1);
    setBehaviorList(newList);
  }

  // ---- Filter Handlers ----
  function handleAddFilter(behaviorIndex, filterIndex) {
    // Add a new filter to the behavior at behaviorIndex (or add a filter if filterIndex is null)
    // using structuredClone to avoid mutating the existing behavior/filter objects (deep copy)
    const newList = structuredClone(behaviorList);
    newList[behaviorIndex].filters.push({ filterType: 'method', 
      propertyType: FILTER_TYPES.DISTANCE, 
      methodType: METHOD_TYPES.CLOSEST,
      rangeLow: '',
      rangeHigh: '' }); // Add a default filter, user can modify it in the editor
    setBehaviorList(newList);
  }

  function handleUpdateFilter(behaviorIndex, filterIndex, updatedFilter) {
    // Update the filter at filterIndex of the behavior at behaviorIndex with the updatedFilter
    const newList = structuredClone(behaviorList);
    newList[behaviorIndex].filters[filterIndex] = updatedFilter;
    setBehaviorList(newList);
  }

  function handleDeleteFilter(behaviorIndex, filterIndex) {
    // Delete the filter at filterIndex of the behavior at behaviorIndex from the behavior list
    const newList = structuredClone(behaviorList);
    newList[behaviorIndex].filters.splice(filterIndex, 1);
    setBehaviorList(newList);
  }

  // ---- Offset Handlers ----
  // used to update the value of the offset for that behavior when the user changes the input in the editor
  function handleUpdateOffset(behaviorIndex, targetProperty, parameters) {
    // Depending on the targetProperty, updating the corresponding parameters in the behavior's filters
    // Calls handleUpdateBehavior 
    const behavior = behaviorList[behaviorIndex];
    switch (targetProperty) {
      case TARGET_PROPERTIES.SPEED: {
        // SINGLE VALUE
        handleUpdateBehavior(behaviorIndex, { ...behavior, offset: Number(parameters) });
        break;
      }
      case TARGET_PROPERTIES.ANGLE: {
        // SINGLE VALUE (in degrees, agent.js converts to radians when applying)
        handleUpdateBehavior(behaviorIndex, { ...behavior, offset: Number(parameters) });
        break;
      }
      case TARGET_PROPERTIES.POSITION: {
        // TWO VALUES (x and y offsets)
        handleUpdateBehavior(behaviorIndex, { ...behavior, offset: Number(parameters) });
        break;
      }
    }
  }

  // ---- Simulation FPS ----
  useEffect(() => {
    fpsRef.current = Number(targetFPS) || 1; // Update the ref whenever targetFPS state changes, default to 1 if empty/invalid
  }, [targetFPS]);

  useEffect(() => { maxSpeedRef.current = maxSpeed; }, [maxSpeed]);
  useEffect(() => { maxAngleRef.current = maxAngle; }, [maxAngle]);

  // Behavior List Ref Sync (ensuring the latest behavior list is available)
  useEffect(() => {
    behaviorListRef.current = behaviorList;
  }, [behaviorList]);

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
        agentsArray.forEach(agent => agent.move(maxSpeedRef.current));
        agentsArray.forEach(agent => agent.behave(agentsArray, behaviorListRef.current, maxSpeedRef.current, maxAngleRef.current));
      }
    }
    animate(0);

    return () => cancelAnimationFrame(animationId);
  }, []);

  // ---- Canvas Interaction Handlers ----
  function handleCanvasClick(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    // Scale click coords to match internal canvas resolution (CSS size may differ from canvas width/height)
    // With help of Claude
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Finds the first agent within the click area (agent radius + 4px tolerance) and selects it for editing
    const clicked = agentsArrayRef.current.find(agent => {
      const dx = clickX - agent.position.x;
      const dy = clickY - agent.position.y;
      return Math.sqrt(dx * dx + dy * dy) <= agent.radius + 4; // +4px tolerance so small agents are easier to click
    });

    if (clicked) {
      setSelectedAgent(clicked);
    }
  }

  return (
    <div className="simulation-page"> 
        <Header />
        <div className="simulation-container">
          {/*Canvas Section*/}
          <div className="canvas-section"><canvas ref={canvasRef} className="simulation-canvas" onClick={handleCanvasClick}></canvas></div>
          {/*Control Panel*/}
          <div className="control-panel">
            <h1>Control Panel</h1>
            
            
              <div className="panel-card">
              <h2 className="panel-section-title">Agent Configuration</h2>

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
                        onChange={() => { // lambda function to handle scale change.
                          setSimulationScale(scale);
                          if (scale === 'large') {
                            setShowAddAgent(false);
                            setShowAddMultipleAgents(false);
                          } else {
                            setShowAddMultipleAgents(false);
                            setShowAddAgent(false);
                          }
                        }}
                      />
                      {scale === 'small' ? 'Small' : 'Large'}
                    </label>
                  ))}
                </div>
              </div>

              {/* A dividing line */}
              <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '4px 0' }} />

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

              {agents.length > 0 && (
                <div className="input-group">
                  <button className="btn-danger" onClick={() => { agentsArrayRef.current.length = 0; setAgents([]); }}>Delete All Agents</button>
                </div>
              )}

              {/* Agent List */}
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

              {/* A dividing line */}
              <hr style={{ border: 'none', borderTop: '1px solid #e0e0e0', margin: '4px 0' }} />

              {/* Max Speed Text Box*/}
              <div className="input-group">
                <label htmlFor="max-speed">Maximum Speed</label>
                <input
                  type="number"
                  placeholder={`< 5`}
                  value={maxSpeed}
                  onChange={(e) => setMaxSpeed(e.target.value)}
                  max={'5'}
                  min={'0'}
                />
              </div>

              {/* Max Angle Text Box */}
              <div className="input-group">
                <label htmlFor="max-angle">Maximum Angle (degrees)</label>
                <input
                  type="number"
                  placeholder={`< 45 degrees`}
                  value={maxAngle}
                  onChange={(e) => setMaxAngle(e.target.value)}
                  max={'45'}
                  min={'0'}
                />
              </div>
            </div>
            
            {/* Add Agent Cards*/}
            {simulationScale == "small" && showAddAgent && (
              <AddAgentCard
                canvasRef={canvasRef}
                ctxRef={ctxRef}
                agentsArrayRef={agentsArrayRef}
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={CANVAS_HEIGHT}
                maxAgents={MAX_AGENTS}
                onAgentAdded={(updatedRoster) => setAgents(updatedRoster)}
                onClose={() => setShowAddAgent(false)}
              />
            )}

            {simulationScale == "large" && showAddMultipleAgents && (
              <AddMultipleAgentsCard
                canvasRef={canvasRef}
                ctxRef={ctxRef}
                agentsArrayRef={agentsArrayRef}
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={CANVAS_HEIGHT}
                maxAgents={MAX_AGENTS}
                onAgentsAdded={(updatedRoster) => setAgents(updatedRoster)}
                onClose={() => setShowAddMultipleAgents(false)}
              />
            )}

            <AgentEditor
              selectedAgent={selectedAgent}
              onApply={({ name, color, showFOV, fovAngle }) => {
                selectedAgent.id = name;
                selectedAgent.originalColor = color;
                selectedAgent.colorHex = color;
                selectedAgent.showFOV = showFOV;
                selectedAgent.isSpecial = showFOV; // isSpecial gates FOV drawing in agent.js — must stay in sync with showFOV
                const parsedFovAngle = Number(fovAngle);
                selectedAgent.fovAngle = (fovAngle === '' || !Number.isFinite(parsedFovAngle) ? 150 : parsedFovAngle) * Math.PI / 180;
                setAgents([...agentsArrayRef.current]);
              }}
              onDeselect={() => setSelectedAgent(null)}
            />
            
            {/* Behavior & Filter Settings*/}
            <div className="panel-card">
              <h2 className="panel-section-title">Behavior & Filter Settings</h2>
              
              {behaviorList.map((behavior, behaviorIndex) => (
                <div key={behaviorIndex} className="panel-card panel-card-highlight" style={{ position: 'relative', marginBottom: 6 }}>
                  <button
                    className="btn-danger"
                    onClick={() => handleDeleteBehavior(behaviorIndex)}
                    aria-label="Delete behavior"
                    style={{ position: 'absolute', top: 6, right: 8, width: 24, height: 24, padding: 0, fontSize: 14 }}
                  >×</button>
                  <h2 className="panel-section-title">{behavior.name}</h2> 
                  {/* Names */}
                  <div className="input-group">
                    <label>Behavior Name</label>
                    <input
                      type="text"
                      placeholder={`Behavior ${behaviorIndex + 1}`}
                      value={behavior.name}
                      onChange={(e) => handleUpdateBehavior(behaviorIndex, { ...behavior, name: e.target.value })}
                    />
                  </div>

                  <div className="input-group">
                    <label>Option</label>
                    <select
                      value={behavior.action}
                      onChange={(e) => handleUpdateBehavior(behaviorIndex, { ...behavior, action: Number(e.target.value) })}
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
                      onChange={(e) => handleUpdateBehavior(behaviorIndex, { ...behavior, targetProperty: Number(e.target.value) })}
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
                      onChange={(e) => handleUpdateBehavior(behaviorIndex, { ...behavior, offset: e.target.value })}
                    />
                  </div>

                  {/* Filters sub-box */}
                  <div className="panel-card" style={{ marginTop: 8 }}>
                    <h3 className="panel-section-title" style={{ margin: '2px 0 6px 0' }}>Filters</h3>

                    {behavior.filters.map((filter, filterIndex) => (
                      <div key={filterIndex} className="panel-card panel-card-highlight" style={{ position: 'relative', marginBottom: 6 }}>
                        <button
                          className="btn-secondary"
                          onClick={() => handleDeleteFilter(behaviorIndex, filterIndex)}
                          aria-label="Remove filter"
                          style={{ position: 'absolute', top: 6, right: 8, width: 24, height: 24, padding: 0, fontSize: 14 }}
                        >×</button>

                        <div className="input-group">
                          <label>Type</label>
                          <div className="radio-group">
                            {['method', 'ranged'].map(t => ( // method, ranged
                              <label key={t} className="radio-option">
                                <input
                                  type="radio"
                                  name={`filter-type-${behaviorIndex}-${filterIndex}`}
                                  value={t}
                                  checked={filter.filterType === t}
                                  onChange={() => handleUpdateFilter(behaviorIndex, filterIndex, { ...filter, filterType: t })}
                                />
                                {' '}{t.charAt(0).toUpperCase() + t.slice(1)}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="input-group">
                          <label>Property</label>
                          <select value={filter.propertyType} onChange={(e) => handleUpdateFilter(behaviorIndex, filterIndex, { ...filter, propertyType: Number(e.target.value) })}>
                            {Object.entries(FILTER_LABELS).map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </div>

                        {filter.filterType === 'method' && (
                          <div className="input-group">
                            <label>Method</label>
                            <select value={filter.methodType} onChange={(e) => handleUpdateFilter(behaviorIndex, filterIndex, { ...filter, methodType: Number(e.target.value) })}>
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
                              <input type="number" value={filter.rangeLow} onChange={(e) => handleUpdateFilter(behaviorIndex, filterIndex, { ...filter, rangeLow: e.target.value })} />
                            </div>
                            <div className="input-group">
                              <label>High</label>
                              <input type="number" value={filter.rangeHigh} onChange={(e) => handleUpdateFilter(behaviorIndex, filterIndex, { ...filter, rangeHigh: e.target.value })} />
                            </div>
                          </div>
                        )}

                        
                      </div>
                    ))}

                    <button className="btn-secondary" onClick={() => handleAddFilter(behaviorIndex)}>+ Add Filter</button>
                  </div>
                </div>
              ))}

              <div className="btn-row" style={{ marginBottom: 12 }}>
                <button className="btn-primary" onClick={() => handleAddBehavior(null, { name: `Behavior ${behaviorList.length + 1}`, targetProperty: TARGET_PROPERTIES.POSITION, action: REFERENCE_TYPES.NEIGHBOR_REFERENCE, filters: [] })}>+ Add Behavior</button>
              </div>
            </div>
            
            {/* Following Code Segement is no longer needed*/}
            {/*
            <div className="panel-card">
              <h2 className="panel-section-title">Simulation Control (To be Implemented)</h2>
              <div className="input-group">
                <label>
                  <input type="checkbox" checked={followBehavior} onChange={(e) => setFollowBehavior(e.target.checked)}></input>
                  {' '}Everyone Follow Closest Agent</label>
              </div>
            </div>
            */}

            {/*Simulation Setup Card*/}
            <div className="panel-card">
              <h2 className="panel-section-title">Simulation Configuration</h2>
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

            </div>

            <div className="panel-card">
              <h2 className="panel-section-title">Recording & Replay (To be Implemented)</h2>
              <div className="btn-row">
                  <button className="btn-secondary" onClick={null}>▶</button>
                  <button className="btn-secondary" onClick={null}>⏸</button>
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
