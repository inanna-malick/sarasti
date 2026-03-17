import React from 'react';

export function App() {
  return (
    <div id="app" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Viewport: Three.js canvas mounts here */}
      <div id="viewport" style={{ width: '100%', height: '100%' }} />
      {/* UI layers mount on top */}
    </div>
  );
}
