import { useNavigate } from "react-router-dom";

// This JSX file loads the legacy simulation built with Villa HTML
function Simulation1stGen() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: "3rem" }}>
      <h1>Legacy Agent Simulation</h1>
      <p>Hello User, Please click the following button to access the Legacy simulation built on Villa HTML</p>
      <p>Please beware that this version will no longer be supported, nor does it represent the real quality of the simulation</p>
      <a href="/simulation-legacy/index.html" target="_blank" rel="noopener noreferrer">
        <button>Open Legacy Simulation</button>
      </a>
      <a>
        <button onClick={() => navigate('/loading', {
            state: { from: 'Simulation 1st Gen', to: 'Home Page', path: '/' },
          })}>
            Back to Home Page
          </button>
      </a>
    </div>
  );
}

export default Simulation1stGen;
