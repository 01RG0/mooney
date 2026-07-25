import { useReducedMotion } from "motion/react";

// ─── Easing ───────────────────────────────────────────────────────────────────
export const ease = {
  smooth: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  spring: { type: "spring", stiffness: 400, damping: 30 } as const,
  springBouncy: { type: "spring", stiffness: 500, damping: 24 } as const,
  springGentle: { type: "spring", stiffness: 280, damping: 32 } as const,
} as const;

// ─── Durations ────────────────────────────────────────────────────────────────
export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.35,
} as const;

// ─── Standard page transition variants ───────────────────────────────────────
export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: ease.smooth } },
  exit:    { opacity: 0, y: -8,  transition: { duration: duration.fast, ease: ease.smooth } },
};

// Reduced-motion override: instant fade only
export const pageVariantsReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: duration.fast } },
  exit:    { opacity: 0, transition: { duration: 0.05 } },
};

// ─── Dropdown / menu panel variants ──────────────────────────────────────────
export const dropdownVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: -4 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { duration: duration.base, ease: ease.smooth } },
  exit:    { opacity: 0, scale: 0.95, y: -4, transition: { duration: duration.fast, ease: ease.smooth } },
};

// ─── Slide-down panel (mobile nav, accordions) ────────────────────────────────
export const slideDownVariants = {
  hidden:  { opacity: 0, height: 0,    overflow: "hidden" },
  visible: { opacity: 1, height: "auto", overflow: "hidden", transition: { duration: duration.base, ease: ease.smooth } },
  exit:    { opacity: 0, height: 0,    overflow: "hidden", transition: { duration: duration.fast,  ease: ease.smooth } },
};

// ─── Card / interactive surface ───────────────────────────────────────────────
export const cardHover = {
  rest:  { scale: 1,    y: 0 },
  hover: { scale: 1.02, y: -3, transition: ease.springGentle },
};

// ─── Button press ─────────────────────────────────────────────────────────────
export const buttonTap = { scale: 0.96 };

// ─── Reduced-motion helper ────────────────────────────────────────────────────
// Usage: const rm = useReducedMotion(); <motion.div {...(rm ? reducedProps : fullProps)} />
export { useReducedMotion };
