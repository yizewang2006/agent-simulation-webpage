import { useNavigate } from 'react-router-dom';
import { ArrowDown, Blocks, CircleDot, MousePointer2, Network, Play, Route, SkipForward, UserRound, Users, MonitorPlay } from 'lucide-react';
import Header from '../components/shared/Header.jsx';
import Footer from '../components/shared/Footer.jsx';
import '../styles/simulation.css';
import '../styles/landing.css';
import haiPhoto from '../assets/headshots/hai_le_prof-2.jpg';
import kevinPhoto from '../assets/headshots/DSC01602.jpg';
import elainePhoto from '../assets/headshots/elaine_photo-2.jpg';

const featureCards = [
  {
    icon: Users,
    title: 'Create Agents',
    text: 'Place individual agents, tune their properties, and watch local rules shape collective movement.',
  },
  {
    icon: Blocks,
    title: 'Build Worlds',
    text: 'Add circular and polygonal obstacles to test how spatial conditions change emergent behavior.',
  },
  {
    icon: Network,
    title: 'Define Behaviors',
    text: 'Combine self- and neighbor-based references, offsets, and filters into reusable behavior rules.',
  },
];

function scrollToSection(targetId) {
  document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ScrollCue({ targetId, label, icon: Icon }) {
  return (
    <button
      className="fancy-continue-cue"
      type="button"
      onClick={() => scrollToSection(targetId)}
    >
      <span>{label}</span>
      <span className="fancy-continue-icon">
        <Icon size={18} aria-hidden="true" />
      </span>
    </button>
  );
}

function ScrollCueGroup({ nextTargetId, showSkip = true }) {
  return (
    <div className="fancy-continue-group">
      <ScrollCue targetId={nextTargetId} label="Continue Exploring" icon={ArrowDown} />
      {showSkip && (
        <ScrollCue targetId="fancy-launch" label="Skip to Actions" icon={SkipForward} />
      )}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="fancy-page">
      <Header title="Agent Simulation Project" />

      <main className="fancy-scroll">
        <section className="fancy-section fancy-welcome-section" id="fancy-welcome">
          <div className="fancy-agent-field" aria-hidden="true">
            <span className="fancy-agent fancy-agent-one" />
            <span className="fancy-agent fancy-agent-two" />
            <span className="fancy-agent fancy-agent-three" />
            <span className="fancy-obstacle fancy-obstacle-one" />
            <span className="fancy-obstacle fancy-obstacle-two" />
          </div>

          <div className="fancy-section-content fancy-welcome-content">
            <p className="fancy-eyebrow">Browser-based modeling sandbox</p>
            <h1>Welcome to Agent Simulation Project</h1>
            <p>
              Explore how simple individual behaviors can create complex group-level patterns.
            </p>
            <button className="btn-primary fancy-hero-button icon-button" 
                    onClick={() => navigate('/loading', {
                      state: {
                        from: 'Home Page',
                        to: 'Main Simulation',
                        path: '/simulation',
                      },
                    })}>
              <Play className="button-icon" size={18} aria-hidden="true" />
              Start Simulating
            </button>
          </div>
          <ScrollCueGroup nextTargetId="fancy-goal" />
        </section>

        <section className="fancy-section" id="fancy-goal">
          <div className="fancy-section-content fancy-goal-content">
            <p className="fancy-eyebrow">Our Goal</p>
            <h2>Make agent-based simulation easier to use.</h2>
            <p>
              We bring scenario design, behavior modeling, and emergent pattern exploration into a
              browser-based WebApp that requires no software installation or programming background.
            </p>
            <div className="fancy-status-row">
              <span>No installation</span>
              <span>Cloud-compatible</span>
              <span>Updated July 12th, 2026</span>
            </div>
          </div>
          <ScrollCueGroup nextTargetId="fancy-features" />
        </section>

        <section className="fancy-section" id="fancy-features">
          <div className="fancy-section-content">
            <p className="fancy-eyebrow">What You Can Do</p>
            <h2>Design scenarios, then watch the system respond.</h2>
            <div className="fancy-feature-grid">
              {featureCards.map(({ icon: Icon, title, text }) => (
                <article className="fancy-feature-card" key={title}>
                  <Icon size={26} aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
          <ScrollCueGroup nextTargetId="fancy-team" />
        </section>

        <section className="fancy-section" id="fancy-team">
          <div className="fancy-section-content">
            <p className="fancy-eyebrow">Meet Our Team</p>
            <h2>Built at Oxford College of Emory University.</h2>
            <div className="fancy-team-grid">
              <article className="fancy-team-card">
                <img src={haiPhoto} alt="Dr. Hai Hoang Le" />
                <h3>Dr. Hai Hoang Le</h3>
                <p>Assistant Professor/Mentor</p>
                <span>Oxford College of Emory University</span>
              </article>
              <article className="fancy-team-card">
                <img src={kevinPhoto} alt="Yize (Kevin) Wang" />
                <h3>Yize (Kevin) Wang</h3>
                <p>Student</p>
                <span>Emory University</span>
              </article>
              <article className="fancy-team-card">
                {/* <div className="fancy-team-photo-placeholder" role="img" aria-label="Contributor photo placeholder">
                  <UserRound size={56} aria-hidden="true" />
                </div> */}
                <img src={elainePhoto} alt="Hanyi (Elaine) Ding" />
                <h3>Hanyi (Elaine) Ding</h3>
                <p>Student</p>
                <span>Emory University</span>
              </article>
            </div>
          </div>
          <ScrollCueGroup nextTargetId="fancy-launch" showSkip={false} />
        </section>

        <section className="fancy-section" id="fancy-launch">
          <div className="fancy-section-content fancy-launch-content">
            <p className="fancy-eyebrow">Start Exploring</p>
            <h2>Choose where you want to begin.</h2>
            <div className="fancy-launch-grid">
              <button className="btn-primary fancy-launch-button icon-button" onClick={() => navigate('/loading', {
                state: { from: 'Home Page', to: 'Main Simulation', path: '/simulation' },
              })}>
                <Play className="button-icon" size={18} aria-hidden="true" />
                Launch Simulation
              </button>
              <button className="btn-secondary fancy-launch-button icon-button" onClick={() => navigate('/loading', {
                state: { from: 'Home Page', to: 'Scenario Builder', path: '/scenario-builder' },
              })}>
                <MousePointer2 className="button-icon" size={18} aria-hidden="true" />
                Build Scenario
              </button>
              <button className="btn-secondary fancy-launch-button icon-button" onClick={() => navigate('/loading', {
                state: { from: 'Home Page', to: 'Tutorial', path: '/tutorial' },
              })}>
                <Route className="button-icon" size={18} aria-hidden="true" />
                Tutorial / Manual
              </button>
              <button
                className="btn-secondary fancy-launch-button icon-button"
                onClick={() => navigate('/loading', {
                  state: { from: 'Home Page', to: 'Playback', path: '/playback' },
              })}
              >
                <MonitorPlay className="button-icon" size={18} aria-hidden="true" />
                Playback
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
