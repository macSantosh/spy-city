/**
 * Night Owl-inspired color theme for the UI.
 * The palette mirrors Sarah Drasner's Night Owl VS Code theme.
 * All UI components read from this — swap values here to re-theme the entire app.
 */
export const theme = {
  // Backgrounds
  bg: {
    primary:   '#011627',   // deepest background (Night Owl editor bg)
    secondary: '#0b2942',   // panels, cards
    tertiary:  '#13344f',   // hover states, input backgrounds
    overlay:   'rgba(1, 22, 39, 0.95)', // floating panels with transparency
  },

  // Text
  text: {
    primary:   '#d6deeb',   // main text (Night Owl foreground)
    secondary: '#5f7e97',   // muted text, labels
    accent:    '#7fdbca',   // highlighted values (teal green)
    bright:    '#ffffff',   // high emphasis
  },

  // Accent colors (from Night Owl syntax highlighting)
  accent: {
    cyan:      '#80CBC4',   // keywords, links
    teal:      '#7fdbca',   // strings, quantities
    green:     '#addb67',   // positive values, success
    yellow:    '#ffcb6b',   // warnings, gold
    orange:    '#f78c6c',   // numbers, warm accents
    red:       '#ff5874',   // negative values, errors
    magenta:   '#c792ea',   // special, decorative
    blue:      '#82aaff',   // functions, interactive
    lavender:  '#babed8',   // operators, subtle
  },

  // Borders
  border: {
    subtle:    'rgba(127, 219, 202, 0.15)',  // panel borders
    focus:     'rgba(130, 170, 255, 0.5)',    // focused input
    hover:     'rgba(127, 219, 202, 0.3)',    // hover borders
  },

  // Shadows & glows
  glow: {
    cyan:      '0 0 20px rgba(128, 203, 196, 0.25)',
    blue:      '0 0 30px rgba(130, 170, 255, 0.2)',
    title:     '0 0 40px rgba(128, 203, 196, 0.4)',
  },

  // Scene-specific (3D world)
  scene: {
    skyBg:     '#011627',   // deep navy
    fog:       '#011627',   // deep navy
    ground:    '#c2cad8',   // near-black asphalt base
    road:      '#0a0f1a',   // dark charcoal asphalt — streets
    blvd:      '#111927',   // slightly lighter asphalt — boulevards
    kerb:      '#0a111e',
    line:      '#ffaa00',   // warm yellow centre line (real road marking)
    lineWhite: '#cccccc',   // soft white lane dividers
    sidewalk:  '#0079cf',   // concrete grey-blue kerb strip
    
    // Props & Lights
    lampPost:      '#2a2f3a',   // matte dark steel
    lampBulb:      '#ffd36b',   // warm sodium-vapour amber
    lampLight:     0xffd36b,    // street lamp pool — warm amber
    lampLightBlvd: 0xffdd88,    // boulevard intersection pool — slightly brighter
    glowPerimeter: 0x011627,

    // Building materials
    building: {
      fallback:    '#8899aa',
      window:      0x82aaff,
      base:        0x050a12,
      roof:        '#050a12',
      acUnit:      '#131f33',
      neonOn:      0x82aaff,
      neonOff:     0x131f33,
      lightBeacon: 0x82aaff,
    },

    // Environmental
    atmosphere: {
      ambient:     0x48641f,
      directional: 0x4466aa,
      glowCenter:  0x0033aa,
      star1:       '#ddeeff',
      star2:       '#334466',
      star3:       '#4488bb',
      test: '#48641f',
    }
  },

  // DOM generic
  ui: {
    skeleton: '#334455',
  }
} as const;

export type Theme = typeof theme;
