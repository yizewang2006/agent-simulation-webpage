// Renders the footer section with copyright text
import '../../styles/layout.css';
import { updatedDate } from '../../utils/buildDate.js';

export default function Footer() {
  return (
    <footer className="emory-footer">
      Agent Simulation Project · Updated {updatedDate}
    </footer>
  );
}
