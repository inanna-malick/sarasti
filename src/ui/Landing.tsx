import React from 'react';
import { useStore } from '../store';

/**
 * Landing overlay: shown before playback starts.
 *
 * Dark background over the face field (faces visible behind at T=Feb 25, calm).
 * Title: "The Tidal Scream"
 * Subtitle about the piece.
 * "Click anywhere to begin" prompt.
 * The Watts quote at the bottom.
 * Fades out when playback starts.
 *
 * Props:
 * - onStart: callback to begin playback
 */
interface LandingProps {
  onStart: () => void;
}

export const LANDING_CONTENT = {
  title: 'THE TIDAL SCREAM',
  subtitle: 'Twenty-five financial instruments rendered as faces.\nExpression maps to crisis dynamics. Shape maps to structural identity.\nSeventeen days of data. Press play.',
  prompt: 'click anywhere to begin',
  quote: '"What do they represent?"\n"Software customizes output for user."',
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
        THE TIDAL SCREAM
      </h1>

      <p
        style={{
          color: '#888',
          fontSize: 12,
          maxWidth: 400,
          textAlign: 'center',
          lineHeight: 1.8,
          marginBottom: 48,
        }}
      >
        Twenty-five financial instruments rendered as faces.
        <br />
        Expression maps to crisis dynamics. Shape maps to structural identity.
        <br />
        Seventeen days of data. Press play.
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

      {/* Watts quote */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          textAlign: 'center',
          color: '#444',
          fontSize: 12,
          fontStyle: 'italic',
          lineHeight: 1.8,
        }}
      >
        "What do they represent?"
        <br />
        "Software customizes output for user."
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
