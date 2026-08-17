import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Simulation1stGen from "./pages/Simulation1stGen";
import Simulation2ndGen from "./pages/Simulation2ndGen";
import Simulation3rdGen from "./pages/Simulation3rdGen";
import Landing from "./pages/Landing";
import LandingLegacy from "./pages/LandingLegacy";
import Tutorial from "./pages/Tutorial"
import Playback from "./pages/Playback";
import ScenarioBuilder from "./pages/ScenarioBuilder";
import ScenarioBuilder3rdGen from './pages/ScenarioBuilder3rdGen';
import NavigationLoading from "./pages/NavigationLoading";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing-legacy" element={<LandingLegacy />} />
        <Route path="/simulation" element={<Simulation3rdGen />} />
        <Route path="/simulation-1st-gen" element={<Simulation1stGen />} />
        <Route path="/simulation-2nd-gen" element={<Simulation2ndGen />} />
        <Route path="/simulation-3rd-gen" element={<Simulation3rdGen />} />
        <Route path="/scenario-builder" element={<ScenarioBuilder />} />
        <Route path="/playback" element={<Playback />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/loading" element={<NavigationLoading />} />
        <Route path="/scenario-builder-3rd-gen" element={<ScenarioBuilder3rdGen />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
