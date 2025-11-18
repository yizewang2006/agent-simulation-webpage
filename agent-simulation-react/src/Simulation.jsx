import Header from "./Header";
/* 
These imports ensures the correct styles and components are included for the Simulation page.
*/
import './simulation.css';
import { useRef, useEffect } from 'react'; /* To interact with the canvas we have to use useRef and useEffect*/
import SelectableList from "./components/SelectableList"; // selectable list component
import Instruction from "./components/instruction"; // instruction component

function Simulation() {
  /* Canvas */
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /* create the canvas */
    const ctx = canvas.getContext('2d'); // same thing as the HTML version
    canvas.width = 1000;
    canvas.height = 1000;
  }, []);

  return (
    <div className="simulation-page"> 
        <Header />
        <div className="simulation-container">
          <div className="canvas-section"><canvas ref={canvasRef} className="simulation-canvas"></canvas></div>
          <div className="control-panel">
            <h1>Control Panel</h1>
          </div>
        </div>
    </div>
  );
}

export default Simulation;