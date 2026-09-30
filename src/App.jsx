import React from 'react';
import SuperResolutionPanel from './components/srm/SuperResolutionPanel';
import './styles/index.css';

function App() {
  return (
    <div className="app-container" style={{ backgroundColor: '#111', color: '#eaeaea', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }}>
      <SuperResolutionPanel />
    </div>
  );
}

export default App;