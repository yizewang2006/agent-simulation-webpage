import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Simulation from "./Simulation";
import LandingPage from "./LandingPage";
import Tutorial from "./Tutorial"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/tutorial" element={<Tutorial />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;