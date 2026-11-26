export const theme = {
  colors: {
    background: '#0F172A',
    card: '#192134',
    muted: '#0F1F2B',
    text: '#FFFFFF',
    textMuted: '#94A3B8',
    border: 'rgba(255,255,255,0.12)',
    felt: '#15803D',
    gold: '#D97706',
    danger: '#DC2626',
    warning: '#EAB308',
    ok: '#22C55E',
    neutral: '#64748B',
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
    md: 12,
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
