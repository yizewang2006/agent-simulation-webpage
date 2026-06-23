import LandingHeader from "./components/LandingHeader.jsx";
import Footer from "./components/Footer.jsx";
import { useNavigate } from "react-router-dom";
import './simulation.css';
import './landing.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="simulation-page">
      <LandingHeader />

      <div className="landing-content">
        <h1 className="landing-title">Agent Simulation Project</h1>

        <div className="landing-profiles">
          <div className="landing-profile">
            <div className="landing-photo-placeholder">Photo</div>
            <p className="landing-name">Dr. Hai Hoang Le</p>
            <p className="landing-role">Assistant Professor/Mentor<br />Oxford College of Emory University</p>
          </div>
          <div className="landing-profile">
            <div className="landing-photo-placeholder">Photo</div>
            <p className="landing-name">Yize (Kevin) Wang</p>
            <p className="landing-role">Student<br />Emory University</p>
          </div>
        </div>

        <div className="landing-buttons">
          <button className="btn-primary landing-btn" onClick={() => navigate('/simulation')}>
            Launch Simulation
          </button>

          <button className="btn-secondary landing-btn" disabled>
            Tutorial / Manual
            <span className="landing-btn-badge">Coming Soon</span>
          </button>

          <button
            className="btn-secondary landing-btn"
            onClick={() => window.open('/simulation-legacy/index.html', '_blank', 'noopener,noreferrer')}
          >
            Legacy Simulation
            <span className="landing-btn-badge landing-btn-badge-warn">Outdated</span>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
