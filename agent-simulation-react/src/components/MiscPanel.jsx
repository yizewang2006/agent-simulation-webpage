import { useNavigate } from 'react-router-dom';

export default function MiscPanel() {
  const navigate = useNavigate();
  return (
    <div className="panel-card">
      <h2 className="panel-section-title">Miscellaneous</h2>
      <div className="input-group">
        <button className="btn-danger" onClick={() => window.location.reload()}>Reset Simulation</button>
      </div>
      <div className="input-group">
        <button className="btn-secondary" onClick={() => navigate('/')}>Back to Main Page</button>
      </div>
      <div className="input-group">
        <button className="btn-secondary" onClick={() => window.open('/simulation-legacy/index.html', '_blank', 'noopener,noreferrer')}>Open Legacy Simulation</button>
      </div>
      <div className="input-group">
        <label>Collision Time Use Only</label>
        <button className="btn-secondary" onClick={() => window.open('/collsion-time-simulation/index.html', '_blank', 'noopener,noreferrer')}>Collison Time Simulation</button>
      </div>
    </div>
  );
}
