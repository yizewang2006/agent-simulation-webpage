import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Simulation from "./pages/Simulation";
import Landing from "./pages/Landing";
import LandingLegacy from "./pages/LandingLegacy";
import Tutorial from "./pages/Tutorial"
import Playback from "./pages/Playback";
import ScenarioBuilder from "./pages/ScenarioBuilder";
import NavigationLoading from "./pages/NavigationLoading";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing-legacy" element={<LandingLegacy />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/scenario-builder" element={<ScenarioBuilder />} />
        <Route path="/playback" element={<Playback />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/loading" element={<NavigationLoading />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
