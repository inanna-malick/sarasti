/** Solarized Dark palette + semantic theme tokens. */
export const sol = {
  base03: '#002b36',  base02: '#073642',
  base01: '#586e75',  base00: '#657b83',
  base0:  '#839496',  base1:  '#93a1a1',
  yellow: '#b58900',  orange: '#cb4b16',
  red:    '#dc322f',  magenta:'#d33682',
  violet: '#6c71c4',  blue:   '#268bd2',
  cyan:   '#2aa198',  green:  '#859900',
} as const;

export const theme = {
  bg:           sol.base03,
  bgPanel:      sol.base02,
  bgPanelAlpha: 'rgba(0,43,54,0.92)',
  border:       'rgba(88,110,117,0.3)',
  borderSubtle: 'rgba(88,110,117,0.15)',
  text:         sol.base0,
  textBright:   sol.base1,
  textMuted:    sol.base01,
  accent:       sol.cyan,
  accentActive: sol.yellow,
  negative:     sol.red,
  positive:     sol.green,
  playhead:     sol.yellow,
  hoverBg:      'rgba(7,54,66,0.5)',
  /** Scene background as hex int for Three.js */
  sceneBg:      0x002b36,
} as const;
