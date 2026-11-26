// Casino de noche: paño verde botella, baranda de cuero y latón. Pensado para leer de un vistazo con poca luz.
export const theme = {
  colors: {
    background: '#07140F',
    card: '#10221B',
    surfaceHi: '#183128',
    muted: '#0C1B15',
    text: '#EEF2EC',
    textMuted: '#93A89D',
    border: 'rgba(212,175,90,0.18)',
    felt: '#0F4A36',
    feltEdge: '#2A1A12',
    feltLine: 'rgba(212,175,90,0.35)',
    gold: '#D4AF5A',
    danger: '#E5736B',
    warning: '#E8C45A',
    ok: '#5FD08A',
    neutral: '#6B7F76',
    cardFace: '#F4EFE3',
    cardText: '#1B1B1B',
    cardBack: '#5A1E1E',
  },
  action: {
    H: { bg: '#3B82C4', fg: '#FFFFFF' },
    S: { bg: '#5B6B66', fg: '#FFFFFF' },
    D: { bg: '#D4AF5A', fg: '#07140F' },
    P: { bg: '#8B6FD6', fg: '#FFFFFF' },
    R: { bg: '#C9554B', fg: '#FFFFFF' },
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radius: {
    sm: 8,
    md: 14,
  },
  minTouch: 48,
  text: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    display: 40,
  },
  numbers: {
    fontVariant: ['tabular-nums'] as const,
  },
} as const;

// Mesa vista desde los jugadores: el puesto 1 queda a la derecha (izquierda del crupier).
export const seatsLeftToRight = [7, 6, 5, 4, 3, 2, 1] as const;
