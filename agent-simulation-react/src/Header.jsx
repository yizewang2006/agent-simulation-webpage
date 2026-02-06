// Renders the header section with logo and titles
import oxfordLogo from './assets/OXFD_shield_hz_rv.png'; // importing the Oxford logo image
import './layout.css'; // importing the shared CSS for layout styling

export default function Header() {
  return (
    <header className="emory-header">
      <div className="emory-header-inner">
        <a href='https://www.oxford.emory.edu' target='_blank' rel='noopener noreferrer'>
          <img src={oxfordLogo} alt="Emory Logo" className="emory-logo" />
        </a>
        <div className="header-text">
          <h1 className="header-title">Agent Simulation Project</h1>
          <p className="header-subtitle">Dr. Hai Hoang Le | Yize (Kevin) Wang | Hanyi (Elaine) Ding</p>
        </div>
      </div>
    </header>
  );
}