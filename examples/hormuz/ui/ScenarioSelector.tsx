import React from 'react';
import type { Episode } from '../../../src/episode/types';
import { sol, theme } from '../theme';

interface Props {
  episodes: Episode[];
  onSelect: (episode: Episode) => void;
}

export function ScenarioSelector({ episodes, onSelect }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: theme.bg,
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
          color: theme.textBright,
          fontSize: '24px',
          letterSpacing: '4px',
          marginBottom: '48px',
          fontWeight: 400,
          textTransform: 'uppercase',
        }}
      >
        Select Episode
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
        {episodes.map((episode) => (
          <div
            key={episode.id}
            onClick={() => onSelect(episode)}
            className="scenario-card"
            style={{
              background: theme.bgPanel,
              border: `1px solid ${theme.border}`,
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
                color: theme.textBright,
                fontSize: '20px',
                margin: '0 0 12px 0',
                fontWeight: 500,
              }}
            >
              {episode.title}
            </h2>
            <p
              style={{
                color: theme.textMuted,
                fontSize: '14px',
                margin: '0',
                lineHeight: '1.5',
              }}
            >
              {episode.subtitle}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        .scenario-card:hover {
          border-color: ${theme.border} !important;
          background: ${theme.hoverBg} !important;
          box-shadow: 0 0 20px rgba(42, 161, 152, 0.05);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
