export default function ControlPanel() {
  return (
    <div style={{
      backgroundColor: '#f2f2f2',
      padding: '1rem',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      width: '240px'
    }}>
      <h2 style={{ marginBottom: '1rem' }}>Simulation Controls</h2>
      <button style={{
        padding: '0.5rem 1rem',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
      }}>
        Start Simulation
      </button>
    </div>
  );
}