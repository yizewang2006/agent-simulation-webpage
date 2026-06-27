import { ArrowDownToLine, Circle, MonitorPlay, Square, SquareArrowOutUpRight } from 'lucide-react';

export default function RecordingCard({
  isRecording,
  hasRecording,
  recordings,
  message,
  onStartRecording,
  onStopRecording,
  onOpenPlayback,
  onDownloadRecording,
}) {
  return (
    <div className="panel-card recording-card">
      <h2 className="panel-section-title title-with-icon">
        <MonitorPlay className="section-title-icon" size={18} aria-hidden="true" />
        Playback System
      </h2>

      <div className="recording-status-row">
        <span className="recording-status-label">STATUS:</span>
        <span className={`recording-status-badge ${isRecording ? 'recording' : 'standby'}`}>
          {isRecording ? 'RECORDING' : 'STANDBY'}
        </span>
      </div>

      <div className="recording-actions">
        <button
          className="btn-primary recording-action-btn"
          disabled={isRecording}
          onClick={onStartRecording}
        >
          <Circle className="recording-btn-icon" size={14} fill="currentColor" aria-hidden="true" />
          Start Recording
        </button>

        <button
          className="btn-danger recording-action-btn"
          disabled={!isRecording}
          onClick={onStopRecording}
        >
          <Square className="recording-btn-icon" size={14} fill="currentColor" aria-hidden="true" />
          Stop Recording
        </button>
      </div>

      {message && (
        <p className="recording-inline-message" role="status">
          {message}
        </p>
      )}
      
      <div className="recording-section-divider" aria-hidden="true"></div>

      <div className="recording-list-section">
        <div className="recording-list-heading">AVAILABLE RECORDINGS</div>
        {hasRecording && recordings.map((recording) => (
          <div key={recording.id} className="recording-summary">
              <div className="recording-summary-info">
                <span className="recording-summary-name">{recording.name}</span>
                <span className="recording-summary-frames">{recording.frames.length} Frames</span>
              </div>
              <div className="recording-summary-actions">
                <button
                  className="btn-secondary recording-summary-button"
                  onClick={() => onOpenPlayback(recording)}
                >
                  Open Playback
                  <SquareArrowOutUpRight className="button-icon" size={14} aria-hidden="true" />
                </button>
                <button
                  className="btn-secondary recording-summary-button"
                  onClick={() => onDownloadRecording(recording)}
                >
                  Download
                  <ArrowDownToLine className="button-icon" size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        {!hasRecording && (
          <p className="recording-empty-state">No recording found</p>
        )}
      </div>
    </div>
  );
}
