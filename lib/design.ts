"use client";

/**
 * Origami Geométrico — design tokens.
 *
 * Every fold follows a rule: sharp corners (0px), faceted clip-paths, paper
 * fold shadows instead of soft glows, and a single coral accent for anything
 * interactive. Shared here so pages compose the same primitives instead of
 * re-inventing gradients per screen.
 */

// ─── Palette ────────────────────────────────────────────────────────────────

export const paper = {
  /** Paper White — light surface, card backgrounds */
  white: "#FAFAFA",
  /** Pure sheet — raised cards sitting on the paper */
  sheet: "#FFFFFF",
  /** Fold Shadow — secondary surface / muted text */
  fold: "#B0B0B0",
  /** Ink Black — dark surface, primary text */
  ink: "#1A1A1A",
  /** Ink one fold lighter — dark panels */
  inkSoft: "#242424",
  /** Steel Grey — secondary text, borders */
  steel: "#4A4A4A",
  /** Crease — hairline borders on light surfaces */
  crease: "#E4E1DC",
  /** Crease on ink panels */
  creaseDark: "rgba(250,250,250,0.14)",
} as const;

export const accent = {
  /** Accent Coral — CTAs and interactive elements */
  coral: "#FF6B6B",
  coralDeep: "#E05555",
  coralInk: "#B83B3B",
  /** Sky Fold — decorative / informational */
  sky: "#87CEEB",
  skyDeep: "#3E7FA6",
  /** Sage Paper — decorative / success */
  sage: "#A8D5BA",
  sageDeep: "#3F8F63",
  /** Warm Crease — decorative / warning */
  warm: "#F0C987",
  warmDeep: "#A9762A",
} as const;

/** Medal tones for rankings — no emojis, folded paper metals instead. */
export const medal = {
  first: accent.warm,
  second: paper.fold,
  third: "#C89B7B",
} as const;

// ─── Depth: paper fold shadows ──────────────────────────────────────────────

export const foldShadow = {
  /** Card resting on the sheet */
  rest: "0 2px 12px rgba(26,26,26,0.06)",
  /** Card lifted on hover */
  lift: "0 10px 26px rgba(26,26,26,0.12)",
  /** Panel pressed into the page */
  press: "0 1px 3px rgba(26,26,26,0.10)",
  /** Coral CTA lift */
  accent: "0 8px 20px rgba(255,107,107,0.28)",
  /** Overlay / modal */
  overlay: "0 24px 60px rgba(26,26,26,0.22)",
} as const;

// ─── Shapes: clip-path facets ───────────────────────────────────────────────

/** Cuts the top-right corner — the signature single fold. */
export const cornerCut = (size = 18) =>
  `polygon(0 0, calc(100% - ${size}px) 0, 100% ${size}px, 100% 100%, 0 100%)`;

/** Cuts top-right and bottom-left — a sheet folded twice. */
export const doubleCut = (size = 18) =>
  `polygon(0 0, calc(100% - ${size}px) 0, 100% ${size}px, 100% 100%, ${size}px 100%, 0 calc(100% - ${size}px))`;

/** Chevron-tipped block used for pills and rank markers. */
export const chevronCut = (size = 10) =>
  `polygon(0 0, 100% 0, 100% calc(100% - ${size}px), calc(100% - ${size}px) 100%, 0 100%)`;

/** Diagonal slice for section dividers — the mountain fold. */
export const slice = {
  down: "polygon(0 0, 100% 0, 100% calc(100% - 40px), 0 100%)",
  up: "polygon(0 40px, 100% 0, 100% 100%, 0 100%)",
} as const;

// ─── Surfaces: tessellation backgrounds ─────────────────────────────────────

/**
 * Low-poly triangle tessellation. Keep alpha low and tiles large — the pattern
 * should read as folded paper catching light, never as wallpaper.
 */
export function tessellation(color = "#1A1A1A", alpha = 0.03, size = 88) {
  const c = hexToRgba(color, alpha);
  return {
    backgroundImage: [
      `linear-gradient(135deg, ${c} 25%, transparent 25%)`,
      `linear-gradient(225deg, ${c} 25%, transparent 25%)`,
      `linear-gradient(45deg, ${c} 25%, transparent 25%)`,
      `linear-gradient(315deg, ${c} 25%, transparent 25%)`,
    ].join(","),
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: `0 0, ${size / 2}px 0, ${size / 2}px ${-size / 2}px, 0 ${size / 2}px`,
  };
}

/** Fine crease grid — quieter than the tessellation, for large ink panels. */
export function creaseGrid(color = "#FAFAFA", alpha = 0.06, size = 32) {
  const c = hexToRgba(color, alpha);
  return {
    backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
    backgroundSize: `${size}px ${size}px`,
  };
}

export function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

// ─── Motion ─────────────────────────────────────────────────────────────────

export const easing = "cubic-bezier(0.16, 1, 0.3, 1)";
export const duration = { hover: 200, entry: 420 } as const;

/**
 * Fade + translate-Y entry. `index` staggers cascades by 80ms per item.
 * Only transform/opacity animate — nothing that triggers layout.
 */
export const fadeUp = (index = 0) => ({
  animation: `fold-in ${duration.entry}ms ${easing} both`,
  animationDelay: `${index * 80}ms`,
});

// ─── Composed surface recipes ───────────────────────────────────────────────

/** A sheet of paper: sharp edges, hairline crease, resting fold shadow. */
export const sheetSx = {
  bgcolor: paper.sheet,
  border: `1px solid ${paper.crease}`,
  boxShadow: foldShadow.rest,
  borderRadius: 0,
} as const;

/** Sheet that lifts and shifts on hover — geometric hover transform. */
export const liftSx = {
  transition: `transform ${duration.hover}ms ${easing}, box-shadow ${duration.hover}ms ${easing}, border-color ${duration.hover}ms ${easing}`,
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: foldShadow.lift,
    borderColor: accent.coral,
  },
} as const;

/** Ink panel with a tessellated surface — hero / leaderboard backdrops. */
export const inkPanelSx = {
  bgcolor: paper.ink,
  color: paper.white,
  ...tessellation(paper.white, 0.03),
} as const;

/** Monospace technical values — session codes, scores, IDs. */
export const monoSx = {
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontVariantNumeric: "tabular-nums",
} as const;
