import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LOADING_MESSAGES } from '../utils/constants.js';
import '../styles/landing.css';
import '../styles/navigation-loading.css';

const TRANSITION_DELAY_MS = 2000;

export default function NavigationLoading() {
  const navigate = useNavigate();
  const { state, search } = useLocation();
  const query = new URLSearchParams(search);
  // Normal in-app navigation uses router state. Popup windows use query
  // parameters because a new browser window cannot inherit router state.
  const from = state?.from ?? query.get('from') ?? 'Current Page';
  const to = state?.to ?? query.get('to') ?? 'Requested Page';
  const destinationPath = state?.path ?? query.get('path') ?? '/';
  const [loadingMessage] = useState(() => (
    LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)] // Will choose a random loading message from the list each time the component is mounted.
  ));

  useEffect(() => {
    // This temporary delay makes the route transition visible. It can later be
    // replaced by a real loading operation without changing the page API.
    const transitionTimer = window.setTimeout(() => {
      navigate(destinationPath, { replace: true });
    }, TRANSITION_DELAY_MS);

    return () => window.clearTimeout(transitionTimer);
  }, [destinationPath, navigate]);

  return (
    <main className="navigation-loading-page fancy-welcome-section" aria-live="polite" aria-busy="true">
      <div className="fancy-agent-field" aria-hidden="true">
        <span className="fancy-agent fancy-agent-one" />
        <span className="fancy-agent fancy-agent-two" />
        <span className="fancy-agent fancy-agent-three" />
        <span className="fancy-obstacle fancy-obstacle-one" />
        <span className="fancy-obstacle fancy-obstacle-two" />
      </div>
      <div className="navigation-loading-content">
        <p>{loadingMessage}</p>
        <div className="loading-agent-field" aria-hidden="true">
          {/* Reuse the Landing Page agent so the visual language stays consistent. */}
          <span className="fancy-agent loading-agent" />
        </div>
        <div className="loading-progress-track" aria-hidden="true">
          <span className="loading-progress-fill" />
        </div>
        <div className="loading-progress-labels" aria-hidden="true">
          <span>{from}</span>
          <span>{to}</span>
        </div>
      </div>
    </main>
  );
}
