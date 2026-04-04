import { TerminalPane } from './components/TerminalPane';

function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1a1a2e',
      color: '#e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{
        height: '28px',
        flexShrink: 0,
        backgroundColor: '#16213e',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '12px',
        fontSize: '13px',
        fontWeight: 600,
        color: '#a0a0b0',
        userSelect: 'none',
      }}>
        Forge
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <TerminalPane />
      </div>
    </div>
  );
}

export default App;
