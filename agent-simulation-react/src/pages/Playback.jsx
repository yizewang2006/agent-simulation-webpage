import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, FileUp, MonitorPlay, Pause, Play, House } from 'lucide-react';
import Header from '../components/simulation-3rd-gen/Header3rdGen.jsx';
import Footer from '../components/shared/Footer.jsx';
import AlertBox from '../components/simulation/AlertBox.jsx';
import '../styles/playback.css';
import { configureHighDpiCanvas, getCanvasLogicalHeight, getCanvasLogicalWidth } from '../utils/utilities.js';
import { OBSTACLE_SHAPE_TYPES } from '../utils/constants.js';

const PLAYBACK_CANVAS_WIDTH = 500;
const PLAYBACK_CANVAS_HEIGHT = 500;

// Offset for virtual copies
function getVirtualOffsets(agent, canvasWidth, canvasHeight) {
  const range = agent.radius + (agent.showFOV ? agent.fovRadius : 0);
  const offsets = [{ x: 0, y: 0 }];
  let horizontalOffset = 0;
  let verticalOffset = 0;

  // Add wrap-around copies when the recorded visual range crosses a canvas edge.
  if (agent.x + range > canvasWidth) {
    horizontalOffset = -canvasWidth;
  } else if (agent.x - range < 0) {
    horizontalOffset = canvasWidth;
  }

  if (agent.y + range > canvasHeight) {
    verticalOffset = -canvasHeight;
  } else if (agent.y - range < 0) {
    verticalOffset = canvasHeight;
  }

  if (horizontalOffset !== 0) offsets.push({ x: horizontalOffset, y: 0 });
  if (verticalOffset !== 0) offsets.push({ x: 0, y: verticalOffset });
  if (horizontalOffset !== 0 && verticalOffset !== 0) {
    offsets.push({ x: horizontalOffset, y: verticalOffset });
  }

  return offsets;
}

function drawAgentSnapshot(ctx, agent, canvasWidth, canvasHeight) {
  // Draw the original agent plus any virtual wrap-around copies it needs.
  getVirtualOffsets(agent, canvasWidth, canvasHeight).forEach((offset) => {
    drawAgentSnapshotAtOffset(ctx, agent, offset);
  });
}

function drawAgentSnapshotAtOffset(ctx, agent, offset) {
  const x = agent.x + offset.x;
  const y = agent.y + offset.y;

  // Draw the recorded FOV wedge directly from snapshot data.
  if (agent.showFOV) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(
      x,
      y,
      agent.fovRadius,
      agent.angle - agent.fovAngle / 2,
      agent.angle + agent.fovAngle / 2
    );
    ctx.fillStyle = 'rgba(0, 0, 255, 0.2)';
    ctx.fill();
    ctx.closePath();
  }

  // Draw the recorded agent body.
  ctx.beginPath();
  ctx.arc(x, y, agent.radius, 0, Math.PI * 2);
  ctx.strokeStyle = agent.colorHex;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();

  // Draw the recorded heading line.
  const endX = x + Math.cos(agent.angle) * agent.radius * 2;
  const endY = y + Math.sin(agent.angle) * agent.radius * 2;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = agent.colorHex;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}

function drawSnapshotLabel(ctx, label, x, y) {
  ctx.font = '600 15px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.strokeText(label, x, y);
  ctx.fillStyle = '#fff';
  ctx.fillText(label, x, y);
  ctx.textBaseline = 'alphabetic';
}

function drawObstacleSnapshot(ctx, obstacle) {
  if (obstacle.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE) {
    drawCircleObstacleSnapshot(ctx, obstacle);
    return;
  }

  if (obstacle.shapeType === OBSTACLE_SHAPE_TYPES.POLYGON) {
    drawPolygonObstacleSnapshot(ctx, obstacle);
  }
}

function drawCircleObstacleSnapshot(ctx, obstacle) {
  if (!obstacle.center || !Number.isFinite(obstacle.radius)) return;

  ctx.beginPath();
  ctx.arc(obstacle.center.x, obstacle.center.y, obstacle.radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = obstacle.color;
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();
  drawSnapshotLabel(ctx, obstacle.id, obstacle.center.x, obstacle.center.y);
}

function drawPolygonObstacleSnapshot(ctx, obstacle) {
  if (!Array.isArray(obstacle.vertices) || obstacle.vertices.length < 3) return;

  ctx.beginPath();
  ctx.moveTo(obstacle.vertices[0].x, obstacle.vertices[0].y);
  for (let i = 1; i < obstacle.vertices.length; i++) {
    ctx.lineTo(obstacle.vertices[i].x, obstacle.vertices[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = obstacle.color;
  ctx.fill();
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.stroke();

  const centroid = obstacle.vertices.reduce(
    (sum, vertex) => ({ x: sum.x + vertex.x, y: sum.y + vertex.y }),
    { x: 0, y: 0 }
  );
  drawSnapshotLabel(
    ctx,
    obstacle.id,
    centroid.x / obstacle.vertices.length,
    centroid.y / obstacle.vertices.length
  );
}

function drawFrame(canvas, frame) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const canvasWidth = getCanvasLogicalWidth(canvas);
  const canvasHeight = getCanvasLogicalHeight(canvas);

  // Clear the old frame before drawing the requested recorded frame.
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  if (!frame) return;

  (frame.obstacles ?? []).forEach((obstacle) => drawObstacleSnapshot(ctx, obstacle));
  (frame.agents ?? []).forEach((agent) => drawAgentSnapshot(ctx, agent, canvasWidth, canvasHeight));
}

export default function Playback() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const recordingFileInputRef = useRef(null);
  const [recording, setRecording] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileError, setFileError] = useState('');

  const frameCount = Array.isArray(recording?.frames) ? recording.frames.length : 0;
  const hasRecording = frameCount > 0;
  const frameLabel = hasRecording ? `${currentFrame + 1} / ${frameCount}` : '0 / 0';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match the main simulation canvas: high physical pixels, stable 500x500 logical coordinates.
    configureHighDpiCanvas(canvas, ctx, PLAYBACK_CANVAS_WIDTH, PLAYBACK_CANVAS_HEIGHT);
  }, []);

  useEffect(() => {
    window.loadRecording = (recordingData) => {
      const frames = Array.isArray(recordingData)
        ? recordingData
        : recordingData?.frames ?? [];

      setRecording(Array.isArray(recordingData) ? { frames } : { ...recordingData, frames });
      setCurrentFrame(0);
      setIsPlaying(false);
    };

    return () => {
      delete window.loadRecording;
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || !hasRecording) return;

    // Advance frames at the FPS captured with the recording.
    const intervalMs = 1000 / (recording?.fps || 30);
    const timer = window.setInterval(() => {
      setCurrentFrame((frame) => {
        // Stop automatically when playback reaches the final frame.
        if (frame >= frameCount - 1) {
          setIsPlaying(false);
          return frame;
        }

        return frame + 1;
      });
    }, intervalMs);

    // Clear the old timer when playback pauses, FPS changes, or the page closes.
    return () => window.clearInterval(timer);
  }, [isPlaying, hasRecording, frameCount, recording?.fps]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasRecording) return;

    // Repaint whenever the active recording or frame index changes.
    drawFrame(canvas, recording.frames[currentFrame]);
  }, [recording, currentFrame, hasRecording]);

  function goToPreviousFrame() {
    setCurrentFrame((frame) => Math.max(0, frame - 1));
  }

  function goToNextFrame() {
    setCurrentFrame((frame) => Math.min(frameCount - 1, frame + 1));
  }

  function handleBackToSimulation() {
    // A Playback tab opened by Simulation can close itself without reloading
    // the still-running Simulation page underneath it.
    if (window.opener && !window.opener.closed) {
      window.close();
      return;
    }

    // Direct visits have no opener, so provide a safe navigation fallback.
    navigate('/loading', {
      state: {
        from: 'Playback',
        to: 'Main Simulation',
        path: '/simulation-3rd-gen',
      },
    });
  }

  function handleBackToMainPage() {
    // When Playback was opened from Simulation, send the original tab to the
    // landing page first, then close this Playback tab.
    if (window.opener && !window.opener.closed) {
      window.opener.location.href = '/';
      window.close();
      return;
    }

    // Direct visits have no opener, so navigate within the current tab.
    navigate('/loading', {
      state: {
        from: 'Playback',
        to: 'Main Page',
        path: '/',
      },
    });
  }

  function applyRecording(recordingData) {
    const frames = Array.isArray(recordingData) ? recordingData : recordingData?.frames;
    if (!Array.isArray(frames) || frames.length === 0) {
      throw new Error('The recording file does not contain any playback frames.');
    }

    setRecording(Array.isArray(recordingData) ? { frames } : { ...recordingData, frames });
    setCurrentFrame(0);
    setIsPlaying(false);
  }

  async function handleRecordingFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      if (!file.name.toLowerCase().endsWith('.json')) {
        throw new Error('Recording files must use the .json extension.');
      }
      applyRecording(JSON.parse(await file.text()));
      setFileError('');
    } catch (error) {
      setFileError(error instanceof SyntaxError
        ? 'The selected file does not contain valid JSON.'
        : error.message);
    }
  }

  return (
    <div className="playback-page">
      {fileError && (
        <AlertBox
          title="Unable to Load Recording"
          primMessage={fileError}
          secMessage="Choose a valid recording JSON file and try again."
          type="warning"
          confirmLabel="OK"
          cancelLabel="Close"
          onConfirm={() => setFileError('')}
          onCancel={() => setFileError('')}
        />
      )}
      <Header title="Playback Window" />
      <main className="playback-main">
        <section className="playback-shell">
          <div className="playback-canvas-wrap">
            <canvas
              ref={canvasRef}
              className="playback-canvas"
              width={PLAYBACK_CANVAS_WIDTH}
              height={PLAYBACK_CANVAS_HEIGHT}
            ></canvas>
          </div>

          <div className="playback-controls">
            <div className="playback-control-header">
              <h1 className="playback-title">
                <MonitorPlay className="playback-title-icon" size={20} aria-hidden="true" />
                Playback
              </h1>
              <span className={`playback-status ${hasRecording ? 'ready' : 'empty'}`}>
                {hasRecording ? 'READY' : 'NO RECORDING'}
              </span>
            </div>

            <div className="playback-frame-row">
              <span className="playback-frame-label">FRAME</span>
              <span className="playback-frame-count">{frameLabel}</span>
            </div>

            <div className="playback-button-row">
              <button
                className="playback-button"
                disabled={!hasRecording || currentFrame === 0}
                onClick={goToPreviousFrame}
                aria-label="Previous frame"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button
                className="playback-button playback-button-main"
                disabled={!hasRecording}
                onClick={() => setIsPlaying((playing) => !playing)}
                aria-label={isPlaying ? 'Pause playback' : 'Play playback'}
              >
                {isPlaying ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
              </button>
              <button
                className="playback-button"
                disabled={!hasRecording || currentFrame >= frameCount - 1}
                onClick={goToNextFrame}
                aria-label="Next frame"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>

            <input
              className="playback-slider"
              type="range"
              min="0"
              max={Math.max(0, frameCount - 1)}
              value={currentFrame}
              disabled={!hasRecording}
              onChange={(event) => {
                setIsPlaying(false);
                setCurrentFrame(Number(event.target.value));
              }}
            />

            <div className="playback-section-divider" aria-hidden="true" />

            <div className="playback-input-group">
              <label>Have a recording file? Upload and play it:</label>
              <input
                ref={recordingFileInputRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={handleRecordingFile}
              />
              <button
                className="btn-secondary icon-button"
                type="button"
                onClick={() => recordingFileInputRef.current?.click()}
              >
                <FileUp className="button-icon" size={16} aria-hidden="true" />
                Upload Recording JSON
              </button>
            </div>

            <button
              className="btn-secondary icon-button playback-back-button"
              type="button"
              onClick={handleBackToSimulation}
            >
              <ArrowLeft className="button-icon" size={16} aria-hidden="true" />
              Back to Simulation
            </button>

            <button
              className="btn-secondary icon-button playback-back-button"
              type="button"
              onClick={handleBackToMainPage}
            >
              <House className="button-icon" size={16} aria-hidden="true" />
              Back to Main Page
            </button>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
