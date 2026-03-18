import React from 'react';
import { useStore } from '../../../src/store';

/**
 * Landing overlay: shown before playback starts.
 *
 * Dark background over the face field (faces visible behind at T=Feb 25, calm).
 * Title: "Hormuz Crisis Monitor"
 * Technical summary of the visualization.
 * "Click anywhere to begin" prompt.
 * Fades out when playback starts.
 *
 * Props:
 * - onStart: callback to begin playback
 */
interface LandingProps {
  onStart: () => void;
}

export const LANDING_CONTENT = {
  title: 'HORMUZ CRISIS MONITOR',
  subtitle: 'High-dimensional visualization of the Hormuz crisis.\nTwenty-five financial instruments rendered as 3D faces.\nExpression encodes market dynamics. Shape encodes structural identity.',
  prompt: 'click anywhere to begin',
  quote: '',
};

export function Landing({ onStart }: LandingProps) {
  const show = useStore((s) => s.showLanding);

  if (!show) return null;

  return (
    <div
      onClick={onStart}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(10, 10, 10, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 200,
        transition: 'opacity 0.8s ease-out',
        fontFamily: 'monospace',
      }}
    >
      <h1
        style={{
          color: '#e0e0e0',
          fontSize: 32,
          fontWeight: 400,
          letterSpacing: 8,
          marginBottom: 16,
        }}
      >
        HORMUZ CRISIS MONITOR
      </h1>

      <p
        style={{
          color: '#888',
          fontSize: 12,
          maxWidth: 450,
          textAlign: 'center',
          lineHeight: 1.8,
          marginBottom: 48,
        }}
      >
        High-dimensional visualization of the Hormuz crisis.
        <br />
        Twenty-five financial instruments rendered as 3D faces.
        <br />
        Expression encodes market dynamics. Shape encodes structural identity.
      </p>

      <div
        style={{
          color: '#666',
          fontSize: 11,
          letterSpacing: 3,
          textTransform: 'uppercase',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        click anywhere to begin
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
