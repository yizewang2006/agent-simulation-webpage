import oxfordLogo from '../../assets/logos/OXFD_shield_hz_rv.png';
import '../../styles/layout.css';

export default function Header({ title = "Agent Simulation Project" }) {
  return (
    <header className="emory-header">
      <div className="emory-header-inner">
        <a href='https://www.oxford.emory.edu' target='_blank' rel='noopener noreferrer'>
          <img src={oxfordLogo} alt="Emory Oxford Logo" className="emory-logo" />
        </a>
        <div className="header-text">
          <h1 className="header-title">{title}</h1>
          {/* <p className="header-subtitle">Dr. Hai Hoang Le | Yize (Kevin) Wang | Hanyi (Elaine) Ding</p> */}
        </div>
      </div>
    </header>
  );
}
