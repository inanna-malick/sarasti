import React from 'react';
import type { Scenario } from '../../../src/scenario/types';

interface Props {
  scenarios: Scenario[];
  onSelect: (scenario: Scenario) => void;
}

export function ScenarioSelector({ scenarios, onSelect }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        fontFamily: 'monospace',
        padding: '40px',
      }}
    >
      <h1
        style={{
          color: '#fff',
          fontSize: '24px',
          letterSpacing: '4px',
          marginBottom: '48px',
          fontWeight: 400,
          textTransform: 'uppercase',
        }}
      >
        Select Scenario
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)',
          gap: '24px',
          width: '100%',
          maxWidth: '900px',
          aspectRatio: '16/9',
        }}
      >
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            onClick={() => onSelect(scenario)}
            className="scenario-card"
            style={{
              background: '#151515',
              border: '1px solid #222',
              borderRadius: '8px',
              padding: '32px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <h2
              style={{
                color: '#fff',
                fontSize: '20px',
                margin: '0 0 12px 0',
                fontWeight: 500,
              }}
            >
              {scenario.title}
            </h2>
            <p
              style={{
                color: '#888',
                fontSize: '14px',
                margin: '0 0 24px 0',
                lineHeight: '1.5',
              }}
            >
              {scenario.subtitle}
            </p>
            <div
              style={{
                color: '#555',
                fontSize: '12px',
                marginTop: 'auto',
              }}
            >
              DURATION: {Math.floor(scenario.duration)}s
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .scenario-card:hover {
          border-color: #333 !important;
          background: #1a1a1a !important;
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.03);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
