import Header from "../components/shared/Header.jsx";
import Footer from "../components/shared/Footer.jsx";
import { useNavigate } from "react-router-dom";
import '../styles/simulation.css';
import '../styles/landing-legacy.css';
import haiPhoto from '../assets/headshots/hai_le_prof-2.jpg';
import kevinPhoto from '../assets/headshots/DSC01602.jpg';

export default function LandingLegacy() {
  const navigate = useNavigate();

  return (
    <div className="simulation-page">
      <Header title="Agent Simulation Project" />

      <div className="landing-content">
        <section className="landing-goal">
          <h2>Our Goal</h2>
          <p>
            Make agent-based simulation easier to use by bringing scenario design, behavior modeling,
            and emergent pattern exploration into a browser-based WebApp that requires no software
            installation or programming background.
          </p>
        </section>

        <h2 className="landing-subtitle">Updated July 12th, 2026</h2>

        <div className="landing-profiles">
          <div className="landing-profile">
            <img src={haiPhoto} alt="Dr. Hai Hoang Le" className="landing-photo" />
            <p className="landing-name">Dr. Hai Hoang Le</p>
            <p className="landing-role">Assistant Professor/Mentor<br />Oxford College of Emory University</p>
          </div>
          <div className="landing-profile">
            <img src={kevinPhoto} alt="Yize (Kevin) Wang" className="landing-photo" />
            <p className="landing-name">Yize (Kevin) Wang</p>
            <p className="landing-role">Student<br />Emory University</p>
          </div>
        </div>

        <div className="landing-buttons">
          <button className="btn-primary landing-btn" onClick={() => navigate('/simulation')}>
            Launch Simulation
            <span className="landing-btn-badge">Sandbox</span>
          </button>

          <button className="btn-secondary landing-btn" onClick={() => navigate('/scenario-builder')}>
            Scenario Configuration
            <span className="landing-btn-badge">New</span>
          </button>

          <button className="btn-secondary landing-btn" onClick={() => navigate('/tutorial')}>
            Tutorial / Manual
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
