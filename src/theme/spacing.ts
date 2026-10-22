export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  sheet: 34,
  pill: 999,
} as const;

export const elevation = {
  // Mediary separates surfaces with hairline borders, not shadows — these
  // stay barely-there for the few floating elements (tab bar, sheets).
  card: {
    shadowColor: '#0B1A33',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  raised: {
    shadowColor: '#0B1A33',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
} as const;

// Scroll padding a tab screen needs so its last row clears the floating tab bar
export const tabBarClearance = 62 + 32;

export const touchTarget = {
  minHeight: 44,
};

// Heights for the pill-shaped controls in the brand concept
export const controlHeight = {
  button: 56,
  field: 54,
  chip: 38,
} as const;
