import React, { useState } from 'react';
import type { BindingReport, BindingEntry, BindingContribution } from '@/binding/report';
import { useExplorerStore } from './store';

function ContributionRow({ c }: { c: BindingContribution }) {
  return (
    <div style={{ paddingLeft: 16, fontSize: 10, color: '#999', fontFamily: 'monospace', lineHeight: 1.6 }}>
      {c.source} {c.contribution >= 0 ? '+' : ''}{c.contribution.toFixed(3)}
      <span style={{ color: '#666' }}> (input: {c.input.toFixed(3)})</span>
    </div>
  );
}

function EntryRow({ entry, prefix }: { entry: BindingEntry; prefix: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', color: '#bbb', cursor: 'pointer',
          fontSize: 11, fontFamily: 'monospace', padding: '1px 0', textAlign: 'left',
          width: '100%',
        }}
      >
        {open ? '▾' : '▸'} {prefix}{entry.index} = {entry.value.toFixed(3)}
      </button>
      {open && entry.contributions.map((c, i) => <ContributionRow key={i} c={c} />)}
    </div>
  );
}

function SectionHeader({ title, count, open, onToggle }: { title: string; count: number; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        background: 'none', border: 'none', color: '#6cf', cursor: 'pointer',
        fontSize: 11, fontFamily: 'monospace', padding: '4px 0', textAlign: 'left',
        width: '100%', fontWeight: 'bold',
      }}
    >
      {open ? '▾' : '▸'} {title} ({count} active)
    </button>
  );
}

function PoseSection({ report }: { report: BindingReport }) {
  const [open, setOpen] = useState(false);
  const entries = [
    { ...report.pose.pitch, label: 'pitch' },
    { ...report.pose.yaw, label: 'yaw' },
    { ...report.pose.roll, label: 'roll' },
    { ...report.pose.jaw, label: 'jaw' },
  ];
  const active = entries.filter(e => e.value !== 0).length;
  return (
    <div>
      <SectionHeader title="Pose" count={active} open={open} onToggle={() => setOpen(!open)} />
      {open && entries.map(e => (
        <div key={e.label} style={{ paddingLeft: 8 }}>
          <div style={{ fontSize: 11, color: '#bbb', fontFamily: 'monospace' }}>
            {e.label} = {e.value.toFixed(4)} rad
          </div>
          {e.contributions.map((c, i) => <ContributionRow key={i} c={c} />)}
        </div>
      ))}
    </div>
  );
}

function GazeSection({ report }: { report: BindingReport }) {
  const [open, setOpen] = useState(false);
  const entries = [
    { ...report.gaze.horizontal, label: 'horizontal' },
    { ...report.gaze.vertical, label: 'vertical' },
  ];
  const active = entries.filter(e => e.value !== 0).length;
  return (
    <div>
      <SectionHeader title="Gaze" count={active} open={open} onToggle={() => setOpen(!open)} />
      {open && entries.map(e => (
        <div key={e.label} style={{ paddingLeft: 8 }}>
          <div style={{ fontSize: 11, color: '#bbb', fontFamily: 'monospace' }}>
            {e.label} = {e.value.toFixed(4)} rad
          </div>
          {e.contributions.map((c, i) => <ContributionRow key={i} c={c} />)}
        </div>
      ))}
    </div>
  );
}

function TextureSection({ report }: { report: BindingReport }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <SectionHeader title="Texture" count={(report.flush.value !== 0 ? 1 : 0) + (report.fatigue.value !== 0 ? 1 : 0)} open={open} onToggle={() => setOpen(!open)} />
      {open && (
        <div style={{ paddingLeft: 8 }}>
          <div style={{ fontSize: 11, color: '#bbb', fontFamily: 'monospace' }}>flush = {report.flush.value.toFixed(3)}</div>
          {report.flush.contributions.map((c, i) => <ContributionRow key={`f${i}`} c={c} />)}
          <div style={{ fontSize: 11, color: '#bbb', fontFamily: 'monospace', marginTop: 4 }}>fatigue = {report.fatigue.value.toFixed(3)}</div>
          {report.fatigue.contributions.map((c, i) => <ContributionRow key={`t${i}`} c={c} />)}
        </div>
      )}
    </div>
  );
}

export function ReportPanel() {
  const report = useExplorerStore(s => s.currentReport);
  const mode = useExplorerStore(s => s.mode);

  if (mode !== 'highlevel' || !report) {
    return (
      <div style={{ padding: 8, color: '#666', fontSize: 11, fontFamily: 'monospace' }}>
        Report only available in high-level mode.
      </div>
    );
  }

  const [shapeOpen, setShapeOpen] = useState(true);
  const [exprOpen, setExprOpen] = useState(true);

  return (
    <div style={{ padding: 8, overflowY: 'auto', maxHeight: 400 }}>
      <div style={{ fontSize: 12, color: '#6cf', fontFamily: 'monospace', marginBottom: 8, fontWeight: 'bold' }}>
        Binding Report: {report.tickerId}
      </div>

      <SectionHeader title="Shape" count={report.shape.length} open={shapeOpen} onToggle={() => setShapeOpen(!shapeOpen)} />
      {shapeOpen && (
        <div style={{ paddingLeft: 8 }}>
          {report.shape.map(e => <EntryRow key={e.index} entry={e} prefix={'\u03B2'} />)}
        </div>
      )}

      <SectionHeader title="Expression" count={report.expression.length} open={exprOpen} onToggle={() => setExprOpen(!exprOpen)} />
      {exprOpen && (
        <div style={{ paddingLeft: 8 }}>
          {report.expression.map(e => <EntryRow key={e.index} entry={e} prefix={'\u03C8'} />)}
        </div>
      )}

      <PoseSection report={report} />
      <GazeSection report={report} />
      <TextureSection report={report} />
    </div>
  );
}
