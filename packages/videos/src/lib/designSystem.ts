/**
 * Design System for Remotion Videos
 * Matches the main app's tailwind.config.js
 */

export const colors = {
  // Deep backgrounds
  bgDeep: "#0a0a0f",
  bgGradient: "#1a1a2e",

  // Primary accent - luminous teal
  accent: "#00d4aa",
  accent50: "#e6fff9",
  accent100: "#b3ffed",
  accent200: "#80ffe0",
  accent300: "#4dffd4",
  accent400: "#1affc7",
  accent500: "#00d4aa",
  accent600: "#00a888",
  accent700: "#007d65",
  accent800: "#005243",
  accent900: "#002721",

  // Text colors
  textPrimary: "#f0f0f5",
  textSecondary: "#9ca3af",

  // Status colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",

  // Surface colors for glassmorphism
  surface: "rgba(255, 255, 255, 0.05)",
  surfaceHover: "rgba(255, 255, 255, 0.08)",
  surfaceActive: "rgba(255, 255, 255, 0.12)",
};

/**
 * Spring configurations for Remotion
 * These match the Framer Motion feel from the main app
 */
export const springConfigs = {
  // Smooth, no bounce - for subtle reveals
  smooth: { damping: 200 },

  // Snappy, minimal bounce - for UI elements
  snappy: { damping: 20, stiffness: 200 },

  // Bouncy entrance - for playful animations
  bouncy: { damping: 8 },

  // Heavy, slow, small bounce - for emphasis
  heavy: { damping: 15, stiffness: 80, mass: 2 },

  // Natural motion - matching CLAUDE.md spec (mass: 1, damping: 15)
  natural: { damping: 15, mass: 1 },
};

/**
 * Standard durations in seconds
 */
export const durations = {
  quick: 0.3,
  normal: 0.6,
  slow: 1.0,
  verySlow: 2.0,
};

/**
 * Common animation delay patterns (in seconds)
 */
export const staggerDelays = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.2,
};
