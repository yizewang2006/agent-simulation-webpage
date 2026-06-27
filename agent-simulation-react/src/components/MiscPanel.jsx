import { useNavigate } from 'react-router-dom';
import { Link2, RefreshCw, SquareArrowOutUpRight, Undo2 } from 'lucide-react';

export default function MiscPanel() {
  const navigate = useNavigate();
  return (
    <div className="panel-card">
      <h2 className="panel-section-title title-with-icon">
        <Link2 className="section-title-icon" size={18} aria-hidden="true" />
        Miscellaneous
      </h2>
      <div className="input-group">
        <button className="btn-danger icon-button" onClick={() => window.location.reload()}>
          <RefreshCw className="button-icon" size={16} aria-hidden="true" />
          Reset Simulation
        </button>
      </div>
      <div className="input-group">
        <button className="btn-secondary icon-button" onClick={() => navigate('/')}>
          <Undo2 className="button-icon" size={16} aria-hidden="true" />
          Back to Main Page
        </button>
      </div>
      <div className="input-group">
        <button className="btn-secondary icon-button" onClick={() => window.open('/simulation-legacy/index.html', '_blank', 'noopener,noreferrer')}>
          Open Legacy Simulation
          <SquareArrowOutUpRight className="button-icon" size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="input-group">
        <label>Collision Time Use Only</label>
        <button className="btn-secondary" onClick={() => window.open('/collsion-time-simulation/index.html', '_blank', 'noopener,noreferrer')}>Collison Time Simulation</button>
      </div>
    </div>
  );
}