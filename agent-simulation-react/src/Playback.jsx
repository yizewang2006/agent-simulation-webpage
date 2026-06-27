import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, MonitorPlay, Pause, Play } from 'lucide-react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import './playback.css';

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

function drawFrame(canvas, frame) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear the old frame before drawing the requested recorded frame.
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!frame) return;

  frame.agents.forEach((agent) => drawAgentSnapshot(ctx, agent, canvas.width, canvas.height));
}

export default function Playback() {
  const canvasRef = useRef(null);
  const [recording, setRecording] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const frameCount = Array.isArray(recording?.frames) ? recording.frames.length : 0;
  const hasRecording = frameCount > 0;
  const frameLabel = hasRecording ? `${currentFrame + 1} / ${frameCount}` : '0 / 0';

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

  return (
    <div className="playback-page">
      <Header />
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
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
