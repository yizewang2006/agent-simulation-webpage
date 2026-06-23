import oxfordLogo from '../assets/OXFD_shield_hz_rv.png';
import '../layout.css';

export default function LandingHeader() {
  return (
    <header className="emory-header">
      <div className="emory-header-inner">
        <a href='https://www.oxford.emory.edu' target='_blank' rel='noopener noreferrer'>
          <img src={oxfordLogo} alt="Emory Oxford Logo" className="emory-logo" />
        </a>
      </div>
    </header>
  );
}
