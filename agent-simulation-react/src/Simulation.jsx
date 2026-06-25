import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AddAgentCard from "./components/AddAgentCard.jsx";
import AddMultipleAgentsCard from "./components/AddMultipleAgentsCard.jsx";
import AgentEditor from "./components/AgentEditor.jsx";
import MiscPanel from "./components/MiscPanel.jsx";
import BehaviorCard from "./components/BehaviorCard.jsx";
import ObstacleCard from "./components/ObstacleCard.jsx";
/* 
These imports ensures the correct styles and components are included for the Simulation page.
*/
import './simulation.css';
import { useRef, useEffect, useState } from 'react'; /* To interact with the canvas we have to use useRef and useEffect*/

// Import Agent Class from agent.js (make them talk to each other)
import { Agent } from "./js_files/agent.js";
import { TARGET_PROPERTIES, METHOD_TYPES, FILTER_TYPES, REFERENCE_TYPES } from "./js_files/behavior.js";

// This is amenable as of now, don't forget to change the dimensions in the CSS file as well if you change these
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const MAX_AGENTS = 500; // Maximum number of agents allowed on the canvas at once

function getCanvasLogicalWidth(canvas) {
  return canvas?.logicalWidth ?? canvas?.width ?? CANVAS_WIDTH;
}

function getCanvasLogicalHeight(canvas) {
  return canvas?.logicalHeight ?? canvas?.height ?? CANVAS_HEIGHT;
}

function configureHighDpiCanvas(canvas, ctx) {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.logicalWidth = CANVAS_WIDTH;
  canvas.logicalHeight = CANVAS_HEIGHT;
  canvas.width = Math.round(CANVAS_WIDTH * pixelRatio);
  canvas.height = Math.round(CANVAS_HEIGHT * pixelRatio);
  canvas.style.width = `${CANVAS_WIDTH}px`;
  canvas.style.height = `${CANVAS_HEIGHT}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function Simulation() {
  /* Canvas */
  const canvasRef = useRef(null);
  const ctxRef = useRef(null); // Ref to hold the canvas context
  const agentsArrayRef = useRef([]); // Ref to hold the internal agents array (used by animation loop & Agent constructor)
  const obstaclesArrayRef = useRef([]); // Ref to hold obstacle objects used by the animation loop

  const [targetFPS, setTargetFPS] = useState('30'); // State to hold the target FPS, initially set to 24
  const [simulationScale, setSimulationScale] = useState('large'); // State to hold the simulation scale (small or large), default to small
  const fpsRef = useRef(targetFPS); // Ref to hold the current FPS value, reference this value without the need of rendering
  const [maxSpeed, setMaxSpeed] = useState('3');
  const [maxAngle, setMaxAngle] = useState('45');
  const maxSpeedRef = useRef(maxSpeed);
  const maxAngleRef = useRef(maxAngle);

  const [agents, setAgents] = useState([]); // State to hold agents for display in the control panel
  const [agentsListExpanded, setAgentsListExpanded] = useState(false); // State to toggle agents list visibility
  const [obstacles, setObstacles] = useState([]); // State to hold obstacles for display in the control panel
  const [obstaclesListExpanded, setObstaclesListExpanded] = useState(false); // State to toggle obstacles list visibility

  // Adding Agent States
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showAddMultipleAgents, setShowAddMultipleAgents] = useState(false);
  const [showAddObstacle, setShowAddObstacle] = useState(false);

  // Behavior & Filter settings state & Ref
  const [behaviorList, setBehaviorList] = useState([]); // Behavior
  const [collapsedBehaviorIds, setCollapsedBehaviorIds] = useState(new Set());
  const behaviorListRef = useRef([]); // Ref to hold the current behavior list for access in the animation loop

  // Agent editor state
  const [selectedAgent, setSelectedAgent] = useState(null); // the live Agent object

  // ---- Handlers ----
  // ---- Behavior Handlers ----
  function handleAddBehavior() {
    // Add a new behavior to the behavior list.
    setBehaviorList((currentList) => [...currentList, createBehavior(currentList)]);
  }

  function handleUpdateBehavior(behaviorId, updates) {
    // Update the behavior with the matching behaviorId.
    setBehaviorList((currentList) => currentList.map((behavior) => (
      behavior.id === behaviorId ? { ...behavior, ...updates } : behavior
    )));
  }

  function handleDeleteBehavior(behaviorId) {
    // Delete the behavior with the matching behaviorId from the behavior list.
    setBehaviorList((currentList) => currentList.filter((behavior) => behavior.id !== behaviorId));
    // Also remove that behavior from the collapsed card set, so deleted IDs do not stay in UI state.
    setCollapsedBehaviorIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(behaviorId);
      return nextIds;
    });
  }

  function handleLoadBehaviorPreset(presetData) {
    // Add behaviors loaded from a preset JSON file.
    setBehaviorList((currentList) => {
      const presetBehaviors = getPresetBehaviorArray(presetData);
      const nextList = [...currentList];

      presetBehaviors.forEach((behavior) => {
        nextList.push(createBehaviorFromPreset(behavior, nextList));
      });

      return nextList;
    });
  }

  function handleToggleBehaviorCollapsed(behaviorId) {
    // Toggle whether the behavior card is expanded or collapsed.
    setCollapsedBehaviorIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(behaviorId)) {
        nextIds.delete(behaviorId);
      } else {
        nextIds.add(behaviorId);
      }
      return nextIds;
    });
  }

  function createBehavior(existingBehaviors) {
    return {
      id: createStableId(),
      name: getUniqueBehaviorName(existingBehaviors, 'Behavior'),
      targetProperty: TARGET_PROPERTIES.POSITION,
      action: REFERENCE_TYPES.NEIGHBOR_REFERENCE,
      offset: '',
      filters: [],
    };
  }

  function createBehaviorFromPreset(behavior, existingBehaviors) {
    return {
      id: createStableId(),
      name: getUniqueBehaviorName(existingBehaviors, getPresetName(behavior.name)),
      targetProperty: getValidValue(behavior.targetProperty, TARGET_PROPERTIES, TARGET_PROPERTIES.POSITION),
      action: getValidValue(behavior.option, REFERENCE_TYPES, REFERENCE_TYPES.NEIGHBOR_REFERENCE),
      offset: behavior.offset ?? '',
      filters: Array.isArray(behavior.filters)
        ? behavior.filters.map((filter) => createFilterFromPreset(filter))
        : [],
    };
  }

  function createFilter() {
    return {
      id: createStableId(),
      filterType: 'method',
      propertyType: FILTER_TYPES.DISTANCE,
      methodType: METHOD_TYPES.CLOSEST,
      rangeLow: '',
      rangeHigh: '',
    };
  }

  function createFilterFromPreset(filter) {
    return {
      id: createStableId(),
      filterType: filter.filterType === 'ranged' ? 'ranged' : 'method',
      propertyType: getValidValue(filter.filteredProperty, FILTER_TYPES, FILTER_TYPES.DISTANCE),
      methodType: getValidValue(filter.methodType, METHOD_TYPES, METHOD_TYPES.CLOSEST),
      rangeLow: filter.low ?? '',
      rangeHigh: filter.high ?? '',
    };
  }

  function createStableId() {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function getPresetBehaviorArray(presetData) {
    if (Array.isArray(presetData)) return presetData;
    if (Array.isArray(presetData?.behaviors)) return presetData.behaviors;
    throw new Error('Preset must be an array or an object with a behaviors array.');
  }

  function getPresetName(name) {
    if (typeof name === 'string' && name.trim() !== '') return name.trim();
    return 'Behavior';
  }

  function getValidValue(value, valueSet, fallback) {
    const numericValue = Number(value);
    return Object.values(valueSet).includes(numericValue) ? numericValue : fallback;
  }

  // Give each behavior a unique default name when it is created.
  function getUniqueBehaviorName(behaviors, baseName) {
    const existingNames = new Set(behaviors.map((b) => b.name));

    if (!existingNames.has(baseName)) return baseName;

    let suffix = 1;
    let candidate = `${baseName} ${suffix}`;

    while (existingNames.has(candidate)) {
      suffix += 1;
      candidate = `${baseName} ${suffix}`;
    }

    return candidate;
  }

  // ---- Filter Handlers ----
  function handleAddFilter(behaviorId) {
    // Add a new filter to the behavior with the matching behaviorId.
    setBehaviorList((currentList) => currentList.map((behavior) => (
      behavior.id === behaviorId
        ? { ...behavior, filters: [...behavior.filters, createFilter()] }
        : behavior
    )));
  }

  function handleUpdateFilter(behaviorId, filterId, updates) {
    // Update the filter with the matching filterId inside the matching behavior.
    setBehaviorList((currentList) => currentList.map((behavior) => (
      behavior.id === behaviorId
        ? {
            ...behavior,
            filters: behavior.filters.map((filter) => (
              filter.id === filterId ? { ...filter, ...updates } : filter
            )),
          }
        : behavior
    )));
  }

  function handleDeleteFilter(behaviorId, filterId) {
    // Delete the filter with the matching filterId from the matching behavior.
    setBehaviorList((currentList) => currentList.map((behavior) => (
      behavior.id === behaviorId
        ? { ...behavior, filters: behavior.filters.filter((filter) => filter.id !== filterId) }
        : behavior
    )));
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

    configureHighDpiCanvas(canvas, ctx);

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
        ctx.clearRect(0, 0, getCanvasLogicalWidth(canvas), getCanvasLogicalHeight(canvas));
        obstaclesArrayRef.current.forEach(obstacle => obstacle.draw());
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
    // Scale click coords to match the logical simulation size.
    const scaleX = getCanvasLogicalWidth(canvas) / rect.width;
    const scaleY = getCanvasLogicalHeight(canvas) / rect.height;
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

  // Main Simulation
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0' }}>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #d0d0d0' }} />
                <span style={{ color: '#888', fontSize: 11, fontWeight: 600 }}>Speed & Angle Limits</span>
                <hr style={{ flex: 1, border: 'none', borderTop: '1px solid #d0d0d0' }} />
              </div>

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

            {/* Obstacle Dashboard */}
            <div className="panel-card">
              <h2 className="panel-section-title">Obstacle Dashboard</h2>

              <div className="input-group">
                <button className="btn-primary" disabled={showAddObstacle} onClick={() => setShowAddObstacle(true)}>Create Obstacle</button>
              </div>

              {obstacles.length > 0 && (
                <div className="input-group">
                  <button
                    className="btn-danger"
                    onClick={() => {
                      obstaclesArrayRef.current.length = 0;
                      setObstacles([]);
                    }}
                  >Delete All Obstacles</button>
                </div>
              )}

              <div className="agents-list-container">
                <label>Obstacle List</label>
                <button
                  className="agents-list-toggle"
                  onClick={() => setObstaclesListExpanded(!obstaclesListExpanded)}
                >
                  {obstacles.length} {obstacles.length === 1 ? 'Obstacle' : 'Obstacles'} {obstaclesListExpanded ? '▲' : '▼'} {obstaclesListExpanded ? '(Click to Collapse)' : '(Click to Expand)'}
                </button>
                {obstaclesListExpanded && (
                  <ul className="agents-list">
                    {obstacles.map((obstacle, index) => (
                      <li key={`${obstacle.ID}-${index}`} className="agent-item">
                        <span className="agent-color" style={{ backgroundColor: obstacle.color }}></span>
                        {obstacle.ID} ({obstacle.shapeType === 'circle' ? 'Circle' : 'Polygon'})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {showAddObstacle && (
              <ObstacleCard
                ctxRef={ctxRef}
                obstaclesArrayRef={obstaclesArrayRef}
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={CANVAS_HEIGHT}
                onObstaclesChanged={(updatedObstacles) => setObstacles(updatedObstacles)}
                onClose={() => setShowAddObstacle(false)}
              />
            )}
            
            <BehaviorCard
              behaviorList={behaviorList}
              collapsedBehaviorIds={collapsedBehaviorIds}
              onAddBehavior={handleAddBehavior}
              onUpdateBehavior={handleUpdateBehavior}
              onDeleteBehavior={handleDeleteBehavior}
              onLoadBehaviorPreset={handleLoadBehaviorPreset}
              onToggleBehaviorCollapsed={handleToggleBehaviorCollapsed}
              onAddFilter={handleAddFilter}
              onUpdateFilter={handleUpdateFilter}
              onDeleteFilter={handleDeleteFilter}
            />
            
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

            <MiscPanel />
            
          </div>
        </div>
        <Footer />
    </div>
  );
}

export default Simulation;
