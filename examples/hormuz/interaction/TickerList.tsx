import React from 'react';
import { useStore } from '../../../src/store';
import { sol, theme } from '../theme';

/**
 * Always-visible left sidebar listing all tickers grouped by family.
 * Click a row to select the face (highlights in 3D + populates detail panel).
 */
export function TickerList(): React.ReactElement {
  const instances = useStore((s) => s.instances);
  const selectedId = useStore((s) => s.selectedId);
  const hoveredId = useStore((s) => s.hoveredId);

  // Group instances by family
  const byFamily = new Map<string, typeof instances>();
  for (const inst of instances) {
    const fam = inst.ticker.family;
    if (!byFamily.has(fam)) byFamily.set(fam, []);
    byFamily.get(fam)!.push(inst);
  }

  const handleClick = (id: string) => {
    const store = useStore.getState();
    if (id === store.selectedId) {
      store.setSelectedId(null);
    } else {
      store.setSelectedId(id);
      store.flyToFace?.(id);
    }
  };

  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        background: theme.bg,
        borderRight: `1px solid ${theme.border}`,
        padding: '12px 0',
        color: theme.textBright,
        fontFamily: 'monospace',
        fontSize: 11,
        lineHeight: 1.5,
        overflowY: 'auto',
      }}
    >
      <div style={{
        padding: '0 12px 8px',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: theme.textMuted,
        borderBottom: `1px solid ${theme.borderSubtle}`,
        marginBottom: 4,
      }}>
        tickers
      </div>

      {[...byFamily.entries()].map(([family, members]) => (
        <div key={family}>
          <div style={{
            padding: '6px 12px 2px',
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: theme.textMuted,
          }}>
            {family}
          </div>
          {members.map((inst) => {
            const isSelected = inst.id === selectedId;
            const isHovered = inst.id === hoveredId;
            const dev = inst.frame.deviation;
            const devColor = dev >= 0 ? sol.green : sol.red;

            return (
              <div
                key={inst.id}
                onClick={() => handleClick(inst.id)}
                style={{
                  padding: '3px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: isSelected
                    ? 'rgba(42,161,152,0.15)'
                    : isHovered
                      ? theme.hoverBg
                      : 'transparent',
                  borderLeft: isSelected ? `2px solid ${sol.cyan}` : '2px solid transparent',
                }}
              >
                <span style={{
                  color: isSelected ? theme.textBright : theme.text,
                  fontWeight: isSelected ? 'bold' : 'normal',
                }}>
                  {inst.ticker.name}
                </span>
                <span style={{
                  color: devColor,
                  fontSize: 10,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {dev >= 0 ? '+' : ''}{(dev * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
