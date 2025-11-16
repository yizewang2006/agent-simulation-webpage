import emoryLogo from './assets/EU_shield_hz_rv.png';
import './header.css';

export default function Header() {
  return (
    <header className="emory-header">
      <div className="emory-header-inner">
        <img src={emoryLogo} alt="Emory Logo" className="emory-logo" />
        <div className="header-text">
          <h1 className="header-title">Agent Simulation Project</h1>
          <p className="header-subtitle">React Version - Updated Nov. 15th by Kevin</p>
        </div>
      </div>
    </header>
  );
}