import { Bot, FileDown, FileUp, MonitorPlay, Redo2, Shapes, Trash2, Undo2, Wrench } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/simulation-3rd-gen/Header3rdGen.jsx';
import { getFormComponent } from '../components/simulation-3rd-gen/inspector/formRegistry.js';
import {
  FORM_MODES,
  INSPECTOR_MODES,
} from '../components/simulation-3rd-gen/inspector/modeConstants.js';
import AddToSimulationMenu from '../components/simulation-3rd-gen/inspector/sub-components/AddToSimulationMenu.jsx';
import AlertBox from '../components/simulation/AlertBox.jsx';
import ScenarioBuilderCanvas from '../components/scenario-builder-3rd-gen/ScenarioBuilderCanvas.jsx';
import Footer from '../components/shared/Footer.jsx';
import ExplorerEntry from '../components/workspace/ExplorerEntry.jsx';
import WorkspaceExplorer from '../components/workspace/WorkspaceExplorer.jsx';
import WorkspaceInspector from '../components/workspace/WorkspaceInspector.jsx';
import InlineNameEdit from '../components/workspace/InlineNameEdit.jsx';
import { BUILDER_TABS, ENTITY_TYPES } from '../utils/constants.js';
import {
  getDraggedEntityGeometry,
  getEditedObstacleGeometry,
} from '../utils/canvasInteractionUtilities.js';
import { createEntityID, formatID } from '../utils/utilities.js';
import {
  createAgentDrafts,
  getAgentPreviewRange,
  MAX_SCENARIO_AGENTS,
  parseObstacleCreationValues,
  parseAgentCreationValues,
  SCENARIO_CANVAS_HEIGHT,
  SCENARIO_CANVAS_WIDTH,
} from '../utils/scenarioBuilderEntityUtilities.js';
import {
  createScenarioDocument,
  downloadScenarioFile,
  loadScenarioFile,
} from '../utils/scenarioUtilities.js';
import styles from '../styles/3rd-gen/simulation.module.css';

const BUILDER_ENTITY_TYPES = [ENTITY_TYPES.AGENT, ENTITY_TYPES.OBSTACLE];

export default function ScenarioBuilder3rdGen() {
  const navigate = useNavigate();
  const agentPreviewRef = useRef([]);
  const agentPreviewKeyRef = useRef('');
  const scenarioFileInputRef = useRef(null);
  const pendingScenarioFileRef = useRef(null);
  const agentsRef = useRef([]);
  const obstaclesRef = useRef([]);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const canvasEditRef = useRef(null);
  const lookAtAgentIdRef = useRef(null);
  const undoActionRef = useRef(null);
  const redoActionRef = useRef(null);
  const [scenarioName, setScenarioName] = useState('Untitled Scenario');
  const [builderTab, setBuilderTab] = useState(BUILDER_TABS.ENTITIES);
  const [agents, setAgents] = useState([]);
  const [obstacles, setObstacles] = useState([]);
  const [previewAgents, setPreviewAgents] = useState([]);
  const [previewRange, setPreviewRange] = useState(null);
  const [previewObstacle, setPreviewObstacle] = useState(null);
  const [selection, setSelection] = useState(null);
  const [inspectorMode, setInspectorMode] = useState(INSPECTOR_MODES.EMPTY);
  const [scenarioFileAlert, setScenarioFileAlert] = useState(null);
  const [showImportConfirmation, setShowImportConfirmation] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [lookAtAgentId, setLookAtAgentId] = useState(null);

  // This function stores a destination until the user confirms they want to leave.
  function requestScenarioExit(destination) {
    setPendingNavigation(destination);
  }

  // This function continues to the confirmed destination.
  function continueScenarioExit() {
    if (!pendingNavigation) return;
    navigate('/loading', { state: pendingNavigation });
  }

  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  useEffect(() => {
    obstaclesRef.current = obstacles;
  }, [obstacles]);

  // This function updates the enabled state of the Undo and Redo buttons.
  function updateHistoryButtons() {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }

  // This function records one completed Builder action and clears Redo history.
  function recordHistoryAction(action) {
    undoStackRef.current.push(action);
    redoStackRef.current = [];
    updateHistoryButtons();
  }

  // This function stores an Entity before a Canvas edit begins.
  function beginCanvasEdit(entityType, id) {
    const entities = entityType === ENTITY_TYPES.AGENT
      ? agentsRef.current
      : obstaclesRef.current;
    const entity = entities.find((item) => item.id === id);
    if (!entity) return;

    canvasEditRef.current = {
      entityType,
      id,
      before: structuredClone(entity),
    };
  }

  // This function records one Canvas edit after the interaction ends.
  function endCanvasEdit(entityType, id) {
    const edit = canvasEditRef.current;
    if (!edit || edit.entityType !== entityType || edit.id !== id) return;

    const entities = entityType === ENTITY_TYPES.AGENT
      ? agentsRef.current
      : obstaclesRef.current;
    const entity = entities.find((item) => item.id === id);
    canvasEditRef.current = null;
    if (!entity || JSON.stringify(edit.before) === JSON.stringify(entity)) return;

    recordHistoryAction({
      action: 'update',
      entityType,
      before: edit.before,
      after: structuredClone(entity),
    });
  }

  function storeAgentPreview(nextAgents, config) {
    agentPreviewRef.current = nextAgents;
    agentPreviewKeyRef.current = JSON.stringify(config);
    setPreviewAgents(nextAgents);
    setPreviewRange(getAgentPreviewRange(config));
  }

  function clearAgentPreview() {
    agentPreviewRef.current = [];
    agentPreviewKeyRef.current = '';
    setPreviewAgents([]);
    setPreviewRange(null);
  }

  function regenerateAgentPreview(values) {
    try {
      const config = parseAgentCreationValues(values);
      const remainingCapacity = MAX_SCENARIO_AGENTS - agents.length;
      if (config.count > remainingCapacity) {
        throw new Error(`Only ${remainingCapacity} more Agents can be added.`);
      }

      storeAgentPreview(createAgentDrafts(config), config);
      return { ok: true };
    } catch (error) {
      clearAgentPreview();
      return { ok: false, error: error.message };
    }
  }

  function updateAgentPreviewAppearance(values) {
    try {
      const config = parseAgentCreationValues(values);
      const nextAgents = agentPreviewRef.current.map((agent) => ({
        ...agent,
        colorHex: config.colorHex,
        fovRadius: config.fovRadius,
        fovAngle: config.fovAngle,
        showFOV: config.showFOV,
      }));
      storeAgentPreview(nextAgents, config);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function createAgents(values) {
    try {
      const config = parseAgentCreationValues(values);
      const remainingCapacity = MAX_SCENARIO_AGENTS - agents.length;
      if (config.count > remainingCapacity) {
        throw new Error(`Only ${remainingCapacity} more Agents can be added.`);
      }

      const configKey = JSON.stringify(config);
      const drafts = (
        agentPreviewKeyRef.current === configKey
        && agentPreviewRef.current.length === config.count
      )
        ? agentPreviewRef.current
        : createAgentDrafts(config);
      const createdAgents = drafts.map((draft, index) => ({
        ...draft,
        id: createEntityID(ENTITY_TYPES.AGENT),
        name: `Agent_${agents.length + index + 1}`,
      }));

      const nextAgents = [...agents, ...createdAgents];
      agentsRef.current = nextAgents;
      setAgents(nextAgents);
      recordHistoryAction({
        action: 'create',
        entityType: ENTITY_TYPES.AGENT,
        entities: structuredClone(createdAgents),
      });
      clearAgentPreview();
      setBuilderTab(BUILDER_TABS.ENTITIES);
      setInspectorMode(INSPECTOR_MODES.EMPTY);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function cancelAgentCreation() {
    clearAgentPreview();
    setInspectorMode(INSPECTOR_MODES.EMPTY);
  }

  function updateObstaclePreview(values) {
    try {
      setPreviewObstacle(parseObstacleCreationValues(values));
    } catch {
      setPreviewObstacle(null);
    }
  }

  function clearObstaclePreview() {
    setPreviewObstacle(null);
  }

  function createObstacle(values) {
    try {
      const config = parseObstacleCreationValues(values);
      let obstacleName = config.name;

      if (!obstacleName) {
        let nextNumber = obstacles.length + 1;
        do {
          obstacleName = `Obstacle_${nextNumber}`;
          nextNumber += 1;
        } while (obstacles.some((obstacle) => obstacle.name === obstacleName));
      }

      const obstacle = {
        ...config,
        id: createEntityID(ENTITY_TYPES.OBSTACLE),
        name: obstacleName,
      };

      const nextObstacles = [...obstacles, obstacle];
      obstaclesRef.current = nextObstacles;
      setObstacles(nextObstacles);
      recordHistoryAction({
        action: 'create',
        entityType: ENTITY_TYPES.OBSTACLE,
        entities: [structuredClone(obstacle)],
      });
      clearObstaclePreview();
      setBuilderTab(BUILDER_TABS.ENTITIES);
      setInspectorMode(INSPECTOR_MODES.EMPTY);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  function cancelObstacleCreation() {
    clearObstaclePreview();
    setInspectorMode(INSPECTOR_MODES.EMPTY);
  }

  // This function selects an Entity and opens its matching edit form.
  function selectEntity(nextSelection) {
    setSelection(nextSelection);
    clearAgentPreview();
    clearObstaclePreview();

    if (nextSelection?.entityType === ENTITY_TYPES.AGENT) {
      setInspectorMode(INSPECTOR_MODES.EDIT_AGENT);
    } else if (nextSelection?.entityType === ENTITY_TYPES.OBSTACLE) {
      setInspectorMode(INSPECTOR_MODES.EDIT_OBSTACLE);
    } else {
      setInspectorMode(INSPECTOR_MODES.EMPTY);
    }
  }

  // This function applies Agent form values to the selected Builder Agent.
  function applyAgentEdits(values) {
    const agent = agentsRef.current.find((item) => item.id === selection?.id);
    if (!agent) return { ok: false, error: 'Select an Agent before applying changes.' };

    const name = values.name.trim();
    const x = Number(values.x);
    const y = Number(values.y);
    const speed = Number(values.speed);
    const angle = Number(values.angle);
    const fovAngle = Number(values.fovAngle);

    if (!name) return { ok: false, error: 'Agent Name cannot be empty.' };
    if (!Number.isFinite(x) || x < 0 || x > SCENARIO_CANVAS_WIDTH) {
      return { ok: false, error: `X Position must be between 0 and ${SCENARIO_CANVAS_WIDTH}.` };
    }
    if (!Number.isFinite(y) || y < 0 || y > SCENARIO_CANVAS_HEIGHT) {
      return { ok: false, error: `Y Position must be between 0 and ${SCENARIO_CANVAS_HEIGHT}.` };
    }
    if (!Number.isFinite(speed) || speed < 0) {
      return { ok: false, error: 'Speed must be non-negative.' };
    }
    if (!Number.isFinite(angle)) {
      return { ok: false, error: 'Angle must be a valid number.' };
    }
    if (!Number.isFinite(fovAngle) || fovAngle < 0 || fovAngle > 360) {
      return { ok: false, error: 'FOV Angle must be between 0 and 360 degrees.' };
    }

    const updatedAgent = {
      ...agent,
      name,
      x,
      y,
      speed,
      angle,
      colorHex: values.color,
      showFOV: Boolean(values.showFOV),
      fovAngle,
    };
    const nextAgents = agentsRef.current.map((item) => (
      item.id === agent.id ? updatedAgent : item
    ));
    agentsRef.current = nextAgents;
    setAgents(nextAgents);
    recordHistoryAction({
      action: 'update',
      entityType: ENTITY_TYPES.AGENT,
      before: structuredClone(agent),
      after: structuredClone(updatedAgent),
    });
    selectEntity(null);
    return { ok: true };
  }

  // This function applies Obstacle form values to the selected Builder Obstacle.
  function applyObstacleEdits(values) {
    const obstacle = obstaclesRef.current.find((item) => item.id === selection?.id);
    if (!obstacle) return { ok: false, error: 'Select an Obstacle before applying changes.' };

    try {
      const config = parseObstacleCreationValues(values);
      if (!config.name) throw new Error('Obstacle Name cannot be empty.');
      if (config.shapeType !== obstacle.shapeType) {
        throw new Error('An existing Obstacle cannot change its shape.');
      }

      const updatedObstacle = { ...obstacle, ...config };
      const nextObstacles = obstaclesRef.current.map((item) => (
        item.id === obstacle.id ? updatedObstacle : item
      ));
      obstaclesRef.current = nextObstacles;
      setObstacles(nextObstacles);
      recordHistoryAction({
        action: 'update',
        entityType: ENTITY_TYPES.OBSTACLE,
        before: structuredClone(obstacle),
        after: structuredClone(updatedObstacle),
      });
      selectEntity(null);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }

  // This function deletes the selected Entity as one undoable action.
  function deleteSelectedEntity() {
    const entityType = selection?.entityType;
    const entities = entityType === ENTITY_TYPES.AGENT
      ? agentsRef.current
      : obstaclesRef.current;
    const entity = entities.find((item) => item.id === selection?.id);
    if (!entity) return;

    recordHistoryAction({
      action: 'delete',
      entityType,
      entity: structuredClone(entity),
    });
    if (entityType === ENTITY_TYPES.AGENT) {
      const nextAgents = agentsRef.current.filter((item) => item.id !== entity.id);
      agentsRef.current = nextAgents;
      setAgents(nextAgents);
    } else {
      const nextObstacles = obstaclesRef.current.filter((item) => item.id !== entity.id);
      obstaclesRef.current = nextObstacles;
      setObstacles(nextObstacles);
    }
    selectEntity(null);
  }

  // This function updates an entire Entity while it is dragged on the canvas.
  function moveEntity(entityType, id, dx, dy) {
    if (entityType === ENTITY_TYPES.AGENT) {
      setAgents((currentAgents) => {
        const nextAgents = currentAgents.map((agent) => (
        agent.id === id
          ? {
              ...agent,
              ...getDraggedEntityGeometry(
                agent,
                dx,
                dy,
                SCENARIO_CANVAS_WIDTH,
                SCENARIO_CANVAS_HEIGHT
              ),
            }
          : agent
        ));
        agentsRef.current = nextAgents;
        return nextAgents;
      });
      return;
    }

    setObstacles((currentObstacles) => {
      const nextObstacles = currentObstacles.map((obstacle) => (
        obstacle.id === id
          ? {
              ...obstacle,
              ...getDraggedEntityGeometry(
                obstacle,
                dx,
                dy,
                SCENARIO_CANVAS_WIDTH,
                SCENARIO_CANVAS_HEIGHT
              ),
            }
          : obstacle
      ));
      obstaclesRef.current = nextObstacles;
      return nextObstacles;
    });
  }

  // This function points an Agent toward the current cursor location.
  function lookAtAgent(id, canvasAngle) {
    setAgents((currentAgents) => {
      const nextAgents = currentAgents.map((agent) => (
        agent.id === id
          ? { ...agent, angle: -canvasAngle * 180 / Math.PI }
          : agent
      ));
      agentsRef.current = nextAgents;
      return nextAgents;
    });
  }

  // This function updates a Polygon vertex or Circle radius handle.
  function editObstacle(id, editHandle, point) {
    setObstacles((currentObstacles) => {
      const nextObstacles = currentObstacles.map((obstacle) => (
        obstacle.id === id
          ? {
              ...obstacle,
              ...getEditedObstacleGeometry(
                obstacle,
                editHandle,
                point,
                SCENARIO_CANVAS_WIDTH,
                SCENARIO_CANVAS_HEIGHT
              ),
            }
          : obstacle
      ));
      obstaclesRef.current = nextObstacles;
      return nextObstacles;
    });
  }

  // This function starts or finishes one Look At Cursor history action.
  function toggleLookAtAgent(id) {
    const currentId = lookAtAgentIdRef.current;
    if (currentId === id) {
      endCanvasEdit(ENTITY_TYPES.AGENT, id);
      lookAtAgentIdRef.current = null;
      setLookAtAgentId(null);
      return;
    }

    if (currentId) {
      endCanvasEdit(ENTITY_TYPES.AGENT, currentId);
    }
    beginCanvasEdit(ENTITY_TYPES.AGENT, id);
    lookAtAgentIdRef.current = id;
    setLookAtAgentId(id);
  }

  // This function finishes Look At Cursor when another Canvas target is clicked.
  function cancelLookAtAgent() {
    const currentId = lookAtAgentIdRef.current;
    if (!currentId) return;

    endCanvasEdit(ENTITY_TYPES.AGENT, currentId);
    lookAtAgentIdRef.current = null;
    setLookAtAgentId(null);
  }

  // This function restores the most recent Builder action.
  function undoLastAction() {
    cancelLookAtAgent();
    const historyItem = undoStackRef.current.pop();
    if (!historyItem) return;

    if (historyItem.action === 'create') {
      const createdIds = new Set(historyItem.entities.map((entity) => entity.id));
      if (historyItem.entityType === ENTITY_TYPES.AGENT) {
        const nextAgents = agentsRef.current.filter((agent) => !createdIds.has(agent.id));
        agentsRef.current = nextAgents;
        setAgents(nextAgents);
      } else {
        const nextObstacles = obstaclesRef.current.filter((obstacle) => !createdIds.has(obstacle.id));
        obstaclesRef.current = nextObstacles;
        setObstacles(nextObstacles);
      }
      setSelection((currentSelection) => (
        currentSelection && createdIds.has(currentSelection.id)
          ? null
          : currentSelection
      ));
    } else if (historyItem.action === 'delete') {
      if (historyItem.entityType === ENTITY_TYPES.AGENT) {
        const nextAgents = [
          ...agentsRef.current,
          structuredClone(historyItem.entity),
        ];
        agentsRef.current = nextAgents;
        setAgents(nextAgents);
      } else {
        const nextObstacles = [
          ...obstaclesRef.current,
          structuredClone(historyItem.entity),
        ];
        obstaclesRef.current = nextObstacles;
        setObstacles(nextObstacles);
      }
      setSelection({
        entityType: historyItem.entityType,
        id: historyItem.entity.id,
      });
      setInspectorMode(
        historyItem.entityType === ENTITY_TYPES.AGENT
          ? INSPECTOR_MODES.EDIT_AGENT
          : INSPECTOR_MODES.EDIT_OBSTACLE
      );
    } else if (historyItem.action === 'update') {
      if (historyItem.entityType === ENTITY_TYPES.AGENT) {
        const nextAgents = agentsRef.current.map((agent) => (
          agent.id === historyItem.before.id
            ? structuredClone(historyItem.before)
            : agent
        ));
        agentsRef.current = nextAgents;
        setAgents(nextAgents);
      } else {
        const nextObstacles = obstaclesRef.current.map((obstacle) => (
          obstacle.id === historyItem.before.id
            ? structuredClone(historyItem.before)
            : obstacle
        ));
        obstaclesRef.current = nextObstacles;
        setObstacles(nextObstacles);
      }
      setSelection({
        entityType: historyItem.entityType,
        id: historyItem.before.id,
      });
      setInspectorMode(
        historyItem.entityType === ENTITY_TYPES.AGENT
          ? INSPECTOR_MODES.EDIT_AGENT
          : INSPECTOR_MODES.EDIT_OBSTACLE
      );
    } else if (historyItem.action === 'clear') {
      const restoredAgents = structuredClone(historyItem.agents);
      const restoredObstacles = structuredClone(historyItem.obstacles);
      agentsRef.current = restoredAgents;
      obstaclesRef.current = restoredObstacles;
      setAgents(restoredAgents);
      setObstacles(restoredObstacles);
    }

    redoStackRef.current.push(historyItem);
    updateHistoryButtons();
  }

  // This function reapplies the most recently undone Builder action.
  function redoLastAction() {
    cancelLookAtAgent();
    const historyItem = redoStackRef.current.pop();
    if (!historyItem) return;

    if (historyItem.action === 'create') {
      if (historyItem.entityType === ENTITY_TYPES.AGENT) {
        const nextAgents = [
          ...agentsRef.current,
          ...structuredClone(historyItem.entities),
        ];
        agentsRef.current = nextAgents;
        setAgents(nextAgents);
      } else {
        const nextObstacles = [
          ...obstaclesRef.current,
          ...structuredClone(historyItem.entities),
        ];
        obstaclesRef.current = nextObstacles;
        setObstacles(nextObstacles);
      }
    } else if (historyItem.action === 'delete') {
      if (historyItem.entityType === ENTITY_TYPES.AGENT) {
        const nextAgents = agentsRef.current.filter((agent) => (
          agent.id !== historyItem.entity.id
        ));
        agentsRef.current = nextAgents;
        setAgents(nextAgents);
      } else {
        const nextObstacles = obstaclesRef.current.filter((obstacle) => (
          obstacle.id !== historyItem.entity.id
        ));
        obstaclesRef.current = nextObstacles;
        setObstacles(nextObstacles);
      }
      setSelection(null);
      setInspectorMode(INSPECTOR_MODES.EMPTY);
    } else if (historyItem.action === 'update') {
      if (historyItem.entityType === ENTITY_TYPES.AGENT) {
        const nextAgents = agentsRef.current.map((agent) => (
          agent.id === historyItem.after.id
            ? structuredClone(historyItem.after)
            : agent
        ));
        agentsRef.current = nextAgents;
        setAgents(nextAgents);
      } else {
        const nextObstacles = obstaclesRef.current.map((obstacle) => (
          obstacle.id === historyItem.after.id
            ? structuredClone(historyItem.after)
            : obstacle
        ));
        obstaclesRef.current = nextObstacles;
        setObstacles(nextObstacles);
      }
      setSelection({
        entityType: historyItem.entityType,
        id: historyItem.after.id,
      });
      setInspectorMode(
        historyItem.entityType === ENTITY_TYPES.AGENT
          ? INSPECTOR_MODES.EDIT_AGENT
          : INSPECTOR_MODES.EDIT_OBSTACLE
      );
    } else if (historyItem.action === 'clear') {
      agentsRef.current = [];
      obstaclesRef.current = [];
      setAgents([]);
      setObstacles([]);
      setSelection(null);
    }

    undoStackRef.current.push(historyItem);
    updateHistoryButtons();
  }

  // This function clears every Entity as one undoable Builder action.
  function clearScenario() {
    if (agentsRef.current.length === 0 && obstaclesRef.current.length === 0) return;

    cancelLookAtAgent();
    recordHistoryAction({
      action: 'clear',
      agents: structuredClone(agentsRef.current),
      obstacles: structuredClone(obstaclesRef.current),
    });
    agentsRef.current = [];
    obstaclesRef.current = [];
    setAgents([]);
    setObstacles([]);
    setSelection(null);
    clearAgentPreview();
    clearObstaclePreview();
    setInspectorMode(INSPECTOR_MODES.EMPTY);
  }

  undoActionRef.current = undoLastAction;
  redoActionRef.current = redoLastAction;

  // This function asks for confirmation before replacing the current Scenario.
  function requestScenarioImport(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    pendingScenarioFileRef.current = file;
    setShowImportConfirmation(true);
  }

  // This function imports the confirmed Scenario JSON file into the Builder.
  async function importScenario() {
    const file = pendingScenarioFileRef.current;
    pendingScenarioFileRef.current = null;
    setShowImportConfirmation(false);
    if (!file) return;

    try {
      const scenario = await loadScenarioFile(file, {
        canvasWidth: SCENARIO_CANVAS_WIDTH,
        canvasHeight: SCENARIO_CANVAS_HEIGHT,
        maxAgents: MAX_SCENARIO_AGENTS,
      });

      setScenarioName(scenario.name);
      agentsRef.current = scenario.agents;
      obstaclesRef.current = scenario.obstacles;
      setAgents(scenario.agents);
      setObstacles(scenario.obstacles);
      setSelection(null);
      canvasEditRef.current = null;
      lookAtAgentIdRef.current = null;
      setLookAtAgentId(null);
      undoStackRef.current = [];
      redoStackRef.current = [];
      updateHistoryButtons();
      clearAgentPreview();
      clearObstaclePreview();
      setInspectorMode(INSPECTOR_MODES.EMPTY);
      setScenarioFileAlert({
        type: 'default',
        title: 'Scenario Imported',
        primary: `Loaded ${scenario.agents.length} Agents and ${scenario.obstacles.length} Obstacles.`,
        secondary: 'You can now continue editing this Scenario.',
      });
    } catch (error) {
      setScenarioFileAlert({
        type: 'warning',
        title: 'Unable to Import Scenario',
        primary: error.message,
        secondary: 'Choose a valid Scenario JSON file and try again.',
      });
    }
  }

  useEffect(() => {
    // This function maps standard keyboard shortcuts to Builder history.
    function handleHistoryShortcut(event) {
      const target = event.target;
      if (
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || target?.isContentEditable
      ) {
        return;
      }

      const modifierPressed = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (!modifierPressed || (key !== 'z' && key !== 'y')) return;

      event.preventDefault();
      if ((key === 'z' && event.shiftKey) || key === 'y') {
        redoActionRef.current();
      } else {
        undoActionRef.current();
      }
    }

    window.addEventListener('keydown', handleHistoryShortcut);
    return () => window.removeEventListener('keydown', handleHistoryShortcut);
  }, []);

  // This function exports the current Builder state as Scenario JSON.
  function exportScenario() {
    try {
      const scenario = createScenarioDocument({
        name: scenarioName,
        canvas: {
          width: SCENARIO_CANVAS_WIDTH,
          height: SCENARIO_CANVAS_HEIGHT,
        },
        agents,
        obstacles,
      });
      downloadScenarioFile(scenario);
    } catch (error) {
      setScenarioFileAlert({
        type: 'warning',
        title: 'Unable to Export Scenario',
        primary: error.message,
        secondary: 'Fix the Scenario data and try again.',
      });
    }
  }

  function renderScenarioExplorer() {
    return (
      <WorkspaceExplorer title="Scenario Explorer">
        <div className={styles.explorerContent}>
          <section className={styles.scenarioCard} aria-labelledby="builder-current-scenario-title">
            <p className={styles.scenarioEyebrow} id="builder-current-scenario-title">
              Current Scenario
            </p>
            <InlineNameEdit
              value={scenarioName}
              onCommit={setScenarioName}
              fallback="Untitled Scenario"
              ariaLabel="Scenario name"
            />

            <div className={styles.scenarioActions}>
              <button
                className={styles.scenarioLoadButton}
                type="button"
                onClick={() => scenarioFileInputRef.current?.click()}
              >
                <FileUp size={16} aria-hidden="true" />
                Import JSON
              </button>
              {/* Will export scenario created here (not including behavior/activation...). */}
              <button
                className={styles.scenarioLoadButton}
                type="button"
                onClick={exportScenario}
              >
                <FileDown size={16} aria-hidden="true" />
                Export JSON
              </button>
            </div>

            <button
              className={`${styles.scenarioBuilderButton} ${styles.scenarioLaunchButton}`}
              type="button"
              onClick={() => requestScenarioExit({
                  from: 'Scenario Builder',
                  to: 'Main Simulation',
                  path: '/simulation',
              })}
            >
              <MonitorPlay size={16} aria-hidden="true" />
              Main Simulation
            </button>
          </section>

          <div
            className={`${styles.explorerTabs} ${styles.builderExplorerTabs}`}
            role="tablist"
            aria-label="Scenario Builder contents"
          >
            {Object.values(BUILDER_TABS).map((tab) => (
              <button
                id={`builder-tab-${tab}`}
                key={tab}
                className={styles.explorerTab}
                type="button"
                role="tab"
                aria-controls={`builder-tabpanel-${tab}`}
                aria-selected={builderTab === tab}
                onClick={() => setBuilderTab(tab)}
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {builderTab === BUILDER_TABS.ENTITIES && (
            <div
              id={`builder-tabpanel-${BUILDER_TABS.ENTITIES}`}
              className={styles.explorerListViewport}
              role="tabpanel"
              aria-labelledby={`builder-tab-${BUILDER_TABS.ENTITIES}`}
            >
              <div className={styles.explorerList}>
                {agents.length === 0 && obstacles.length === 0 ? (
                  <p className={styles.explorerEmpty}>No entities yet.</p>
                ) : (
                  <>
                    {agents.length > 0 && (
                      <section className={styles.explorerGroup}>
                        <h3 className={styles.builderGroupHeading}>
                          <span>Agents</span>
                          <span className={styles.explorerGroupCount}>{agents.length}</span>
                        </h3>
                        <div className={styles.explorerGroupEntries}>
                          {agents.map((agent) => (
                            <ExplorerEntry
                              key={agent.id}
                              name={agent.name}
                              type="Agent"
                              Icon={Bot}
                              subtitle="Agent"
                              trimmedId={`#${formatID(agent.id)}`}
                              onSelect={() => selectEntity({
                                entityType: ENTITY_TYPES.AGENT,
                                id: agent.id,
                              })}
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {obstacles.length > 0 && (
                      <section className={styles.explorerGroup}>
                        <h3 className={styles.builderGroupHeading}>
                          <span>Obstacles</span>
                          <span className={styles.explorerGroupCount}>{obstacles.length}</span>
                        </h3>
                        <div className={styles.explorerGroupEntries}>
                          {obstacles.map((obstacle) => (
                            <ExplorerEntry
                              key={obstacle.id}
                              name={obstacle.name}
                              type="Obstacle"
                              Icon={Shapes}
                              subtitle={`${obstacle.shapeType === 'circle' ? 'Circle' : 'Polygon'} Obstacle`}
                              trimmedId={`#${formatID(obstacle.id)}`}
                              onSelect={() => selectEntity({
                                entityType: ENTITY_TYPES.OBSTACLE,
                                id: obstacle.id,
                              })}
                            />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </WorkspaceExplorer>
    );
  }

  function renderScenarioBuilderCanvas() {
    return (
      <section className={styles.centerWorkspace} aria-label="Scenario Builder canvas">
        <ScenarioBuilderCanvas
          agents={agents}
          obstacles={obstacles}
          selection={selection}
          onSelectEntity={selectEntity}
          onMoveEntity={moveEntity}
          onLookAtAgent={lookAtAgent}
          onEditObstacle={editObstacle}
          lookAtAgentId={lookAtAgentId}
          onToggleLookAtAgent={toggleLookAtAgent}
          onCancelLookAtAgent={cancelLookAtAgent}
          onBeginEntityEdit={beginCanvasEdit}
          onEndEntityEdit={endCanvasEdit}
          previewAgents={previewAgents}
          previewRange={previewRange}
          previewObstacle={previewObstacle}
        />

        <section className={styles.runtimeCard} aria-labelledby="build-tools-title">
          <h2 className={styles.runtimeTitle} id="build-tools-title">
            <Wrench size={20} aria-hidden="true" />
            Build Tools
          </h2>

          <div className={`${styles.runtimeOptions} ${styles.buildToolActions}`}>
            <button
              className={`${styles.secondaryAction} ${styles.runtimeOptionButton}`}
              type="button"
              disabled={!canUndo}
              onClick={undoLastAction}
            >
              <Undo2 size={14} aria-hidden="true" />
              Undo
            </button>
            <button
              className={`${styles.secondaryAction} ${styles.runtimeOptionButton}`}
              type="button"
              disabled={!canRedo}
              onClick={redoLastAction}
            >
              <Redo2 size={14} aria-hidden="true" />
              Redo
            </button>
            <button
              className={`${styles.dangerAction} ${styles.runtimeOptionButton}`}
              type="button"
              disabled={agents.length === 0 && obstacles.length === 0}
              onClick={clearScenario}
            >
              <Trash2 size={14} aria-hidden="true" />
              Clear
            </button>
            <button
              className={`${styles.secondaryAction} ${styles.runtimeOptionButton} ${styles.buildToolComingSoon}`}
              type="button"
              disabled
            >
              Layer System Coming Soon...
            </button>
          </div>
        </section>
      </section>
    );
  }

  function renderScenarioInspector() {
    const FormComponent = getFormComponent(inspectorMode);
    const selectedAgent = selection?.entityType === ENTITY_TYPES.AGENT
      ? agents.find((agent) => agent.id === selection.id)
      : null;
    const selectedObstacle = selection?.entityType === ENTITY_TYPES.OBSTACLE
      ? obstacles.find((obstacle) => obstacle.id === selection.id)
      : null;
    const agentEditValues = selectedAgent
      ? {
          name: selectedAgent.name,
          x: String(selectedAgent.x),
          y: String(selectedAgent.y),
          speed: String(selectedAgent.speed),
          angle: String(selectedAgent.angle),
          color: selectedAgent.colorHex,
          showFOV: selectedAgent.showFOV,
          fovRadius: String(selectedAgent.fovRadius),
          fovAngle: String(selectedAgent.fovAngle),
        }
      : null;
    const obstacleEditValues = selectedObstacle
      ? {
          shape: selectedObstacle.shapeType,
          name: selectedObstacle.name,
          color: selectedObstacle.color,
          centerX: String(selectedObstacle.center?.x ?? 250),
          centerY: String(selectedObstacle.center?.y ?? 250),
          radius: String(selectedObstacle.radius ?? 50),
          vertices: selectedObstacle.vertices?.map((vertex) => ({
            x: String(vertex.x),
            y: String(vertex.y),
          })) ?? [],
        }
      : null;

    return (
      <WorkspaceInspector>
        <div className={styles.inspectorContent}>
          {inspectorMode === INSPECTOR_MODES.ADD_AGENT && FormComponent ? (
            <FormComponent
              onRegeneratePreview={regenerateAgentPreview}
              onUpdatePreviewAppearance={updateAgentPreviewAppearance}
              onSubmit={createAgents}
              onCancel={cancelAgentCreation}
            />
          ) : inspectorMode === INSPECTOR_MODES.ADD_OBSTACLE && FormComponent ? (
            <FormComponent
              onUpdatePreview={updateObstaclePreview}
              onClearPreview={clearObstaclePreview}
              onSubmit={createObstacle}
              onCancel={cancelObstacleCreation}
            />
          ) : inspectorMode === INSPECTOR_MODES.EDIT_AGENT && selectedAgent && FormComponent ? (
            <FormComponent
              key={selectedAgent.id}
              mode={FORM_MODES.EDIT}
              initialValues={agentEditValues}
              onSubmit={applyAgentEdits}
              onCancel={() => selectEntity(null)}
              onDelete={deleteSelectedEntity}
            />
          ) : inspectorMode === INSPECTOR_MODES.EDIT_OBSTACLE && selectedObstacle && FormComponent ? (
            <FormComponent
              key={selectedObstacle.id}
              mode={FORM_MODES.EDIT}
              initialValues={obstacleEditValues}
              onSubmit={applyObstacleEdits}
              onCancel={() => selectEntity(null)}
              onDelete={deleteSelectedEntity}
            />
          ) : (
            <div className={styles.inspectorBuild}>
              <h3 className={styles.inspectorBuildTitle}>
                {agents.length === 0 && obstacles.length === 0
                  ? 'Build Your Scenario'
                  : 'Nothing Selected'}
              </h3>
              <p className={styles.inspectorBuildInstruction}>
                {agents.length === 0 && obstacles.length === 0
                  ? 'Add an entity to begin building the scenario.'
                  : 'Select an entity to edit it, or add another entity.'}
              </p>
              <AddToSimulationMenu
                entityTypes={BUILDER_ENTITY_TYPES}
                showBehaviors={false}
                triggerLabel="Scenario Components"
                onSelectMode={setInspectorMode}
              />
            </div>
          )}
        </div>
      </WorkspaceInspector>
    );
  }

  return (
    <div className={styles.simulationPage}>
      {showImportConfirmation && (
        <AlertBox
          title="Import Scenario?"
          primMessage="Your current Scenario will be replaced."
          secMessage="Unsaved changes and edit history will be permanently discarded."
          type="warning"
          confirmLabel="Import Scenario"
          cancelLabel="Cancel"
          onConfirm={importScenario}
          onCancel={() => {
            pendingScenarioFileRef.current = null;
            setShowImportConfirmation(false);
          }}
        />
      )}

      {pendingNavigation && (
        <AlertBox
          title="Wait! Before You Leave..."
          primMessage="Did you save your scenario? Your changes will not be saved unless you download them as a JSON file."
          secMessage="If you already downloaded it, you're all set and can ignore this reminder."
          type="warning"
          confirmLabel="Continue Anyway"
          cancelLabel="Stay Here"
          onConfirm={continueScenarioExit}
          onCancel={() => setPendingNavigation(null)}
        />
      )}

      {scenarioFileAlert && (
        <AlertBox
          title={scenarioFileAlert.title}
          primMessage={scenarioFileAlert.primary}
          secMessage={scenarioFileAlert.secondary}
          type={scenarioFileAlert.type}
          confirmLabel="Got It"
          cancelLabel="Close"
          onConfirm={() => setScenarioFileAlert(null)}
          onCancel={() => setScenarioFileAlert(null)}
        />
      )}

      <Header title="Scenario Builder" subtitle="3rd Generation" />

      <input
        ref={scenarioFileInputRef}
        className={styles.visuallyHidden}
        type="file"
        accept=".json,application/json"
        onChange={requestScenarioImport}
      />

      <main className={styles.simulationArea} aria-label="Scenario Builder workspace">
        {renderScenarioExplorer()}
        {renderScenarioBuilderCanvas()}
        {renderScenarioInspector()}
      </main>

      <Footer />
    </div>
  );
}
