// Renders the footer section with copyright text
import '../../styles/layout.css';

export default function Footer() {
  const buildDate = new Date(import.meta.env.VITE_BUILD_DATE);
  const updatedDate = Number.isNaN(buildDate.getTime())
    ? 'not long ago'
    : new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(buildDate);

  return (
    <footer className="emory-footer">
      Agent Simulation Project · Updated {updatedDate}
    </footer>
  );
}
