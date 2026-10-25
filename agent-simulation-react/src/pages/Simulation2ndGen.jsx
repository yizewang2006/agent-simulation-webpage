import Header from "../components/shared/Header.jsx";
import Footer from "../components/shared/Footer.jsx";
import AddAgentCard from "../components/simulation/AddAgentCard.jsx";
import AddMultipleAgentsCard from "../components/simulation/AddMultipleAgentsCard.jsx";
import EntityEditor from "../components/simulation/EntityEditor.jsx";
import MiscPanel from "../components/simulation/MiscPanel.jsx";
import BehaviorCard from "../components/simulation/BehaviorCard.jsx";
import ObstacleCard from "../components/simulation/ObstacleCard.jsx";
import RecordingCard from "../components/simulation/RecordingCard.jsx";
import AlertBox from "../components/simulation/AlertBox.jsx";
import { ArrowBigDownDash, ArrowLeft, Blocks, ChevronDown, ChevronUp, CopyPlus, FileUp, MousePointer2, Pause, Play, Settings, SquarePlus, UserCog } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
/* 
These imports ensures the correct styles and components are included for the Simulation page.
*/
import '../styles/simulation.css';
import { useRef, useEffect, useState } from 'react'; /* To interact with the canvas we have to use useRef and useEffect*/

// Import Agent Class from agent.js (make them talk to each other)
import { Agent } from "../models/agent.js";
import { Obstacle } from "../models/obstacle.js";
import { TARGET_PROPERTIES, METHOD_TYPES, MEASUREMENT_TYPES, REFERENCE_TYPES, ENTITY_TYPES, SHAPE_TYPES } from "../utils/constants.js";
import { findRuntimeEntityAt } from "../utils/runtimeCanvasInteractionUtilities.js";
import { configureHighDpiCanvas, getCanvasLogicalHeight, getCanvasLogicalWidth, getCanvasPointFromEvent } from "../utils/utilities.js";
import { loadScenarioFile } from "../utils/scenarioUtilities.js";

// This is amenable as of now, don't forget to change the dimensions in the CSS file as well if you change these
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;
const MAX_AGENTS = 500; // Maximum number of agents allowed on the canvas at once

// Capture one JSON-friendly frame. Playback can redraw from this data without running behavior again.
function createFrameSnapshot(agentsArray, obstaclesArray, frameIndex, recordingStartTime) {
  return {
    frameIndex,
    timestamp: performance.now() - recordingStartTime,
    agents: agentsArray.map((agent) => ({
      id: agent.id,
      name: agent.name,
      x: agent.transform.position.x,
      y: agent.transform.position.y,
      radius: agent.shapes[0].radius,
      dx: agent.velocity.x,
      dy: agent.velocity.y,
      angle: agent.transform.rotation,
      colorHex: agent.colorHex,
      fovRadius: agent.fovRadius,
      fovAngle: agent.fovAngle,
      // Store the final visual FOV decision used by Entity.draw().
      showFOV: agent.isSpecial && agent.showFOV !== false,
    })),
    obstacles: obstaclesArray.map((obstacle) => {
      const shape = obstacle.shapes[0];
      return {
        id: obstacle.id,
        name: obstacle.name,
        shapeType: shape.type,
        color: obstacle.color,
        center: shape.type === SHAPE_TYPES.CIRCLE
          ? shape.getWorldCenter(obstacle.transform)
          : null,
        radius: shape.type === SHAPE_TYPES.CIRCLE ? shape.radius : null,
        vertices: shape.type === SHAPE_TYPES.POLYGON
          ? shape.getWorldVertices(obstacle.transform)
          : [],
      };
    }),
  };
}

function drawObstaclePreview(ctx, preview) {
  if (!preview) return;

  // Preview is only a canvas overlay: it never enters the obstacle list, so
  // agents do not collide with it and recordings do not capture it.
  ctx.save();
  ctx.fillStyle = 'rgba(79, 134, 215, 0.16)';
  ctx.strokeStyle = '#4f86d7';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);

  if (preview.shapeType === SHAPE_TYPES.CIRCLE) {
    ctx.beginPath();
    ctx.arc(preview.center.x, preview.center.y, preview.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (preview.shapeType === SHAPE_TYPES.POLYGON && preview.vertices.length >= 3) {
    ctx.beginPath();
    ctx.moveTo(preview.vertices[0].x, preview.vertices[0].y);
    for (let i = 1; i < preview.vertices.length; i++) {
      ctx.lineTo(preview.vertices[i].x, preview.vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawAgentPreview(ctx, preview) {
  if (!preview) return;

  // Like obstacle preview, this is only a visual overlay. The draft agent is
  // never added to agentsArrayRef, so no behavior or collision code can see it.
  ctx.save();

  if (preview.showFOV) {
    ctx.beginPath();
    ctx.moveTo(preview.x, preview.y);
    ctx.arc(
      preview.x,
      preview.y,
      preview.fovRadius,
      preview.angle - preview.fovAngle / 2,
      preview.angle + preview.fovAngle / 2
    );
    ctx.closePath();
    ctx.fillStyle = 'rgba(79, 134, 215, 0.10)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(79, 134, 215, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.stroke();
  }

  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.arc(preview.x, preview.y, preview.radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = `${preview.color}55`;
  ctx.fill();
  ctx.strokeStyle = '#4f86d7';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(preview.x, preview.y);
  ctx.lineTo(
    preview.x + Math.cos(preview.angle) * preview.radius * 2.6,
    preview.y + Math.sin(preview.angle) * preview.radius * 2.6
  );
  ctx.setLineDash([]);
  ctx.strokeStyle = '#4f86d7';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

function Simulation2ndGen() {
  const navigate = useNavigate();
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true);
  const [showNoAgentsAlert, setShowNoAgentsAlert] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const [scenarioLoadAlert, setScenarioLoadAlert] = useState(null);

  /* Canvas */
  const canvasRef = useRef(null);
  const ctxRef = useRef(null); // Ref to hold the canvas context
  const agentsArrayRef = useRef([]); // Ref to hold the internal agents array (used by animation loop & Agent constructor)
  const obstaclesArrayRef = useRef([]); // Ref to hold obstacle objects used by the animation loop
  const agentPreviewRef = useRef(null); // Draft single-agent preview drawn while creating an agent
  const obstaclePreviewRef = useRef(null); // Draft obstacle preview drawn over the canvas while creating
  const scenarioFileInputRef = useRef(null);

  const [targetFPS, setTargetFPS] = useState('30'); // Runtime frame-rate target, carried forward from the previous Simulation.
  const [simulationScale, setSimulationScale] = useState('large'); // Small and large modes control which creation UI is shown.
  const fpsRef = useRef(targetFPS); // Ref to hold the current FPS value, reference this value without the need of rendering
  const [maxSpeed, setMaxSpeed] = useState('3');
  const [maxAngle, setMaxAngle] = useState('45');
  const maxSpeedRef = useRef(maxSpeed);
  const maxAngleRef = useRef(maxAngle);

  // Simulation Play/Pause
  const [isSimulationRunning, setIsSimulationRunning] = useState(false); // State to track if the simulation is running or paused
  const isSimulationRunningRef = useRef(isSimulationRunning); // Ref to hold the current simulation running state, reference this value without the need of rendering

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
  const [selectedObstacle, setSelectedObstacle] = useState(null); // the live Obstacle object

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordWhenPlaying, setRecordWhenPlaying] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [recordingMessage, setRecordingMessage] = useState('');
  const hasRecording = recordings.length > 0;

  const isRecordingRef = useRef(false);
  const recordedFramesRef = useRef([]);
  const recordingStartTimeRef = useRef(0);
  const recordedFrameIndexRef = useRef(0);

  // ---- Handlers ----
  // ---- Recording Handlers ----
  function handleStartRecording() {
    if (agentsArrayRef.current.length === 0) {
      // Missing agents prevents both playback and recording, so surface it as a
      // critical alert instead of a dismissible inline status message.
      setShowNoAgentsAlert(true);
      return;
    }

    // Start from a clean recording buffer so a new take never mixes with old frames.
    recordedFramesRef.current = [];
    recordingStartTimeRef.current = performance.now();
    recordedFrameIndexRef.current = 0;

    // clean out recording message, update states
    setRecordingMessage('');
    setShowAddAgent(false);
    setShowAddMultipleAgents(false);
    setShowAddObstacle(false);
    setIsRecording(true);
    isRecordingRef.current = true;

    // Recording captures simulation frames, so starting a recording also starts
    // the simulation. Update the ref immediately so the next animation frame runs.
    setIsSimulationRunning(true);
    isSimulationRunningRef.current = true;
  }

  function handleStopRecording() {
    setRecordingMessage('');
    setIsRecording(false);
    isRecordingRef.current = false;

    // Package the captured frames with enough metadata for the playback window.
    setRecordings((currentRecordings) => [
      ...currentRecordings,
      {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
        name: `Recording ${currentRecordings.length + 1}`,
        createdAt: Date.now(),
        fps: fpsRef.current,
        canvas: {
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
        },
        frames: recordedFramesRef.current, // frames being recorded
      },
    ]);
  }

  function handleOpenPlayback(recording) {
    // Open the popup synchronously from the click so browser popup blockers allow
    // it. The popup performs its own Loading Screen → Playback transition.
    const loadingQuery = new URLSearchParams({
      from: 'Main Simulation',
      to: 'Playback',
      path: '/playback',
    });
    const recWin = window.open(
      `/loading?${loadingQuery.toString()}`,
      'AgentSimulationPlayback',
      'width=700,height=820'
    );
    // If no window, display error message
    if (!recWin) {
      setRecordingMessage('Playback window was blocked by the browser.');
      return;
    }

    // Wait until the playback page has registered window.loadRecording, then send this recording.
    const timer = window.setInterval(() => {
      if (recWin.closed) {
        window.clearInterval(timer);
        return;
      }

      if (typeof recWin.loadRecording === 'function') {
          recWin.loadRecording(recording);
          recWin.focus();
          window.clearInterval(timer);
      }
    }, 50);
  }

  function handleDownloadPlayback(recording) {
    // Convert the recording object into readable JSON text, then wrap it as file-like browser data.
    const blob = new Blob(
      [JSON.stringify(recording, null, 2)],
      { type: 'application/json' }
    );

    // Create a temporary URL that points to the in-memory JSON file.
    const url = URL.createObjectURL(blob);

    // Build a temporary download link and trigger it without adding visible UI.
    const link = document.createElement('a');
    link.href = url;
    link.download = `${recording.name.replace(/\s+/g, '_').toLowerCase()}.json`;
    link.click();

    // Release the temporary URL after the browser starts the download.
    URL.revokeObjectURL(url);
  }

  async function handleLoadScenario(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const scenario = await loadScenarioFile(file, {
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
        maxAgents: MAX_AGENTS,
      });
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) throw new Error('The simulation canvas is not ready.');

      // Keep the original roster array because the animation loop closes over it.
      const runtimeAgents = agentsArrayRef.current;
      runtimeAgents.length = 0;
      scenario.agents.forEach((agent) => {
        const heading = -agent.angle * Math.PI / 180;
        const runtimeAgent = new Agent(
          agent.showFOV,
          agent.x,
          agent.y,
          agent.radius,
          Math.cos(heading) * agent.speed,
          Math.sin(heading) * agent.speed,
          agent.colorHex,
          agent.fovRadius,
          agent.fovAngle * Math.PI / 180,
          heading,
          agent.id,
          agent.name,
          canvas,
          runtimeAgents
        );
        runtimeAgent.showFOV = agent.showFOV;
      });

      const runtimeObstacles = scenario.obstacles.map((obstacle) => (
        obstacle.shapeType === 'circle'
          ? Obstacle.createCircle(obstacle.id, obstacle.name, obstacle.center, obstacle.radius, obstacle.color)
          : Obstacle.createPolygon(obstacle.id, obstacle.name, obstacle.vertices, obstacle.color)
      ));
      obstaclesArrayRef.current.length = 0;
      obstaclesArrayRef.current.push(...runtimeObstacles);

      // A loaded scenario opens paused so users can inspect it before playback.
      setIsSimulationRunning(false);
      isSimulationRunningRef.current = false;
      setAgents([...runtimeAgents]);
      setObstacles([...runtimeObstacles]);
      setSelectedAgent(null);
      setSelectedObstacle(null);
      setShowAddAgent(false);
      setShowAddMultipleAgents(false);
      setShowAddObstacle(false);
      agentPreviewRef.current = null;
      obstaclePreviewRef.current = null;
      setScenarioLoadAlert({
        type: 'default',
        title: 'Scenario Loaded',
        primary: `Loaded ${runtimeAgents.length} agents and ${runtimeObstacles.length} obstacles.`,
        secondary: 'The simulation is paused so you can review the scenario before playing.',
      });
    } catch (error) {
      setScenarioLoadAlert({
        type: 'warning',
        title: 'Unable to Load Scenario',
        primary: error.message,
        secondary: 'Choose a valid scenario JSON file and try again.',
      });
    }
  }

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
    const presetBehaviors = getPresetBehaviorArray(presetData);
    const nextList = [...behaviorList];
    const loadedBehaviorIds = [];

    presetBehaviors.forEach((behavior) => {
      const loadedBehavior = createBehaviorFromPreset(behavior, nextList);
      nextList.push(loadedBehavior);
      loadedBehaviorIds.push(loadedBehavior.id);
    });

    setBehaviorList(nextList);
    // Collapse imported behaviors by default so large presets stay easy to scan.
    setCollapsedBehaviorIds((currentIds) => {
      const nextIds = new Set(currentIds);
      loadedBehaviorIds.forEach((behaviorId) => nextIds.add(behaviorId));
      return nextIds;
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
      targets: createDefaultFilterTargets(),
      filterType: 'method',
      propertyType: MEASUREMENT_TYPES.DISTANCE,
      methodType: METHOD_TYPES.CLOSEST,
      low: '',
      high: '',
    };
  }

  function createFilterFromPreset(filter) {
    return {
      id: createStableId(),
      targets: normalizeFilterTargets(filter.targets),
      filterType: filter.filterType === 'ranged' ? 'ranged' : 'method',
      propertyType: getValidValue(filter.propertyType ?? filter.filteredProperty, MEASUREMENT_TYPES, MEASUREMENT_TYPES.DISTANCE),
      methodType: getValidValue(filter.methodType, METHOD_TYPES, METHOD_TYPES.CLOSEST),
      low: filter.low ?? '',
      high: filter.high ?? '',
    };
  }

  function createDefaultFilterTargets() { // Default: select agent, deselect everyone else
    const targets = {};

    Object.values(ENTITY_TYPES).forEach((entityType) => {
      targets[entityType] = false;
    });

    targets[ENTITY_TYPES.AGENT] = true;
    targets[ENTITY_TYPES.OBSTACLE] = {
      enabled: false,
      [SHAPE_TYPES.CIRCLE]: true,
      [SHAPE_TYPES.POLYGON]: true,
    };

    return targets;
  }

  function normalizeFilterTargets(targets) {
    const defaults = createDefaultFilterTargets(); // create a filter
    if (!targets || typeof targets !== 'object') return defaults;

    // Resolving compatibility issues with older presets
    return {
      [ENTITY_TYPES.AGENT]: targets[ENTITY_TYPES.AGENT] ?? defaults[ENTITY_TYPES.AGENT], // If n
      [ENTITY_TYPES.OBSTACLE]: {
        enabled: targets[ENTITY_TYPES.OBSTACLE]?.enabled ?? defaults[ENTITY_TYPES.OBSTACLE].enabled,
        [SHAPE_TYPES.CIRCLE]: targets[ENTITY_TYPES.OBSTACLE]?.[SHAPE_TYPES.CIRCLE] ?? defaults[ENTITY_TYPES.OBSTACLE][SHAPE_TYPES.CIRCLE],
        [SHAPE_TYPES.POLYGON]: targets[ENTITY_TYPES.OBSTACLE]?.[SHAPE_TYPES.POLYGON] ?? defaults[ENTITY_TYPES.OBSTACLE][SHAPE_TYPES.POLYGON],
      },
      ...Object.fromEntries(
        Object.values(ENTITY_TYPES)
          .filter((entityType) => entityType !== ENTITY_TYPES.AGENT && entityType !== ENTITY_TYPES.OBSTACLE)
          .map((entityType) => [entityType, targets[entityType] ?? defaults[entityType]])
      ),
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

  // Simulation Play/Pause
  useEffect(() => {
    isSimulationRunningRef.current = isSimulationRunning; // Update the ref whenever isSimulationRunning state changes
  }, [isSimulationRunning]);

  function toggleSimulationRunning() {
    if (isSimulationRunning) {
      // Pause immediately. If automatic recording is active, stopping playback
      // also packages and saves the frames captured during this run.
      setIsSimulationRunning(false);
      isSimulationRunningRef.current = false;
      if (recordWhenPlaying && isRecordingRef.current) handleStopRecording();
      return;
    }

    if (recordWhenPlaying) {
      // The recording handler validates that agents exist and starts both the
      // recorder and simulation, keeping their start times synchronized.
      handleStartRecording();
      return;
    }

    if (agentsArrayRef.current.length === 0) {
      setShowNoAgentsAlert(true);
      return;
    }

    // Normal playback without recording.
    setIsSimulationRunning(true);
    isSimulationRunningRef.current = true;
  }

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

    configureHighDpiCanvas(canvas, ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Array to hold all agents
    const agentsArray = [];
    agentsArrayRef.current = agentsArray; // Store in ref for access outside useEffect

    // Update state with agents for the control panel
    setAgents(agentsArray);

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
        obstaclesArrayRef.current.forEach(obstacle => obstacle.draw(ctx));
        drawObstaclePreview(ctx, obstaclePreviewRef.current);
        drawAgentPreview(ctx, agentPreviewRef.current);

        // Always read the current roster from the ref. Entity editing can change
        // the roster after this animation effect is created, so closing over the
        // initial agentsArray would leave the canvas drawing a stale list.
        const runtimeAgents = agentsArrayRef.current;

        if (isSimulationRunningRef.current) {
          // Only advance positions and behaviors while the simulation is playing.
          const allEntities = [...runtimeAgents, ...obstaclesArrayRef.current];
          allEntities.forEach(entity => entity.move(CANVAS_WIDTH, CANVAS_HEIGHT, maxSpeedRef.current));
          runtimeAgents.forEach(agent => {
            // Snapshot motion before behavior so neighbor-reference rules do not
            // read speeds/headings already changed earlier in the same frame.
            agent.runtimeState.behaviorVelocity = { ...agent.velocity };
            agent.runtimeState.behaviorRotation = agent.transform.rotation;
          });
          const decisions = runtimeAgents.map((agent) =>
            agent.calculateDecision(
              allEntities,
              behaviorListRef.current,
              maxSpeedRef.current,
              maxAngleRef.current
            )
          );
          runtimeAgents.forEach((agent, index) => {
            agent.applyDecision(decisions[index]);
          });

          // Record only frames in which the simulation actually advanced.
          if (isRecordingRef.current) {
            recordedFramesRef.current.push(
              createFrameSnapshot(
                runtimeAgents,
                obstaclesArrayRef.current,
                recordedFrameIndexRef.current,
                recordingStartTimeRef.current
              )
            );
            recordedFrameIndexRef.current += 1;
          }
        }

        runtimeAgents.forEach(agent => agent.draw(ctx));
      }
    }
    animate(0);

    return () => cancelAnimationFrame(animationId);
  }, []);

  // ---- Canvas Interaction Handlers ----
  function handleCanvasClick(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Scale click coords to match the logical simulation size.
    const point = getCanvasPointFromEvent(e, canvas);

    // Find the topmost Entity in the same order used to draw the canvas.
    const clicked = findRuntimeEntityAt(point, [
      ...obstaclesArrayRef.current,
      ...agentsArrayRef.current,
    ]);

    if (clicked?.entityType === ENTITY_TYPES.AGENT) {
      setSelectedAgent(clicked);
      setSelectedObstacle(null);
      return;
    }

    // Obstacle clicks use the same selection state as the Obstacle List edit button.
    // This only selects for editing; live simulation intentionally does not support dragging.
    if (clicked?.entityType === ENTITY_TYPES.OBSTACLE) {
      selectObstacleForEditing(clicked);
    }
  }

  function getAgentColor(agent) {
    return agent.colorHex ?? agent.originalColor ?? agent.color ?? '#000000';
  }

  function getObstacleColor(obstacle) {
    return obstacle.color ?? '#ACAD9D';
  }

  function selectAgentForEditing(agent) {
    setSelectedAgent(agent);
    setSelectedObstacle(null);
  }

  function selectObstacleForEditing(obstacle) {
    setSelectedObstacle(obstacle);
    setSelectedAgent(null);
  }

  function clearSelectedEntity() {
    setSelectedAgent(null);
    setSelectedObstacle(null);
  }

  function handleApplyAgentEdits({ name, color, showFOV, fovAngle }) {
    if (!selectedAgent) return;

    selectedAgent.name = name;
    selectedAgent.originalColor = color;
    selectedAgent.colorHex = color;
    selectedAgent.showFOV = showFOV;
    selectedAgent.isSpecial = showFOV; // isSpecial gates FOV drawing in agent.js — must stay in sync with showFOV
    const parsedFovAngle = Number(fovAngle);
    selectedAgent.fovAngle = (fovAngle === '' || !Number.isFinite(parsedFovAngle) ? 150 : parsedFovAngle) * Math.PI / 180;
    setAgents([...agentsArrayRef.current]);
  }

  // Delete selected agent workflow:
  // EntityEditor calls this from the "Delete Agent" button. The live simulation
  // loop reads agentsArrayRef.current, so we remove from the ref first, then
  // refresh React state and clear the current editor selection.
  function requestDeleteSelectedAgent() {
    if (!selectedAgent) return;

    setPendingDeletion({ type: 'agent', target: selectedAgent, name: selectedAgent.name });
  }

  function handleDeleteSelectedAgent(agentToDelete) {
    if (!agentToDelete) return;

    // Preserve the roster array identity shared by the canvas and Agent
    // instances. Replacing the ref with filter() can split the UI and runtime
    // onto different arrays.
    const roster = agentsArrayRef.current;
    const agentIndex = roster.indexOf(agentToDelete);
    if (agentIndex !== -1) roster.splice(agentIndex, 1);
    setAgents([...roster]);
    setSelectedAgent(null);
  }

  function handleApplyObstacleEdits(updates) {
    if (!selectedObstacle) return;

    selectedObstacle.name = updates.name;
    selectedObstacle.color = updates.color;

    if (selectedObstacle.shapes[0].type === SHAPE_TYPES.CIRCLE) {
      selectedObstacle.transform.position = updates.center;
      selectedObstacle.shapes[0].radius = updates.radius;
    } else {
      const updatedObstacle = Obstacle.createPolygon(
        selectedObstacle.id,
        selectedObstacle.name,
        updates.vertices,
        selectedObstacle.color
      );
      selectedObstacle.transform = updatedObstacle.transform;
      selectedObstacle.shapes = updatedObstacle.shapes;
    }

    setObstacles([...obstaclesArrayRef.current]);
  }

  function requestDeleteSelectedObstacle() {
    if (!selectedObstacle) return;

    setPendingDeletion({
      type: 'obstacle',
      target: selectedObstacle,
      name: selectedObstacle.name,
    });
  }

  function handleDeleteSelectedObstacle(obstacleToDelete) {
    if (!obstacleToDelete) return;

    obstaclesArrayRef.current = obstaclesArrayRef.current.filter((obstacle) => obstacle !== obstacleToDelete);
    setObstacles([...obstaclesArrayRef.current]);
    setSelectedObstacle(null);
  }

  function handleConfirmDeletion() {
    if (!pendingDeletion) return;

    // Perform the destructive mutation only after the critical alert is confirmed.
    if (pendingDeletion.type === 'agent') {
      handleDeleteSelectedAgent(pendingDeletion.target);
    } else if (pendingDeletion.type === 'all-agents') {
      agentsArrayRef.current.length = 0;
      setAgents([]);
      setSelectedAgent(null);
    } else if (pendingDeletion.type === 'obstacle') {
      handleDeleteSelectedObstacle(pendingDeletion.target);
    } else if (pendingDeletion.type === 'all-obstacles') {
      obstaclesArrayRef.current.length = 0;
      setObstacles([]);
      setSelectedObstacle(null);
    }

    setPendingDeletion(null);
  }

  function getDeletionAlertContent() {
    if (!pendingDeletion) return null;

    if (pendingDeletion.type === 'agent') {
      return {
        title: 'Delete This Agent?',
        primary: `Are you sure you want to delete “${pendingDeletion.name}”?`,
        secondary: 'This action cannot be undone.',
      };
    }
    if (pendingDeletion.type === 'all-agents') {
      return {
        title: 'Delete All Agents?',
        primary: `Are you sure you want to delete all ${pendingDeletion.count} agents?`,
        secondary: 'This action cannot be undone.',
      };
    }
    if (pendingDeletion.type === 'obstacle') {
      return {
        title: 'Delete This Obstacle?',
        primary: `Are you sure you want to delete “${pendingDeletion.name}”?`,
        secondary: 'This action cannot be undone.',
      };
    }
    if (pendingDeletion.type === 'all-obstacles') {
      return {
        title: 'Delete All Obstacles?',
        primary: `Are you sure you want to delete all ${pendingDeletion.count} obstacles?`,
        secondary: 'This action cannot be undone.',
      };
    }
  }

  const deletionAlertContent = getDeletionAlertContent();

  // Main Simulation
  return (
    <div className="simulation-page">
        {showWelcomeAlert && (
          <AlertBox
            title="You’re Using the Stable Simulation"
            primMessage="This is the current stable version of the Main Simulation and remains fully available while we work on the next generation."
            secMessage={(
              <>
                A redesigned simulation experience is underway. In the meantime, you can continue working here as usual.{' '}
                <Link
                  to="/loading"
                  state={{ from: 'Main Simulation', to: 'Tutorial', path: '/tutorial' }}
                >View the tutorial.</Link>
              </>
            )}
            confirmLabel="Continue"
            cancelLabel="Close"
            permanentDismiss
            dismissStorageKey="simulation-2nd-gen-notice-dismissed"
            onConfirm={() => setShowWelcomeAlert(false)}
            onCancel={() => setShowWelcomeAlert(false)}
          />
        )}
        
        {showNoAgentsAlert && (
          <AlertBox
            title="No Agents Found!"
            primMessage="Create at least one agent before starting the simulation or recording."
            secMessage="Use Agent Configuration to add an agent, then try again."
            type="warning"
            confirmLabel="Got It"
            cancelLabel="Close"
            onConfirm={() => setShowNoAgentsAlert(false)}
            onCancel={() => setShowNoAgentsAlert(false)}
          />
        )}
        {pendingDeletion && deletionAlertContent && (
          <AlertBox
            title={deletionAlertContent.title}
            primMessage={deletionAlertContent.primary}
            secMessage={deletionAlertContent.secondary}
            type="danger"
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={handleConfirmDeletion}
            onCancel={() => setPendingDeletion(null)}
          />
        )}
        {scenarioLoadAlert && (
          <AlertBox
            title={scenarioLoadAlert.title}
            primMessage={scenarioLoadAlert.primary}
            secMessage={scenarioLoadAlert.secondary}
            type={scenarioLoadAlert.type}
            confirmLabel="OK"
            cancelLabel="Close"
            onConfirm={() => setScenarioLoadAlert(null)}
            onCancel={() => setScenarioLoadAlert(null)}
          />
        )}
        <Header title="Main Simulation" />
        <div className="simulation-container">
          {/*Canvas Section*/}
          <div className="canvas-section">
            <canvas
              ref={canvasRef}
              className={`simulation-canvas ${isRecording ? 'simulation-canvas-recording' : ''}`}
              onClick={handleCanvasClick}
            ></canvas>
          </div>
          {/*Control Panel*/}
          <div className="control-panel simulation-control-panel">
            <div className="simulation-panel-topbar">
              <button className="btn-secondary scenario-home-button icon-button" onClick={() => navigate('/loading', {
                state: { from: 'Main Simulation', to: 'Home Page', path: '/' },
              })}>
                <ArrowLeft className="button-icon" size={16} aria-hidden="true" />
                Home
              </button>
              <h2 className="simulation-dashboard-title">Control Panel</h2>
            </div>
            
              <div className="panel-card">
              <h2 className="panel-section-title title-with-icon">
                <UserCog className="section-title-icon" size={18} aria-hidden="true" />
                Agent Configuration
              </h2>

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
                  <button className="btn-primary icon-button" disabled={isRecording || showAddAgent || showAddMultipleAgents} onClick={() => setShowAddAgent(true)}>
                    <SquarePlus className="button-icon" size={16} aria-hidden="true" />
                    Create an Agent
                  </button>
              </div>
              )}
              {simulationScale === 'large' && (
              <div className = "input-group">
                <label htmlFor="agent-count-input">Click here to add multiple agents at once:</label>
                <button className="btn-primary icon-button" disabled={isRecording || showAddAgent || showAddMultipleAgents} onClick={() => setShowAddMultipleAgents(true)}>
                  <CopyPlus className="button-icon" size={16} aria-hidden="true" />
                  Create Multiple Agents
                </button>
              </div>
              )}

              {agents.length > 0 && (
                <div className="input-group">
                  <button
                    className="btn-danger"
                    disabled={isRecording}
                    onClick={() => setPendingDeletion({ type: 'all-agents', count: agentsArrayRef.current.length })}
                  >Delete All Agents</button>
                </div>
              )}

              {/* Agent List */}
              <div className="agents-list-container">
                <label>Agent List</label>
                <button
                  className="agents-list-toggle"
                  onClick={() => setAgentsListExpanded(!agentsListExpanded)}
                >
                  <span>{agents.length} {agents.length == 1 ? 'Agent' : 'Agents'}</span>
                  <span className="toggle-label">
                    {agentsListExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                  </span>
                </button>
                {agentsListExpanded && (
                  <ul className="agents-list">
                    {agents.map((agent, index) => (
                      <li key={index} className="agent-item">
                        <span className="agent-color" style={{ backgroundColor: getAgentColor(agent) }}></span>
                        <span className="agent-item-label">{agent.name}</span>
                        <button className="btn-primary agent-list-edit-button" onClick={() => selectAgentForEditing(agent)}>
                          Edit
                        </button>
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
                agentsArrayRef={agentsArrayRef}
                agentPreviewRef={agentPreviewRef}
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={CANVAS_HEIGHT}
                maxAgents={MAX_AGENTS}
                onAgentAdded={(updatedRoster) => setAgents(updatedRoster)}
                onClose={() => {
                  agentPreviewRef.current = null;
                  setShowAddAgent(false);
                }}
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

            {/* Obstacle Dashboard */}
            <div className="panel-card">
              <h2 className="panel-section-title title-with-icon">
                <Blocks className="section-title-icon" size={18} aria-hidden="true" />
                Obstacle Configuration
              </h2>

              <div className="input-group">
                <button className="btn-primary icon-button" disabled={isRecording || showAddObstacle} onClick={() => setShowAddObstacle(true)}>
                  <SquarePlus className="button-icon" size={16} aria-hidden="true" />
                  Create Obstacle
                </button>
              </div>

              {obstacles.length > 0 && (
                <div className="input-group">
                  <button
                    className="btn-danger"
                    disabled={isRecording}
                    onClick={() => setPendingDeletion({ type: 'all-obstacles', count: obstaclesArrayRef.current.length })}
                  >Delete All Obstacles</button>
                </div>
              )}

              <div className="agents-list-container">
                <label>Obstacle List</label>
                <button
                  className="agents-list-toggle"
                  onClick={() => setObstaclesListExpanded(!obstaclesListExpanded)}
                >
                  <span>{obstacles.length} {obstacles.length === 1 ? 'Obstacle' : 'Obstacles'}</span>
                  <span className="toggle-label">
                    {obstaclesListExpanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                  </span>
                </button>
                {obstaclesListExpanded && (
                  <ul className="agents-list">
                    {obstacles.map((obstacle, index) => (
                      <li key={`${obstacle.id}-${index}`} className="agent-item">
                        <span className="agent-color" style={{ backgroundColor: getObstacleColor(obstacle) }}></span>
                        <span className="agent-item-label">
                          {obstacle.name} ({obstacle.shapes[0].type === SHAPE_TYPES.CIRCLE ? 'Circle' : 'Polygon'})
                        </span>
                        <button className="btn-primary agent-list-edit-button" onClick={() => selectObstacleForEditing(obstacle)}>
                          Edit
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <EntityEditor
              selectedEntity={
                selectedAgent
                  ? { type: 'agent', entity: selectedAgent }
                  : selectedObstacle
                    ? { type: 'obstacle', entity: selectedObstacle }
                    : null
              }
              canvasWidth={CANVAS_WIDTH}
              canvasHeight={CANVAS_HEIGHT}
              onApplyAgent={handleApplyAgentEdits}
              onApplyObstacle={handleApplyObstacleEdits}
              onDeleteAgent={requestDeleteSelectedAgent}
              onDeleteObstacle={requestDeleteSelectedObstacle}
              onDeselect={clearSelectedEntity}
            />

            {showAddObstacle && (
              <ObstacleCard
                obstaclesArrayRef={obstaclesArrayRef}
                obstaclePreviewRef={obstaclePreviewRef}
                canvasWidth={CANVAS_WIDTH}
                canvasHeight={CANVAS_HEIGHT}
                onObstaclesChanged={(updatedObstacles) => setObstacles(updatedObstacles)}
                onClose={() => {
                  obstaclePreviewRef.current = null;
                  setShowAddObstacle(false);
                }}
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
              <h2 className="panel-section-title title-with-icon">
                <Settings className="section-title-icon" size={18} aria-hidden="true" />
                Simulation Configuration
              </h2>
              <div className="simulation-section-divider">
                <span>Environment Setup</span>
              </div>
              <div className="environment-config-options">
                <div className="input-group">
                  <input
                    ref={scenarioFileInputRef}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={handleLoadScenario}
                  />
                  <button
                    className="btn-secondary icon-button"
                    type="button"
                    disabled={isRecording}
                    onClick={() => scenarioFileInputRef.current?.click()}
                  >
                    <FileUp className="button-icon" size={17} aria-hidden="true" />
                    Load Scenario Configuration
                  </button>
                </div>
                <div className="environment-option-connector">
                  <span>Don't have a configuration? Build your own below</span>
                </div>
                <div className="input-group">
                  <button
                    className="btn-secondary icon-button"
                    type="button"
                    disabled={isRecording}
                    onClick={() => navigate('/loading', {
                      state: {
                        from: 'Main Simulation',
                        to: 'Scenario Builder',
                        path: '/scenario-builder',
                      },
                    })}
                  >
                    <MousePointer2 className="button-icon" size={17} aria-hidden="true" />
                    Open Scenario Builder
                  </button>
                </div>
              </div>
              <div className="simulation-section-divider">
                <span>Play/Pause Simulation</span>
              </div>
              <div className="simulation-control-options">
                <div className="simulation-status-row">
                  <span className="simulation-status-label">STATUS:</span>
                  <span className={`simulation-status-badge ${isSimulationRunning ? 'playing' : 'paused'}`}>
                    {isSimulationRunning ? 'PLAYING' : 'PAUSED'}
                  </span>
                </div>
                <div className="input-group">
                  <button
                    className={`${isSimulationRunning ? 'btn-secondary' : 'btn-primary'} icon-button`}
                    type="button"
                    disabled={isRecording && !recordWhenPlaying}
                    onClick={toggleSimulationRunning}
                  >
                    {isSimulationRunning ? (
                      <Pause className="button-icon" size={17} fill="currentColor" aria-hidden="true" />
                    ) : (
                      <Play className="button-icon" size={17} fill="currentColor" aria-hidden="true" />
                    )}
                    {isSimulationRunning ? 'Pause Simulation' : 'Play Simulation'}
                  </button>
                </div>
                <label className="simulation-record-option">
                  <input
                    type="checkbox"
                    checked={recordWhenPlaying}
                    disabled={isSimulationRunning || isRecording}
                    onChange={(event) => setRecordWhenPlaying(event.target.checked)}
                  />
                  <span>Record when playing</span>
                </label>
              </div>
              <div className="simulation-section-divider">
                <span>Performance Settings</span>
              </div>
              <div className="input-group">
                <label htmlFor="fps-input">FPS (Frames Per Second)</label>
                <input
                  type="number"
                  id="fps-input"
	                  min="1"
	                  max="60"
	                  value={targetFPS}
                    disabled={isRecording}
	                  onChange={(e) => setTargetFPS(e.target.value)}
	                  onBlur={(e) => { if (e.target.value === '') setTargetFPS('1');}} // default to 1 when empty on blur (lose focus)
	                />
              </div>

            </div>

            <RecordingCard
              isRecording={isRecording}
              hasRecording={hasRecording}
              recordings={recordings}
              message={recordingMessage}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onOpenPlayback={handleOpenPlayback}
              onDownloadRecording={handleDownloadPlayback}
            />

            <MiscPanel />
            
          </div>
        </div>
        <Footer />
    </div>
  );
}

export default Simulation2ndGen;
