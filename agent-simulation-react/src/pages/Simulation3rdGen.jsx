import Header from "../components/simulation-3rd-gen/Header3rdGen.jsx";
import Inspector from "../components/simulation-3rd-gen/Inspector.jsx";
import RuntimeControlCard from "../components/simulation-3rd-gen/RuntimeControlCard.jsx";
import SimulationExplorer from "../components/simulation-3rd-gen/SimulationExplorer.jsx";
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
import styles from '../styles/3rd-gen/simulation.module.css';
import { useRef, useEffect, useState } from 'react'; /* To interact with the canvas we have to use useRef and useEffect*/

// Import Agent Class from agent.js (make them talk to each other)
import { Agent } from "../models/agent.js";
import { CircleObstacle, PolygonObstacle } from "../models/obstacle.js";
import { TARGET_PROPERTIES, METHOD_TYPES, MEASUREMENT_TYPES, REFERENCE_TYPES, ENTITY_TYPES, OBSTACLE_SHAPE_TYPES, PROPERTY_LABELS, EXPLORER_TABS } from "../utils/constants.js";
import { configureHighDpiCanvas, createEntityID, getCanvasLogicalHeight, getCanvasLogicalWidth, getCanvasPointFromEvent, isPointInsidePolygon, isPointNearPolygonEdge, resetScenario, storeScenarioInformation } from "../utils/utilities.js";
import { loadScenarioFile } from "../utils/scenarioLoader.js";
import {
  createDefaultActivation,
  normalizeActivationDraft,
} from "../models/activation.js";
import {
  BEHAVIOR_GROUP_DEFINITIONS,
  getBehaviorGroupKey,
  groupBehaviors,
} from "../utils/behaviorGroups.js";

// This is amenable as of now, don't forget to change the dimensions in the CSS file as well if you change these
const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

const MAX_AGENTS = 500; // Maximum number of agents allowed on the canvas at once
const MAX_SNAPSHOTS = 10;

// NEW 3rd Generation Imports
import { INSPECTOR_MODES } from "../components/simulation-3rd-gen/inspector/modeConstants.js"; // Inspector DISPLAY MODES

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// Parse and validate form strings before either previewing or creating agents.
function normalizeAgentCreationConfig(values) {
  const config = {
    count: Number(values.count),
    xMin: Number(values.xMin),
    xMax: Number(values.xMax),
    yMin: Number(values.yMin),
    yMax: Number(values.yMax),
    speedMin: Number(values.speedMin),
    speedMax: Number(values.speedMax),
    angleMin: Number(values.angleMin),
    angleMax: Number(values.angleMax),
    color: values.color,
    showFOV: Boolean(values.showFOV),
  };

  const numericValues = [
    config.count,
    config.xMin,
    config.xMax,
    config.yMin,
    config.yMax,
    config.speedMin,
    config.speedMax,
    config.angleMin,
    config.angleMax,
  ];

  if (!numericValues.every(Number.isFinite)) {
    throw new Error('Complete every numeric Agent field.');
  }
  if (!Number.isInteger(config.count) || config.count < 1) {
    throw new Error('Number of Agents must be a whole number greater than zero.');
  }
  if (config.xMin < 0 || config.xMax > CANVAS_WIDTH || config.xMin > config.xMax) {
    throw new Error(`X spawn range must stay between 0 and ${CANVAS_WIDTH}, with Min no greater than Max.`);
  }
  if (config.yMin < 0 || config.yMax > CANVAS_HEIGHT || config.yMin > config.yMax) {
    throw new Error(`Y spawn range must stay between 0 and ${CANVAS_HEIGHT}, with Min no greater than Max.`);
  }
  if (config.speedMin < 0 || config.speedMin > config.speedMax) {
    throw new Error('Initial Speed Min must be non-negative and no greater than Max.');
  }
  if (config.angleMin > config.angleMax) {
    throw new Error('Initial Angle Min cannot be greater than Max.');
  }

  return config;
}

// Pure randomization step shared by Regenerate Preview and Create Agents.
function generateRandomizedAgentDrafts(config, obstacles) {
  return Array.from({ length: config.count }, () => {
    const angleDegrees = randomBetween(config.angleMin, config.angleMax);
    const angle = -angleDegrees * Math.PI / 180;
    const speed = randomBetween(config.speedMin, config.speedMax);
    let position = null;

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const candidate = {
        x: randomBetween(config.xMin, config.xMax),
        y: randomBetween(config.yMin, config.yMax),
      };

      // Keep a legal position immediately; only blocked positions are rerolled.
      if (!findObstacleAt(candidate, obstacles)) {
        position = candidate;
        break;
      }
    }

    // Stop instead of freezing when the selected area is fully blocked.
    if (!position) {
      throw new Error('Unable to place all Agents outside Obstacles.');
    }

    return {
      x: position.x,
      y: position.y,
      radius: 5,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      speed,
      angle,
      color: config.color,
      fovRadius: 100,
      fovAngle: 150 * Math.PI / 180,
      showFOV: config.showFOV,
    };
  });
}

function getAgentCreationConfigKey(config) {
  return JSON.stringify(config);
}

// Build one predictable document before the browser turns it into a file.
function buildBehaviorExportDocument(behaviors) {
  return {
    version: 1,
    behaviors: behaviors.map((behavior) => ({
      ...behavior,
      // Rebuild by type so fields from an old Activation type cannot leak out.
      activation: normalizeActivationDraft(
        behavior.activation ?? createDefaultActivation()
      ),
    })),
  };
}

// Preview and Create use the same obstacle geometry checks.
function normalizeObstacleFormValues(values) {
  const common = {
    name: (values.name ?? '').trim(),
    color: values.color,
  };

  if (values.shape === 'circle') {
    const center = {
      x: Number(values.centerX),
      y: Number(values.centerY),
    };
    const radius = Number(values.radius);

    if (!Number.isFinite(center.x) || !Number.isFinite(center.y)) {
      throw new Error('Circle Center X and Y must be valid numbers.');
    }
    if (!Number.isFinite(radius) || radius <= 0) {
      throw new Error('Circle Radius must be greater than zero.');
    }
    if (
      center.x - radius < 0 ||
      center.x + radius > CANVAS_WIDTH ||
      center.y - radius < 0 ||
      center.y + radius > CANVAS_HEIGHT
    ) {
      throw new Error('The circle must fit completely inside the canvas.');
    }

    return {
      ...common,
      shapeType: OBSTACLE_SHAPE_TYPES.CIRCLE,
      center,
      radius,
    };
  }

  if (!Array.isArray(values.vertices) || values.vertices.length < 3) {
    throw new Error('A polygon needs at least three vertices.');
  }

  const vertices = values.vertices.map((vertex, index) => {
    const x = Number(vertex.x);
    const y = Number(vertex.y);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`Vertex ${index + 1} needs valid X and Y values.`);
    }
    if (x < 0 || x > CANVAS_WIDTH || y < 0 || y > CANVAS_HEIGHT) {
      throw new Error(`Vertex ${index + 1} must stay inside the canvas.`);
    }

    return { x, y };
  });

  return {
    ...common,
    shapeType: OBSTACLE_SHAPE_TYPES.POLYGON,
    vertices,
  };
}

// Capture one JSON-friendly frame. Playback can redraw from this data without running behavior again.
function createFrameSnapshot(agentsArray, obstaclesArray, frameIndex, recordingStartTime) {
  return {
    frameIndex,
    timestamp: performance.now() - recordingStartTime,
    agents: agentsArray.map((agent) => ({
      id: agent.id,
      name: agent.name,
      x: agent.position.x,
      y: agent.position.y,
      radius: agent.radius,
      dx: agent.dx,
      dy: agent.dy,
      angle: agent.angle,
      colorHex: agent.colorHex,
      fovRadius: agent.fovRadius,
      fovAngle: agent.fovAngle,
      // Store the final visual FOV decision, matching Agent.draw().
      showFOV: agent.isSpecial && agent.showFOV !== false,
    })),
    obstacles: obstaclesArray.map((obstacle) => ({
      id: obstacle.id,
      name: obstacle.name,
      shapeType: obstacle.shapeType,
      color: obstacle.color,
      center: obstacle.center
        ? { x: obstacle.center.x, y: obstacle.center.y }
        : null,
      radius: obstacle.radius,
      vertices: Array.isArray(obstacle.vertices)
        ? obstacle.vertices.map((vertex) => ({ x: vertex.x, y: vertex.y }))
        : [],
    })),
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

  if (preview.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE) {
    ctx.beginPath();
    ctx.arc(preview.center.x, preview.center.y, preview.radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (preview.shapeType === OBSTACLE_SHAPE_TYPES.POLYGON && preview.vertices.length >= 3) {
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

function findObstacleAt(point, obstacles) {
  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = obstacles[i];

    if (obstacle.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE) {
      if (Math.hypot(point.x - obstacle.center.x, point.y - obstacle.center.y) <= obstacle.radius + 4) {
        return obstacle;
      }
    } else if (
      isPointInsidePolygon(point, obstacle.vertices) ||
      isPointNearPolygonEdge(point, obstacle.vertices)
    ) {
      return obstacle;
    }
  }

  return null;
}

function Simulation3rdGen() {
  const navigate = useNavigate();
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true);
  const [showNoAgentsAlert, setShowNoAgentsAlert] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(null);
  const [scenarioLoadAlert, setScenarioLoadAlert] = useState(null);
  const [scenarioName, setScenarioName] = useState('Untitled Scenario');

  /* Canvas */
  const canvasRef = useRef(null);
  const ctxRef = useRef(null); // Ref to hold the canvas context
  const agentsArrayRef = useRef([]); // Ref to hold the internal agents array (used by animation loop & Agent constructor)
  const obstaclesArrayRef = useRef([]); // Ref to hold obstacle objects used by the animation loop
  const agentPreviewRef = useRef([]); // Randomized drafts shown before they enter the live roster.
  const agentPreviewConfigKeyRef = useRef('');
  const obstaclePreviewRef = useRef(null); // Draft obstacle preview drawn over the canvas while creating
  const scenarioFileInputRef = useRef(null);
  const behaviorPresetFileInputRef = useRef(null);
  const dragRef = useRef(null); // Ref to hold the current drag state (null if not dragging)
  const lookAtAgentRef = useRef(null); // Double-clicked Agent that currently follows the cursor.

  const [targetFPS, setTargetFPS] = useState('30'); // State to hold the target FPS, initially set to 24
  const [simulationScale, setSimulationScale] = useState('large'); // State to hold the simulation scale (small or large), default to small
  const fpsRef = useRef(targetFPS); // Ref to hold the current FPS value, reference this value without the need of rendering
  const [maxSpeed, setMaxSpeed] = useState('3');
  const [maxAngle, setMaxAngle] = useState('45');
  const [smoothingFactor, setSmoothingFactor] = useState('0.15');
  const maxSpeedRef = useRef(maxSpeed);
  const maxAngleRef = useRef(maxAngle);
  const smoothingFactorRef = useRef(smoothingFactor);

  // Simulation Play/Pause
  const [isSimulationRunning, setIsSimulationRunning] = useState(false); // State to track if the simulation is running or paused
  const isSimulationRunningRef = useRef(isSimulationRunning); // Ref to hold the current simulation running state, reference this value without the need of rendering

  const [agents, setAgents] = useState([]); // State to hold agents for display in the control panel
  const [agentsListExpanded, setAgentsListExpanded] = useState(false); // State to toggle agents list visibility
  const [obstacles, setObstacles] = useState([]); // State to hold obstacles for display in the control panel
  const [obstaclesListExpanded, setObstaclesListExpanded] = useState(false); // State to toggle obstacles list visibility

  // Keep this here so creation handlers can reveal their new Explorer entry.
  const [explorerTab, setExplorerTab] = useState(EXPLORER_TABS.ENTITIES);

  // Adding Agent States
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showAddMultipleAgents, setShowAddMultipleAgents] = useState(false);
  const [showAddObstacle, setShowAddObstacle] = useState(false);

  // Behavior & Filter settings state & Ref
  const [behaviorList, setBehaviorList] = useState([]); // Behavior
  const [collapsedBehaviorIds, setCollapsedBehaviorIds] = useState(new Set());
  const behaviorGroupsRef = useRef(groupBehaviors([], true));

  // Agent editor state
  const [selectedAgent, setSelectedAgent] = useState(null); // the live Agent object
  const [selectedAgentWeights, setSelectedAgentWeights] = useState([]);
  const [selectedObstacle, setSelectedObstacle] = useState(null); // the live Obstacle object
  const [selectedBehavior, setSelectedBehavior] = useState(null); // the saved Behavior draft source

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordWhenPlaying, setRecordWhenPlaying] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [recordingMessage, setRecordingMessage] = useState('');
  const hasRecording = recordings.length > 0;

  const isRecordingRef = useRef(false);
  const recordedFramesRef = useRef([]);
  const recordingStartTimeRef = useRef(0);
  const recordedFrameIndexRef = useRef(0);
  const hasInitialSnapshotRef = useRef(false);

  // Inspector State
  const [inspectorMode, setInspectorMode] = useState({
    mode: INSPECTOR_MODES.EMPTY,
  });
  const previousInspectorModeRef = useRef({
    mode: INSPECTOR_MODES.EMPTY,
  });

  const isRuntimeSettingsOpen =
    inspectorMode.mode === INSPECTOR_MODES.RUNTIME_SETTINGS;

  useEffect(() => {
    if (!selectedAgent) {
      setSelectedAgentWeights([]);
      return undefined;
    }

    // The Agent calculates every frame; React only copies the latest numbers
    // 10 times per second so this small monitor stays lightweight.
    const updateWeights = () => {
      setSelectedAgentWeights(
        Object.values(selectedAgent.activeBehaviorGroups ?? {}).flat()
      );
    };

    updateWeights();
    const timer = window.setInterval(updateWeights, 100);
    return () => window.clearInterval(timer);
  }, [selectedAgent]);

  function toggleRuntimeSettings() {
    if (isRuntimeSettingsOpen) {
      setInspectorMode(previousInspectorModeRef.current);
      return;
    }

    previousInspectorModeRef.current = inspectorMode;
    setInspectorMode({ mode: INSPECTOR_MODES.RUNTIME_SETTINGS });
  }

  function applyRuntimeSettings(settings) {
    const nextFPS = Number(settings.targetFPS);
    const nextMaxSpeed = Number(settings.maximumSpeed);
    const nextMaxAngle = Number(settings.maximumTurnAngle);
    const nextSmoothingFactor = Number(settings.smoothingFactor);

    if (Number.isFinite(nextFPS) && nextFPS >= 1) {
      setTargetFPS(String(nextFPS));
    }

    if (Number.isFinite(nextMaxSpeed) && nextMaxSpeed >= 0) {
      setMaxSpeed(String(nextMaxSpeed));
    }

    if (Number.isFinite(nextMaxAngle) && nextMaxAngle >= 0) {
      setMaxAngle(String(nextMaxAngle));
    }

    if (
      Number.isFinite(nextSmoothingFactor) &&
      nextSmoothingFactor >= 0.05 &&
      nextSmoothingFactor <= 1
    ) {
      setSmoothingFactor(String(nextSmoothingFactor));
    }

    // Applying is an explicit commit, then return to the Inspector view that
    // was open before Runtime Settings.
    setInspectorMode(previousInspectorModeRef.current);
  }

  function clearAgentCreationPreview() {
    agentPreviewRef.current = [];
    agentPreviewConfigKeyRef.current = '';
  }

  function handleRegenerateAgentPreview(values) {
    try {
      const config = normalizeAgentCreationConfig(values);
      const remainingCapacity = MAX_AGENTS - agentsArrayRef.current.length;

      if (config.count > remainingCapacity) {
        throw new Error(`Only ${remainingCapacity} more agents can be added.`);
      }

      agentPreviewRef.current = generateRandomizedAgentDrafts(
        config,
        obstaclesArrayRef.current
      );
      agentPreviewConfigKeyRef.current = getAgentCreationConfigKey(config);
      return { ok: true };
    } catch (error) {
      clearAgentCreationPreview();
      return { ok: false, error: error.message };
    }
  }

  function handleUpdateAgentPreviewAppearance(values) {
    try {
      const config = normalizeAgentCreationConfig(values);

      // Preserve randomized position and motion; replace appearance only.
      agentPreviewRef.current = agentPreviewRef.current.map((draft) => ({
        ...draft,
        color: config.color,
        showFOV: config.showFOV,
      }));

      /*
       * Keep the cache key synchronized with the appearance change. Otherwise,
       * Create Agents would treat the visible preview as stale and rerandomize
       * the batch even though the user already approved this arrangement.
       */
      agentPreviewConfigKeyRef.current = getAgentCreationConfigKey(config);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function handleCreateAgents(values) {
    try {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      const roster = agentsArrayRef.current;

      if (!canvas || !ctx) {
        throw new Error('The simulation canvas is not ready.');
      }

      const config = normalizeAgentCreationConfig(values);
      const remainingCapacity = MAX_AGENTS - roster.length;

      if (config.count > remainingCapacity) {
        throw new Error(`Only ${remainingCapacity} more agents can be added.`);
      }

      const configKey = getAgentCreationConfigKey(config);
      const drafts =
        agentPreviewConfigKeyRef.current === configKey &&
        agentPreviewRef.current.length === config.count
          ? agentPreviewRef.current
          : generateRandomizedAgentDrafts(
              config,
              obstaclesArrayRef.current
            );

      drafts.forEach((draft) => {
        const agent = new Agent(
          draft.showFOV,
          draft.x,
          draft.y,
          draft.radius,
          draft.dx,
          draft.dy,
          draft.color,
          draft.fovRadius,
          draft.fovAngle,
          draft.angle,
          createEntityID(ENTITY_TYPES.AGENT),
          `Agent_${roster.length + 1}`,
          ctx,
          canvas,
          roster
        );

        agent.showFOV = draft.showFOV;
      });

      setAgents([...roster]);
      setExplorerTab(EXPLORER_TABS.ENTITIES);
      clearAgentCreationPreview();
      setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function handleCancelAgentCreation() {
    clearAgentCreationPreview();
    setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
  }

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
    setExplorerTab(EXPLORER_TABS.RECORDINGS);
  }

  function handleOpenPlayback(recording) {
    // Open a normal browser tab and keep this Simulation tab alive underneath.
    // Do not provide popup dimensions; the browser can treat it like a regular tab.
    const loadingQuery = new URLSearchParams({
      from: 'Main Simulation',
      to: 'Playback',
      path: '/playback',
    });
    const recWin = window.open(
      `/loading?${loadingQuery.toString()}`,
      '_blank'
    );
    // If no tab opens, display an error message.
    if (!recWin) {
      setRecordingMessage('The Playback tab was blocked by the browser.');
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

  function handleDownloadBehaviors() {
    const exportDocument = buildBehaviorExportDocument(behaviorList);
    const blob = new Blob(
      [JSON.stringify(exportDocument, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // This link exists only long enough to start the browser download.
    link.href = url;
    link.download = 'behaviors.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  function requestDeleteRecording(recording) {
    if (!recording) return;

    setPendingDeletion({
      type: 'recording',
      target: recording,
      name: recording.name,
    });
  }

  function handleDeleteRecording(recordingToDelete) {
    setRecordings((currentRecordings) =>
      currentRecordings.filter((recording) => recording !== recordingToDelete)
    );
  }

  function handleRenameRecording(recordingId, name) {
    setRecordings((currentRecordings) => currentRecordings.map((recording) => (
      recording.id === recordingId ? { ...recording, name } : recording
    )));
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
          ctx,
          canvas,
          runtimeAgents
        );
        runtimeAgent.showFOV = agent.showFOV;
      });

      const runtimeObstacles = scenario.obstacles.map((obstacle) => (
        obstacle.shapeType === 'circle'
          ? new CircleObstacle(obstacle.id, obstacle.name, obstacle.center, obstacle.radius, obstacle.color, ctx)
          : new PolygonObstacle(obstacle.id, obstacle.name, obstacle.vertices, obstacle.color, ctx)
      ));
      obstaclesArrayRef.current.length = 0;
      obstaclesArrayRef.current.push(...runtimeObstacles);

      // A loaded scenario opens paused so users can inspect it before playback.
      setIsSimulationRunning(false);
      isSimulationRunningRef.current = false;
      setAgents([...runtimeAgents]);
      setObstacles([...runtimeObstacles]);
      setExplorerTab(EXPLORER_TABS.ENTITIES);
      setSelectedAgent(null);
      setSelectedObstacle(null);
      setShowAddAgent(false);
      setShowAddMultipleAgents(false);
      setShowAddObstacle(false);
      clearAgentCreationPreview();
      obstaclePreviewRef.current = null;
      setScenarioLoadAlert({
        type: 'default',
        title: 'Scenario Loaded',
        primary: `Loaded ${runtimeAgents.length} agents and ${runtimeObstacles.length} obstacles.`,
        secondary: 'The simulation is paused so you can review the scenario before playing.',
      });
      setScenarioName(file.name.replace(/\.json$/i, ''));
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

  function normalizeBehaviorDraft(values, behaviorToIgnore = null) {
    const name = values.name.trim();
    const offset = values.offset === '' ? '' : Number(values.offset);

    if (!name) throw new Error('Behavior Name cannot be empty.');
    if (
      behaviorList.some(
        (behavior) => behavior !== behaviorToIgnore && behavior.name === name
      )
    ) {
      throw new Error(`A behavior named “${name}” already exists.`);
    }
    if (!Object.values(TARGET_PROPERTIES).includes(values.targetProperty)) {
      throw new Error('Choose a valid Target Property.');
    }
    if (!Object.values(REFERENCE_TYPES).includes(values.referenceSource)) {
      throw new Error('Choose a valid Reference Source.');
    }
    if (offset !== '' && !Number.isFinite(offset)) {
      throw new Error('Offset must be a valid number.');
    }

    const filters = values.filters.map((filter, index) => {
        const obstacleTargets = filter.targets[ENTITY_TYPES.OBSTACLE];
        const hasTarget =
          Boolean(filter.targets[ENTITY_TYPES.AGENT]) ||
          Boolean(filter.targets[ENTITY_TYPES.LEADER]) ||
          Boolean(filter.targets[ENTITY_TYPES.EXIT]) ||
          Boolean(obstacleTargets?.enabled);

        if (!hasTarget) {
          throw new Error(`Filter ${index + 1} needs at least one Target Entity Type.`);
        }
        if (
          obstacleTargets?.enabled &&
          !obstacleTargets[OBSTACLE_SHAPE_TYPES.CIRCLE] &&
          !obstacleTargets[OBSTACLE_SHAPE_TYPES.POLYGON]
        ) {
          throw new Error(`Filter ${index + 1} needs at least one Obstacle shape.`);
        }
        if (!Object.values(MEASUREMENT_TYPES).includes(filter.propertyType)) {
          throw new Error(`Filter ${index + 1} needs a valid Property.`);
        }

        if (filter.filterType === 'method') {
          if (!Object.values(METHOD_TYPES).includes(filter.methodType)) {
            throw new Error(`Filter ${index + 1} needs a valid Method.`);
          }
        } else if (filter.filterType === 'ranged') {
          const low = Number(filter.low);
          const high = Number(filter.high);

          if (!Number.isFinite(low) || !Number.isFinite(high)) {
            throw new Error(`Filter ${index + 1} needs valid Low and High values.`);
          }
          if (low > high) {
            throw new Error(`Filter ${index + 1} Low cannot be greater than High.`);
          }
        } else {
          throw new Error(`Filter ${index + 1} needs a valid Type.`);
        }

      return {
          ...filter,
          targets: {
            ...filter.targets,
            [ENTITY_TYPES.OBSTACLE]: { ...obstacleTargets },
          },
          low: filter.filterType === 'ranged' ? Number(filter.low) : filter.low,
          high: filter.filterType === 'ranged' ? Number(filter.high) : filter.high,
      };
    });

    return {
      enabled: behaviorToIgnore?.enabled ?? values.enabled ?? true,
      name,
      targetProperty: values.targetProperty,
      action: values.referenceSource,
      offset,
      filters,
      // Every Behavior owns exactly one Activation.
      activation: normalizeActivationDraft(
        values.activation ?? createDefaultActivation()
      ),
    };
  }

  function handleCreateBehavior(values) {
    try {
      // Create and Edit share the same validation path.
      const config = normalizeBehaviorDraft(values);
      const behavior = {
        id: createStableId(),
        ...config,
      };

      setBehaviorList((currentList) => [...currentList, behavior]);
      // Show the behavior as soon as creation succeeds.
      setExplorerTab(EXPLORER_TABS.BEHAVIORS);
      setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function selectBehaviorForEditing(behavior) {
    setSelectedBehavior(behavior);
    setSelectedAgent(null);
    setSelectedObstacle(null);
    setInspectorMode({
      mode: INSPECTOR_MODES.EDIT_BEHAVIOR,
      behaviorId: behavior.id,
    });
  }

  function getBehaviorEditValues(behavior) {
    if (!behavior) return null;

    // Deep-copy nested targets so Cancel cannot change the saved Behavior.
    return {
      id: behavior.id,
      name: behavior.name,
      targetProperty: behavior.targetProperty,
      referenceSource: behavior.action,
      offset: String(behavior.offset ?? ''),
      filters: behavior.filters.map((filter) => ({
        ...filter,
        targets: {
          ...filter.targets,
          [ENTITY_TYPES.OBSTACLE]: {
            ...filter.targets[ENTITY_TYPES.OBSTACLE],
          },
        },
        low: String(filter.low ?? ''),
        high: String(filter.high ?? ''),
      })),
      activation: behavior.activation ?? createDefaultActivation(),
    };
  }

  function handleApplyBehaviorEdits(values) {
    if (!selectedBehavior) {
      return { ok: false, error: 'Select a behavior before applying changes.' };
    }

    try {
      const config = normalizeBehaviorDraft(values, selectedBehavior);

      // Keep the stable ID while replacing the complete saved draft.
      setBehaviorList((currentList) =>
        currentList.map((behavior) =>
          behavior.id === selectedBehavior.id
            ? { id: behavior.id, ...config }
            : behavior
        )
      );
      setSelectedBehavior(null);
      setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function handleCancelBehaviorEdit() {
    setSelectedBehavior(null);
    setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
  }

  function handleSetBehaviorEnabled(behaviorId, enabled) {
    // Keep enabled as an explicit boolean for later runtime checks.
    setBehaviorList((currentList) =>
      currentList.map((behavior) =>
        behavior.id === behaviorId ? { ...behavior, enabled } : behavior
      )
    );
    setSelectedBehavior((currentBehavior) =>
      currentBehavior?.id === behaviorId
        ? { ...currentBehavior, enabled }
        : currentBehavior
    );
  }

  function handleApplyActivation(behaviorId, activationDraft) {
    if (!behaviorId) {
      return { ok: false, error: 'Select a behavior before applying Activation.' };
    }

    try {
      const activation = normalizeActivationDraft(activationDraft);
      const behaviorExists = behaviorList.some(
        (behavior) => behavior.id === behaviorId
      );
      if (!behaviorExists) {
        return { ok: false, error: 'The selected behavior no longer exists.' };
      }

      // Activation configuration does not replace the Behavior's Action data.
      setBehaviorList((currentList) =>
        currentList.map((behavior) =>
          behavior.id === behaviorId ? { ...behavior, activation } : behavior
        )
      );
      setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function handleUpdateBehavior(behaviorId, updates) {
    // Update the behavior with the matching behaviorId.
    setBehaviorList((currentList) => currentList.map((behavior) => (
      behavior.id === behaviorId ? { ...behavior, ...updates } : behavior
    )));
  }

  function handleRenameBehavior(behaviorId, name) {
    handleUpdateBehavior(behaviorId, { name });
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

    if (selectedBehavior?.id === behaviorId) {
      setSelectedBehavior(null);
      setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
    }
  }

  function requestDeleteBehavior(behavior) {
    if (!behavior) return;

    setPendingDeletion({
      type: 'behavior',
      target: behavior,
      name: behavior.name,
    });
  }

  function requestDeleteAllBehaviors(groupKey) {
    const count = behaviorList.filter(
      (behavior) => getBehaviorGroupKey(behavior.targetProperty) === groupKey
    ).length;
    if (count === 0) return;

    setPendingDeletion({
      type: 'behavior-group',
      groupKey,
      count,
    });
  }

  function handleDeleteBehaviorGroup(groupKey) {
    const deletedIds = new Set(
      behaviorList
        .filter((behavior) => getBehaviorGroupKey(behavior.targetProperty) === groupKey)
        .map((behavior) => behavior.id)
    );

    setBehaviorList((currentList) =>
      currentList.filter((behavior) => getBehaviorGroupKey(behavior.targetProperty) !== groupKey)
    );
    setCollapsedBehaviorIds((currentIds) => {
      const nextIds = new Set(currentIds);
      deletedIds.forEach((behaviorId) => nextIds.delete(behaviorId));
      return nextIds;
    });

    if (getBehaviorGroupKey(selectedBehavior?.targetProperty) === groupKey) {
      setSelectedBehavior(null);
      setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
    }
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
    setExplorerTab(EXPLORER_TABS.BEHAVIORS);
    // Collapse imported behaviors by default so large presets stay easy to scan.
    setCollapsedBehaviorIds((currentIds) => {
      const nextIds = new Set(currentIds);
      loadedBehaviorIds.forEach((behaviorId) => nextIds.add(behaviorId));
      return nextIds;
    });

    return loadedBehaviorIds.length;
  }

  async function handleLoadBehaviorPresetFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      // Read here so the Explorer remains only a temporary entry point.
      const presetData = JSON.parse(await file.text());
      const loadedCount = handleLoadBehaviorPreset(presetData);

      setScenarioLoadAlert({
        type: 'default',
        title: 'Behavior Preset Loaded',
        primary: `Loaded ${loadedCount} ${loadedCount === 1 ? 'behavior' : 'behaviors'}.`,
        secondary: 'The imported behaviors are now available in the Behaviors tab.',
      });
    } catch (error) {
      setScenarioLoadAlert({
        type: 'warning',
        title: 'Unable to Load Behavior Preset',
        primary: error instanceof SyntaxError
          ? 'The selected file does not contain valid JSON.'
          : error.message,
        secondary: 'Choose a valid behavior preset JSON file and try again.',
      });
    }
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
      enabled: true,
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
      enabled: behavior.enabled !== false,
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
      [OBSTACLE_SHAPE_TYPES.CIRCLE]: true,
      [OBSTACLE_SHAPE_TYPES.POLYGON]: true,
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
        [OBSTACLE_SHAPE_TYPES.CIRCLE]: targets[ENTITY_TYPES.OBSTACLE]?.[OBSTACLE_SHAPE_TYPES.CIRCLE] ?? defaults[ENTITY_TYPES.OBSTACLE][OBSTACLE_SHAPE_TYPES.CIRCLE],
        [OBSTACLE_SHAPE_TYPES.POLYGON]: targets[ENTITY_TYPES.OBSTACLE]?.[OBSTACLE_SHAPE_TYPES.POLYGON] ?? defaults[ENTITY_TYPES.OBSTACLE][OBSTACLE_SHAPE_TYPES.POLYGON],
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
    const parsedFPS = Number(targetFPS);
    fpsRef.current =
      Number.isFinite(parsedFPS) && parsedFPS >= 1 ? parsedFPS : 30;
  }, [targetFPS]);

  useEffect(() => { maxSpeedRef.current = maxSpeed; }, [maxSpeed]);
  useEffect(() => { maxAngleRef.current = maxAngle; }, [maxAngle]);
  useEffect(() => {
    smoothingFactorRef.current = Number(smoothingFactor);
  }, [smoothingFactor]);

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

    if (agentsArrayRef.current.length === 0) {
      setShowNoAgentsAlert(true);
      return;
    }

    // Play gives movement control back to the simulation.
    lookAtAgentRef.current = null;

    // Create the automatic Initial State only once.
    if (!hasInitialSnapshotRef.current) {
      createSnapshot('Initial State');
      hasInitialSnapshotRef.current = true;
    }

    if (recordWhenPlaying) {
      // Start recording and playback together after runtime validation passes.
      handleStartRecording();
      return;
    }

    // Normal playback without recording.
    setIsSimulationRunning(true);
    isSimulationRunningRef.current = true;
  }

  function createSnapshot(name = null) {
    const snapshotData = storeScenarioInformation({
      agents: agentsArrayRef,
      obstacles: obstaclesArrayRef,
    });

    setSnapshots((currentSnapshots) => {
      // Users must delete one Snapshot before exceeding the limit.
      if (currentSnapshots.length >= MAX_SNAPSHOTS) return currentSnapshots;

      return [
        ...currentSnapshots,
        {
          id: crypto.randomUUID(),
          name: name ?? `Snapshot ${currentSnapshots.length + 1}`,
          createdAt: new Date().toLocaleTimeString(),
          data: snapshotData,
        },
      ];
    });
  }

  // Wrap with AlertBox
  function handleCreateSnapshot() {
    // A Snapshot needs at least one Agent, matching the Play requirement.
    if (agentsArrayRef.current.length === 0) {
      setShowNoAgentsAlert(true);
      return;
    }

    createSnapshot();
  }

  function handleRestoreSnapshot(snapshotData) {
    // Stop runtime activity before moving Entities back to a saved state.
    setIsSimulationRunning(false);
    isSimulationRunningRef.current = false;
    if (isRecordingRef.current) handleStopRecording();

    resetScenario(snapshotData);

    // Refresh Explorer after the Entity refs have been restored.
    setAgents([...agentsArrayRef.current]);
    setObstacles([...obstaclesArrayRef.current]);
  }

  function handleRestoreLatestSnapshot() {
    const latestSnapshot = snapshots.at(-1);
    if (latestSnapshot) handleRestoreSnapshot(latestSnapshot.data);
  }

  function handleRenameSnapshot(snapshotId, name) {
    // Snapshot names are display metadata; saved Entity data stays unchanged.
    setSnapshots((currentSnapshots) =>
      currentSnapshots.map((snapshot) =>
        snapshot.id === snapshotId ? { ...snapshot, name } : snapshot
      )
    );
  }

  function handleDeleteSnapshot(snapshotId) {
    setSnapshots((currentSnapshots) =>
      currentSnapshots.filter((snapshot) => snapshot.id !== snapshotId)
    );
  }

  // Behavior List Ref Sync (ensuring the latest behavior list is available)
  useEffect(() => {
    behaviorGroupsRef.current = groupBehaviors(behaviorList, true);

    // A changed Behavior configuration must not reuse the previous steering target.
    agentsArrayRef.current.forEach((agent) => {
      agent.steeringAngle = agent.angle;
    });
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
        drawObstaclePreview(ctx, obstaclePreviewRef.current);
        agentPreviewRef.current.forEach((preview) => {
          drawAgentPreview(ctx, preview);
        });

        // Always read the current roster from the ref. Entity editing can change
        // the roster after this animation effect is created, so closing over the
        // initial agentsArray would leave the canvas drawing a stale list.
        const runtimeAgents = agentsArrayRef.current;

        if (isSimulationRunningRef.current) {
          // Only advance positions and behaviors while the simulation is playing.
          runtimeAgents.forEach(agent => agent.move(maxSpeedRef.current));
          runtimeAgents.forEach(agent => {
            // Snapshot motion before behavior so neighbor-reference rules do not
            // read speeds/headings already changed earlier in the same frame.
            agent.behaviorDx = agent.dx;
            agent.behaviorDy = agent.dy;
            agent.behaviorAngle = agent.angle;
          });
          const allEntities = [...runtimeAgents, ...obstaclesArrayRef.current];
          runtimeAgents.forEach(agent => agent.behave(
            allEntities,
            behaviorGroupsRef.current,
            maxSpeedRef.current,
            maxAngleRef.current,
            smoothingFactorRef.current
          ));

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
        } else {
          // Pausing freezes positions, but agents must still be redrawn because
          // the canvas is cleared at the beginning of every rendered frame.
          runtimeAgents.forEach(agent => agent.draw());
        }
      }
    }
    animate(0);

    return () => cancelAnimationFrame(animationId);
  }, []);

  // ---- Canvas Interaction Handlers ----
  function findAgentAt(point) {
    const roster = agentsArrayRef.current;

    // Walk backwards so the last-drawn agent wins when entities overlap.
    for (let index = roster.length - 1; index >= 0; index -= 1) {
      const agent = roster[index];
      if (Math.hypot(point.x - agent.position.x, point.y - agent.position.y) <= agent.radius + 4) {
        return agent;
      }
    }

    return null;
  }

  function handleCanvasPointerDown(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = getCanvasPointFromEvent(event, canvas);

    // Match Scenario Builder hit priority: agents win over obstacles.
    const clickedAgent = findAgentAt(point);
    const clickedObstacle = clickedAgent
      ? null
      : findObstacleAt(point, obstaclesArrayRef.current);

    // Keep Look at Cursor only when the user clicks the same Agent.
    if (
      lookAtAgentRef.current &&
      clickedAgent !== lookAtAgentRef.current
    ) {
      lookAtAgentRef.current = null;
    }

    if (clickedAgent) selectAgentForEditing(clickedAgent);
    else if (clickedObstacle) selectObstacleForEditing(clickedObstacle);
    else clearSelectedEntity();

    // Runtime movement and pointer movement must never compete for ownership of
    // an agent's position. Selection still works while playing, dragging does not.
    if (isSimulationRunningRef.current || (!clickedAgent && !clickedObstacle)) {
      dragRef.current = null;
      return;
    }

    dragRef.current = {
      type: clickedAgent ? 'agent' : 'obstacle',
      entity: clickedAgent ?? clickedObstacle,
      previous: point,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function handleCanvasPointerMove(event) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const lookAtAgent = lookAtAgentRef.current;

    if (lookAtAgent && !isSimulationRunningRef.current) {
      const point = getCanvasPointFromEvent(event, canvas);
      const dx = point.x - lookAtAgent.position.x;
      const dy = point.y - lookAtAgent.position.y;

      // The center has no direction, so keep the previous angle there.
      if (dx !== 0 || dy !== 0) {
        const angle = Math.atan2(dy, dx);
        const speed = Math.hypot(lookAtAgent.dx, lookAtAgent.dy);

        // Keep drawing, steering, and future movement pointed the same way.
        lookAtAgent.angle = angle;
        lookAtAgent.steeringAngle = angle;
        lookAtAgent.dx = Math.cos(angle) * speed;
        lookAtAgent.dy = Math.sin(angle) * speed;
      }
    }

    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const point = getCanvasPointFromEvent(event, canvas);
    const dx = point.x - drag.previous.x;
    const dy = point.y - drag.previous.y;
    drag.previous = point;

    if (drag.type === 'agent') {
      const agent = drag.entity;
      agent.position.x = Math.min(CANVAS_WIDTH, Math.max(0, agent.position.x + dx));
      agent.position.y = Math.min(CANVAS_HEIGHT, Math.max(0, agent.position.y + dy));
      setAgents([...agentsArrayRef.current]);
      return;
    }

    const obstacle = drag.entity;
    if (obstacle.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE) {
      obstacle.center.x = Math.min(CANVAS_WIDTH, Math.max(0, obstacle.center.x + dx));
      obstacle.center.y = Math.min(CANVAS_HEIGHT, Math.max(0, obstacle.center.y + dy));
      obstacle.position = obstacle.center;
    } else {
      obstacle.vertices = obstacle.vertices.map((vertex) => ({
        x: Math.min(CANVAS_WIDTH, Math.max(0, vertex.x + dx)),
        y: Math.min(CANVAS_HEIGHT, Math.max(0, vertex.y + dy)),
      }));
      // Collision detection and labels use these derived geometry fields.
      obstacle.edges = obstacle._buildEdges(obstacle.vertices);
      obstacle.position = obstacle._computeCentroid(obstacle.vertices);
      obstacle.centroid = obstacle.position;
      obstacle.radius = obstacle._computeBoundingRadius(obstacle.vertices, obstacle.position);
    }
    setObstacles([...obstaclesArrayRef.current]);
  }

  function handleCanvasPointerUp(event) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleCanvasDoubleClick(event) {
    if (isSimulationRunningRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const point = getCanvasPointFromEvent(event, canvas);
    const clickedAgent = findAgentAt(point);
    if (!clickedAgent) return;

    // Double-click the same Agent again to turn the mode off.
    if (lookAtAgentRef.current === clickedAgent) {
      lookAtAgentRef.current = null;
    } else {
      lookAtAgentRef.current = clickedAgent;
    }
    dragRef.current = null;
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
    setInspectorMode({
      mode: INSPECTOR_MODES.EDIT_AGENT,
      agentId: agent.id,
    });
  }

  function selectObstacleForEditing(obstacle) {
    setSelectedObstacle(obstacle);
    setSelectedAgent(null);
    setInspectorMode({
      mode: INSPECTOR_MODES.EDIT_OBSTACLE,
      obstacleId: obstacle.id,
    });
  }

  function clearSelectedEntity() {
    setSelectedAgent(null);
    setSelectedObstacle(null);
  }

  function handleRenameAgent(agentId, name) {
    const agent = agentsArrayRef.current.find((item) => item.id === agentId);
    if (!agent) return;
    agent.name = name;
    setAgents([...agentsArrayRef.current]);
  }

  function handleRenameObstacle(obstacleId, name) {
    const obstacle = obstaclesArrayRef.current.find((item) => item.id === obstacleId);
    if (!obstacle) return;
    obstacle.name = name;
    setObstacles([...obstaclesArrayRef.current]);
  }

  function getAgentEditValues(agent) {
    if (!agent) return null;

    // Convert runtime vectors and radians into values people can edit directly.
    const speed = Math.hypot(agent.dx, agent.dy);
    const angle = -agent.angle * 180 / Math.PI;
    const roundForForm = (value) => String(Math.round(value * 100) / 100);

    return {
      name: agent.name,
      // Round display values only; the live Agent keeps its full precision.
      x: roundForForm(agent.position.x),
      y: roundForForm(agent.position.y),
      speed: roundForForm(speed),
      angle: roundForForm(angle),
      color: getAgentColor(agent),
      showFOV: agent.showFOV !== false,
      fovAngle: roundForForm(agent.fovAngle * 180 / Math.PI),
    };
  }

  function getObstacleEditValues(obstacle) {
    if (!obstacle) return null;
    const roundForForm = (value) => String(Math.round(value * 100) / 100);

    // Copy values into the form so Cancel cannot mutate the live obstacle.
    return {
      shape:
        obstacle.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE
          ? 'circle'
          : 'polygon',
      name: obstacle.name,
      color: getObstacleColor(obstacle),
      centerX: roundForForm(obstacle.center?.x ?? 250),
      centerY: roundForForm(obstacle.center?.y ?? 250),
      radius: String(obstacle.radius ?? 50),
      vertices: Array.isArray(obstacle.vertices)
        ? obstacle.vertices.map((vertex) => ({
            x: roundForForm(vertex.x),
            y: roundForForm(vertex.y),
          }))
        : [],
    };
  }

  function handleApplyAgentEdits(values) {
    if (!selectedAgent) {
      return { ok: false, error: 'Select an agent before applying changes.' };
    }

    // Step 1: Parse every numeric field before changing the live Agent.
    const x = Number(values.x);
    const y = Number(values.y);
    const speed = Number(values.speed);
    const angleDegrees = Number(values.angle);
    const fovAngleDegrees = Number(values.fovAngle);
    const name = values.name.trim();

    if (!name) {
      return { ok: false, error: 'Agent name cannot be empty.' };
    }
    if (!Number.isFinite(x) || x < 0 || x > CANVAS_WIDTH) {
      return { ok: false, error: `X Position must be between 0 and ${CANVAS_WIDTH}.` };
    }
    if (!Number.isFinite(y) || y < 0 || y > CANVAS_HEIGHT) {
      return { ok: false, error: `Y Position must be between 0 and ${CANVAS_HEIGHT}.` };
    }
    if (!Number.isFinite(speed) || speed < 0) {
      return { ok: false, error: 'Speed must be zero or greater.' };
    }
    if (!Number.isFinite(angleDegrees)) {
      return { ok: false, error: 'Angle must be a valid number.' };
    }
    if (
      !Number.isFinite(fovAngleDegrees) ||
      fovAngleDegrees < 0 ||
      fovAngleDegrees > 360
    ) {
      return { ok: false, error: 'FOV Angle must be between 0 and 360 degrees.' };
    }

    // Step 2: Convert the displayed clockwise degrees back to canvas radians.
    const angle = -angleDegrees * Math.PI / 180;

    // Step 3: Commit all edits together so Cancel never partially changes an Agent.
    selectedAgent.name = name;
    selectedAgent.position.x = x;
    selectedAgent.position.y = y;
    selectedAgent.dx = Math.cos(angle) * speed;
    selectedAgent.dy = Math.sin(angle) * speed;
    selectedAgent.angle = angle;
    selectedAgent.steeringAngle = angle;
    selectedAgent.originalColor = values.color;
    selectedAgent.colorHex = values.color;
    selectedAgent.showFOV = values.showFOV;
    selectedAgent.isSpecial = values.showFOV;
    selectedAgent.fovAngle = fovAngleDegrees * Math.PI / 180;

    // Step 4: Refresh React UI, then close the editor.
    setAgents([...agentsArrayRef.current]);
    setSelectedAgent(null);
    setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
    return { ok: true };
  }

  function handleCancelAgentEdit() {
    // Form values are local, so closing here leaves the live Agent unchanged.
    setSelectedAgent(null);
    setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
  }

  function handleUpdateObstaclePreview(values) {
    try {
      obstaclePreviewRef.current = normalizeObstacleFormValues(values);
    } catch {
      // Invalid drafts stay hidden until the fields make sense again.
      obstaclePreviewRef.current = null;
    }
  }

  function handleCreateObstacle(values) {
    try {
      // Step 1: Validate the exact fields currently shown in the preview.
      const config = normalizeObstacleFormValues(values);
      const ctx = ctxRef.current;

      if (!ctx) {
        throw new Error('The simulation canvas is not ready.');
      }

      // Step 2: Use the next available default name when the field is blank.
      let obstacleName = config.name;
      if (!obstacleName) {
        let nextNumber = obstaclesArrayRef.current.length + 1;
        do {
          obstacleName = `Obstacle_${nextNumber}`;
          nextNumber += 1;
        } while (
          obstaclesArrayRef.current.some(
            (obstacle) => obstacle.name === obstacleName
          )
        );
      }

      // Step 3: Create the matching existing model.
      const obstacle =
        config.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE
          ? new CircleObstacle(
              createEntityID(ENTITY_TYPES.OBSTACLE),
              obstacleName,
              config.center,
              config.radius,
              config.color,
              ctx
            )
          : new PolygonObstacle(
              createEntityID(ENTITY_TYPES.OBSTACLE),
              obstacleName,
              config.vertices,
              config.color,
              ctx
            );

      // Step 4: Commit once, then close the draft form.
      obstaclesArrayRef.current.push(obstacle);
      setObstacles([...obstaclesArrayRef.current]);
      setExplorerTab(EXPLORER_TABS.ENTITIES);
      handleClearObstaclePreview();
      setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }

  function handleClearObstaclePreview() {
    obstaclePreviewRef.current = null;
  }

  function handleCancelObstacleCreation() {
    // The preview is only a draft, so Cancel can discard it safely.
    handleClearObstaclePreview();
    setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
  }

  // Delete selected agent workflow:
  // EntityEditor calls this from the "Delete Agent" button. The live simulation
  // loop reads agentsArrayRef.current, so we remove from the ref first, then
  // refresh React state and clear the current editor selection.
  function requestDeleteSelectedAgent() {
    if (!selectedAgent) return;

    requestDeleteAgent(selectedAgent);
  }

  function requestDeleteAgent(agent) {
    if (!agent) return;

    setPendingDeletion({ type: 'agent', target: agent, name: agent.name });
  }

  function requestDeleteAllAgents() {
    const count = agentsArrayRef.current.length;
    if (count === 0) return;

    setPendingDeletion({ type: 'all-agents', count });
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
    setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
  }

  function handleApplyObstacleEdits(updates) {
    if (!selectedObstacle) {
      return { ok: false, error: 'Select an obstacle before applying changes.' };
    }

    try {
      // Step 1: Reuse the same validation as Create and Preview.
      const config = normalizeObstacleFormValues(updates);
      const currentShapeType = selectedObstacle.shapeType;

      if (!config.name) {
        throw new Error('Obstacle Name cannot be empty.');
      }
      if (config.shapeType !== currentShapeType) {
        throw new Error('An existing obstacle cannot change its shape.');
      }
      // Step 2: Commit only after every field is valid.
      selectedObstacle.name = config.name;
      selectedObstacle.color = config.color;

      if (currentShapeType === OBSTACLE_SHAPE_TYPES.CIRCLE) {
        selectedObstacle.position = config.center;
        selectedObstacle.center = selectedObstacle.position;
        selectedObstacle.radius = config.radius;
      } else {
        selectedObstacle.vertices = config.vertices;
        selectedObstacle.edges = selectedObstacle._buildEdges(config.vertices);
        selectedObstacle.position = selectedObstacle._computeCentroid(config.vertices);
        selectedObstacle.centroid = selectedObstacle.position;
        selectedObstacle.radius = selectedObstacle._computeBoundingRadius(
          config.vertices,
          selectedObstacle.position
        );
      }

      // Step 3: Refresh the UI and close the editor.
      setObstacles([...obstaclesArrayRef.current]);
      setSelectedObstacle(null);
      setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function handleCancelObstacleEdit() {
    // Form values are local, so Cancel leaves the live obstacle unchanged.
    setSelectedObstacle(null);
    setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
  }

  function requestDeleteSelectedObstacle() {
    if (!selectedObstacle) return;

    requestDeleteObstacle(selectedObstacle);
  }

  function requestDeleteObstacle(obstacle) {
    if (!obstacle) return;

    setPendingDeletion({
      type: 'obstacle',
      target: obstacle,
      name: obstacle.name,
    });
  }

  function requestDeleteAllObstacles() {
    const count = obstaclesArrayRef.current.length;
    if (count === 0) return;

    setPendingDeletion({ type: 'all-obstacles', count });
  }

  function handleDeleteSelectedObstacle(obstacleToDelete) {
    if (!obstacleToDelete) return;

    obstaclesArrayRef.current = obstaclesArrayRef.current.filter((obstacle) => obstacle !== obstacleToDelete);
    setObstacles([...obstaclesArrayRef.current]);
    setSelectedObstacle(null);
    setInspectorMode({ mode: INSPECTOR_MODES.EMPTY });
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
    } else if (pendingDeletion.type === 'behavior') {
      handleDeleteBehavior(pendingDeletion.target.id);
    } else if (pendingDeletion.type === 'behavior-group') {
      handleDeleteBehaviorGroup(pendingDeletion.groupKey);
    } else if (pendingDeletion.type === 'recording') {
      handleDeleteRecording(pendingDeletion.target);
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
    if (pendingDeletion.type === 'behavior') {
      return {
        title: 'Delete This Behavior?',
        primary: `Are you sure you want to delete “${pendingDeletion.name}”?`,
        secondary: 'This action cannot be undone.',
      };
    }
    if (pendingDeletion.type === 'behavior-group') {
      const groupLabel = BEHAVIOR_GROUP_DEFINITIONS.find(
        ({ key }) => key === pendingDeletion.groupKey
      )?.label ?? 'Selected Behaviors';
      return {
        title: `Delete All ${groupLabel}?`,
        primary: `Are you sure you want to delete all ${pendingDeletion.count} ${groupLabel.toLowerCase()}?`,
        secondary: 'This action cannot be undone.',
      };
    }
    if (pendingDeletion.type === 'recording') {
      return {
        title: 'Delete This Recording?',
        primary: `Are you sure you want to delete “${pendingDeletion.name}”?`,
        secondary: 'Downloaded files will not be affected.',
      };
    }
  }

  const deletionAlertContent = getDeletionAlertContent();

  // InspectorBuild changes its guidance once the simulation contains components.
  const hasSimulationContent =
    agents.length > 0 ||
    obstacles.length > 0 ||
    behaviorList.length > 0;

  // Main Simulation
  return (
    <div className={styles.simulationPage}>
      {showWelcomeAlert && (
        <AlertBox
          title="You’re Using the Beta Simulation"
          primMessage="This third-generation workspace is still under active development. Core features are available, but some tools may change or behave unexpectedly."
          secMessage={(
            <>
              For the most reliable experience, you can continue in the{' '}
              <Link
                to="/loading"
                state={{
                  from: '3rd Gen Simulation',
                  to: '2nd Gen Simulation',
                  path: '/simulation',
                }}
              >
                stable 2nd Gen simulation.
              </Link>
            </>
          )}
          confirmLabel="Continue with Beta"
          cancelLabel="Close"
          permanentDismiss
          dismissStorageKey="simulation-3rd-gen-beta-notice-dismissed"
          onConfirm={() => setShowWelcomeAlert(false)}
          onCancel={() => setShowWelcomeAlert(false)}
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

      {showNoAgentsAlert && (
        <AlertBox
          title="Add an Agent First"
          primMessage="The simulation needs at least one Agent before your request can be completed."
          secMessage="Create an Agent in the Inspector, then try again."
          type="warning"
          confirmLabel="Got It"
          cancelLabel="Close"
          onConfirm={() => setShowNoAgentsAlert(false)}
          onCancel={() => setShowNoAgentsAlert(false)}
        />
      )}

      {scenarioLoadAlert && (
        <AlertBox
          title={scenarioLoadAlert.title}
          primMessage={scenarioLoadAlert.primary}
          secMessage={scenarioLoadAlert.secondary}
          type={scenarioLoadAlert.type}
          confirmLabel="Got It"
          cancelLabel="Close"
          onConfirm={() => setScenarioLoadAlert(null)}
          onCancel={() => setScenarioLoadAlert(null)}
        />
      )}

      <Header title="Main Simulation" subtitle="3rd Generation" />

      <main className={styles.simulationArea}>
        <SimulationExplorer
          activeTab={explorerTab}
          onTabChange={setExplorerTab}
          scenarioName={scenarioName}
          onRenameScenario={setScenarioName}
          agents={agents}
          obstacles={obstacles}
          behaviors={behaviorList}
          recordings={recordings}
          snapshots={snapshots}
          onLoadJSON={() => scenarioFileInputRef.current?.click()}
          onLoadBehaviorPreset={() => behaviorPresetFileInputRef.current?.click()}
          onExportBehaviors={handleDownloadBehaviors}
          onOpenScenarioBuilder={() => navigate('/loading', {
            state: {
              from: 'Main Simulation',
              to: 'Scenario Builder',
              path: '/scenario-builder',
            },
          })}
          onEditAgent={selectAgentForEditing}
          onRenameAgent={handleRenameAgent}
          onDeleteAgent={requestDeleteAgent}
          onDeleteAllAgents={requestDeleteAllAgents}
          onEditObstacle={selectObstacleForEditing}
          onRenameObstacle={handleRenameObstacle}
          onDeleteObstacle={requestDeleteObstacle}
          onDeleteAllObstacles={requestDeleteAllObstacles}
          onEditBehavior={selectBehaviorForEditing}
          onRenameBehavior={handleRenameBehavior}
          onSetBehaviorEnabled={handleSetBehaviorEnabled}
          onDeleteBehavior={requestDeleteBehavior}
          onDeleteAllBehaviors={requestDeleteAllBehaviors}
          onPlayRecording={handleOpenPlayback}
          onRenameRecording={handleRenameRecording}
          onDownloadRecording={handleDownloadPlayback}
          onDeleteRecording={requestDeleteRecording}
          onRestoreSnapshot={handleRestoreSnapshot}
          onRenameSnapshot={handleRenameSnapshot}
          onDeleteSnapshot={handleDeleteSnapshot}
          onCreateSnapshot={handleCreateSnapshot}
          snapshotLimit={MAX_SNAPSHOTS}
        />

        <input
          ref={scenarioFileInputRef}
          className={styles.visuallyHidden}
          type="file"
          accept=".json,application/json"
          onChange={handleLoadScenario}
        />

        <input
          ref={behaviorPresetFileInputRef}
          className={styles.visuallyHidden}
          type="file"
          accept=".json,application/json"
          onChange={handleLoadBehaviorPresetFile}
        />

        <section className={styles.centerWorkspace} aria-label="Simulation canvas">
          {/* The display and world sizes are both 500 × 500 for the current version. */}
          <figure
            className={`${styles.canvasWrapper} ${
              isRecording ? styles.canvasWrapperRecording : ''
            }`}
          >
            <figcaption className={styles.canvasSize}>
              Simulation Size: {CANVAS_WIDTH} × {CANVAS_HEIGHT}
            </figcaption>

            <div className={styles.canvasFrame}>
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
                onPointerCancel={handleCanvasPointerUp}
                onDoubleClick={handleCanvasDoubleClick}
              />

              {selectedAgent && (
                <aside className={styles.weightMonitor} aria-live="polite">
                  <strong>{selectedAgent.name}</strong>

                  {selectedAgentWeights.length > 0 ? (
                    <>
                      <div className={styles.weightMonitorHeader} aria-hidden="true">
                        <span />
                        <span>Raw</span>
                        <span>Normalized</span>
                      </div>

                      {selectedAgentWeights.map((behavior) => (
                        <div className={styles.weightMonitorRow} key={behavior.behavior.id}>
                          <span>{behavior.behavior.name}</span>
                          <output>{behavior.rawActivationWeight.toFixed(3)}</output>
                          <output>{behavior.normalizedActivationWeight.toFixed(3)}</output>
                        </div>
                      ))}
                    </>
                  ) : (
                    <span className={styles.weightMonitorEmpty}>Play to calculate weights.</span>
                  )}
                </aside>
              )}
            </div>

            {isRecording && (
              <p
                className={styles.recordingIndicator}
                role="status"
                aria-live="polite"
              >
                RECORDING IN PROGRESS
              </p>
            )}
          </figure>

          <RuntimeControlCard
            isSettingsOpen={isRuntimeSettingsOpen}
            onToggleSettings={toggleRuntimeSettings}
            isSimulationRunning={isSimulationRunning}
            onToggleSimulation={toggleSimulationRunning}
            recordWhenPlaying={recordWhenPlaying}
            onRecordWhenPlayingChange={setRecordWhenPlaying}
            isRecording={isRecording}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            hasAgents={agents.length > 0}
            hasSnapshots={snapshots.length > 0}
            onNoAgents={() => setShowNoAgentsAlert(true)}
            onRestoreLatest={handleRestoreLatestSnapshot}
            onOpenHistory={() => setExplorerTab(EXPLORER_TABS.HISTORY)}
          />
        </section>

        <Inspector
          view={inspectorMode}
          onChangeView={setInspectorMode}
          hasSimulationContent={hasSimulationContent}
          runtimeSettings={{
            targetFPS,
            canvasWidth: String(CANVAS_WIDTH),
            canvasHeight: String(CANVAS_HEIGHT),
            maximumSpeed: maxSpeed,
            maximumTurnAngle: maxAngle,
            smoothingFactor,
          }}
          onApplyRuntimeSettings={applyRuntimeSettings}
          onCloseRuntimeSettings={toggleRuntimeSettings}
          onCreateAgents={handleCreateAgents}
          onRegenerateAgentPreview={handleRegenerateAgentPreview}
          onUpdateAgentPreviewAppearance={handleUpdateAgentPreviewAppearance}
          onCancelAgentCreation={handleCancelAgentCreation}
          onUpdateObstaclePreview={handleUpdateObstaclePreview}
          onClearObstaclePreview={handleClearObstaclePreview}
          onCreateObstacle={handleCreateObstacle}
          onCancelObstacleCreation={handleCancelObstacleCreation}
          selectedObstacle={selectedObstacle}
          obstacleEditValues={getObstacleEditValues(selectedObstacle)}
          onApplyObstacleEdits={handleApplyObstacleEdits}
          onCancelObstacleEdit={handleCancelObstacleEdit}
          onCreateBehavior={handleCreateBehavior}
          behaviors={behaviorList}
          selectedBehavior={selectedBehavior}
          behaviorEditValues={getBehaviorEditValues(selectedBehavior)}
          onApplyBehaviorEdits={handleApplyBehaviorEdits}
          onApplyActivation={handleApplyActivation}
          onCancelBehaviorEdit={handleCancelBehaviorEdit}
          selectedAgent={selectedAgent}
          agentEditValues={getAgentEditValues(selectedAgent)}
          onApplyAgentEdits={handleApplyAgentEdits}
          onCancelAgentEdit={handleCancelAgentEdit}
        />
      </main>

      <Footer />
    </div>
  );
}

export default Simulation3rdGen;
