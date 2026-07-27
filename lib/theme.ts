"use client";

import { createTheme } from "@mui/material/styles";
import { accent, paper, foldShadow, cornerCut, easing, duration } from "@/lib/design";

declare module "@mui/material/styles" {
  interface Palette {
    brand: Palette["primary"];
  }
  interface PaletteOptions {
    brand?: PaletteOptions["primary"];
  }
}

const SANS = `var(--font-poppins), var(--font-sarabun), "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif`;
const MONO = `var(--font-mono), ui-monospace, "SFMono-Regular", Menlo, monospace`;

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: accent.coral,
      light: "#FF8F8F",
      dark: accent.coralDeep,
      // Ink on coral clears AA; white on coral does not.
      contrastText: paper.ink,
    },
    secondary: {
      main: paper.steel,
      light: "#6E6E6E",
      dark: "#2E2E2E",
      contrastText: paper.white,
    },
    success: { main: accent.sageDeep, light: accent.sage, dark: "#2F6B49", contrastText: paper.white },
    warning: { main: accent.warmDeep, light: accent.warm, dark: "#7C5416", contrastText: paper.white },
    error: { main: "#C2453D", light: "#E0736B", dark: "#8E2E27", contrastText: paper.white },
    info: { main: accent.skyDeep, light: accent.sky, dark: "#2A5C79", contrastText: paper.white },
    brand: { main: accent.coral, light: "#FF8F8F", dark: accent.coralDeep, contrastText: paper.ink },
    background: { default: paper.white, paper: paper.sheet },
    text: { primary: paper.ink, secondary: paper.steel, disabled: paper.fold },
    divider: paper.crease,
  },

  // Base corner radius: 0px. Every fold is a straight crease.
  shape: { borderRadius: 0 },

  typography: {
    fontFamily: SANS,
    fontSize: 14,
    h1: {
      fontSize: "clamp(2.5rem, 5vw, 4rem)",
      fontWeight: 700,
      letterSpacing: "-0.03em",
      lineHeight: 1.05,
    },
    h2: { fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15 },
    h3: { fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 },
    h4: { fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.015em", lineHeight: 1.25 },
    h5: { fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.01em" },
    h6: { fontSize: "1.0625rem", fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle1: { fontSize: "1rem", fontWeight: 600 },
    subtitle2: { fontSize: "0.875rem", fontWeight: 600 },
    body1: { fontSize: "1rem", lineHeight: 1.6 },
    body2: { fontSize: "0.9375rem", lineHeight: 1.55 },
    caption: { fontSize: "0.8125rem", lineHeight: 1.45 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: "0.01em" },
    overline: {
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      lineHeight: 1.6,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { height: "100%" },
        body: {
          height: "100%",
          backgroundColor: paper.white,
          color: paper.ink,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        "::selection": { backgroundColor: accent.coral, color: paper.ink },
        // Squared-off scrollbars — no rounded thumbs anywhere.
        "*::-webkit-scrollbar": { width: 10, height: 10 },
        "*::-webkit-scrollbar-track": { backgroundColor: paper.white },
        "*::-webkit-scrollbar-thumb": { backgroundColor: paper.fold, border: `2px solid ${paper.white}` },
        "*::-webkit-scrollbar-thumb:hover": { backgroundColor: paper.steel },
        "@media (prefers-reduced-motion: reduce)": {
          "*": { animationDuration: "0.01ms !important", transitionDuration: "0.01ms !important" },
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none", borderRadius: 0 },
        outlined: { borderColor: paper.crease },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0, variant: "outlined" },
      styleOverrides: {
        root: {
          borderRadius: 0,
          borderColor: paper.crease,
          boxShadow: foldShadow.rest,
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          backgroundColor: paper.sheet,
          color: paper.ink,
          borderBottom: `1px solid ${paper.crease}`,
          borderRadius: 0,
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: false },
      styleOverrides: {
        root: {
          borderRadius: 0,
          paddingInline: 20,
          paddingBlock: 9,
          fontWeight: 600,
          transition: `background-color ${duration.hover}ms ${easing}, box-shadow ${duration.hover}ms ${easing}, transform ${duration.hover}ms ${easing}, border-color ${duration.hover}ms ${easing}`,
          // Tactile press — the only transform on the button.
          "&:active": { transform: "translateY(1px)" },
        },
        sizeSmall: { paddingInline: 14, paddingBlock: 5, fontSize: "0.875rem" },
        sizeLarge: { paddingInline: 26, paddingBlock: 13, fontSize: "1rem" },
        contained: ({ ownerState }) =>
          ownerState.color === "primary"
            ? {
                backgroundColor: accent.coral,
                color: paper.ink,
                "&:hover": {
                  backgroundColor: accent.coralDeep,
                  boxShadow: foldShadow.accent,
                },
                "&.Mui-disabled": { backgroundColor: paper.crease, color: paper.fold },
              }
            : {
                "&:hover": { boxShadow: foldShadow.rest },
              },
        outlined: {
          borderWidth: 1.5,
          borderColor: paper.fold,
          color: paper.ink,
          "&:hover": {
            borderWidth: 1.5,
            borderColor: accent.coral,
            backgroundColor: "rgba(255,107,107,0.08)",
          },
        },
        text: {
          "&:hover": { backgroundColor: "rgba(26,26,26,0.05)" },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          transition: `background-color ${duration.hover}ms ${easing}, color ${duration.hover}ms ${easing}`,
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: paper.sheet,
          transition: `box-shadow ${duration.hover}ms ${easing}`,
          "& fieldset": { borderColor: paper.crease, borderWidth: 1 },
          "&:hover fieldset": { borderColor: paper.fold },
          // 2px accent focus ring, offset 2px — never an inner glow.
          "&.Mui-focused": {
            outline: `2px solid ${accent.coral}`,
            outlineOffset: 2,
          },
          "&.Mui-focused fieldset": { borderColor: accent.coral, borderWidth: 1 },
          "&.Mui-error.Mui-focused": { outlineColor: "#C2453D" },
          "&.MuiInputBase-sizeSmall .MuiInputBase-input": { paddingTop: 9, paddingBottom: 9 },
        },
        input: { paddingTop: 12, paddingBottom: 12 },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          color: paper.steel,
          "&.Mui-focused": { color: accent.coralInk },
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: { marginLeft: 0, marginTop: 6, fontSize: "0.8125rem" },
      },
    },

    MuiSelect: {
      styleOverrides: { select: { borderRadius: 0 } },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          border: `1px solid ${paper.crease}`,
          boxShadow: foldShadow.overlay,
        },
        list: { paddingTop: 4, paddingBottom: 4 },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": { backgroundColor: "rgba(255,107,107,0.12)" },
          "&.Mui-selected:hover": { backgroundColor: "rgba(255,107,107,0.18)" },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 0, fontWeight: 600, letterSpacing: "0.01em" },
        outlined: { borderColor: paper.crease },
        sizeSmall: { height: 24 },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        rounded: { borderRadius: 0 },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: { height: 3, backgroundColor: accent.coral, borderRadius: 0 },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          minHeight: 48,
          color: paper.steel,
          "&.Mui-selected": { color: paper.ink },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: paper.ink,
          color: paper.white,
          fontSize: "0.78rem",
          fontWeight: 500,
          padding: "7px 11px",
          borderRadius: 0,
        },
        arrow: { color: paper.ink },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState }) => {
          const tone = {
            error: { bg: "#FCF0EF", fg: "#8E2E27", edge: "#C2453D" },
            success: { bg: "#F1F8F3", fg: "#2F6B49", edge: accent.sageDeep },
            info: { bg: "#EFF6FA", fg: "#2A5C79", edge: accent.skyDeep },
            warning: { bg: "#FDF6EA", fg: "#7C5416", edge: accent.warmDeep },
          }[ownerState.severity || "info"];
          return {
            borderRadius: 0,
            alignItems: "center",
            ...(ownerState.variant === "standard" && {
              backgroundColor: tone.bg,
              color: tone.fg,
              // Crease line on the leading edge instead of a full border.
              borderLeft: `3px solid ${tone.edge}`,
            }),
            ...(ownerState.variant === "outlined" && {
              borderColor: paper.crease,
              borderLeft: `3px solid ${tone.edge}`,
            }),
          };
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          border: `1px solid ${paper.crease}`,
          boxShadow: foldShadow.overlay,
          clipPath: cornerCut(22),
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: paper.white,
            color: paper.steel,
            fontWeight: 600,
            fontSize: "0.75rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            borderBottom: `1px solid ${paper.crease}`,
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          "&.MuiTableRow-hover:hover": { backgroundColor: "rgba(255,107,107,0.05)" },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: paper.crease },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 0, backgroundColor: paper.crease },
        bar: { borderRadius: 0, backgroundColor: accent.coral },
      },
    },

    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          fontWeight: 600,
          "&.Mui-selected": { backgroundColor: accent.coral, color: paper.ink },
          "&.Mui-selected:hover": { backgroundColor: accent.coralDeep },
        },
      },
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: paper.crease } },
    },

    MuiLink: {
      defaultProps: { underline: "none" },
      styleOverrides: {
        root: {
          color: accent.coralInk,
          fontWeight: 600,
          transition: `color ${duration.hover}ms ${easing}`,
          "&:hover": { color: accent.coral },
        },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked + .MuiSwitch-track": { backgroundColor: accent.coral, opacity: 1 },
          "&.Mui-checked .MuiSwitch-thumb": { backgroundColor: paper.ink, borderColor: paper.ink },
        },
        track: {
          borderRadius: 0,
          backgroundColor: paper.crease,
          border: `1px solid ${paper.fold}`,
          opacity: 1,
        },
        thumb: {
          borderRadius: 0,
          backgroundColor: paper.sheet,
          border: `1px solid ${paper.steel}`,
          boxShadow: foldShadow.press,
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          "&.Mui-selected": { backgroundColor: "rgba(255,107,107,0.10)" },
          "&.Mui-selected:hover": { backgroundColor: "rgba(255,107,107,0.16)" },
        },
      },
    },

    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          border: `1px solid ${paper.crease}`,
          boxShadow: foldShadow.overlay,
        },
        option: {
          borderRadius: 0,
          '&[aria-selected="true"]': { backgroundColor: "rgba(255,107,107,0.12)" },
          "&.Mui-focused": { backgroundColor: "rgba(255,107,107,0.08)" },
        },
      },
    },

    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: paper.crease,
          "&.Mui-active": { color: accent.coral },
          "&.Mui-completed": { color: paper.ink },
        },
        text: { fill: paper.ink, fontWeight: 700 },
      },
    },

    MuiStepConnector: {
      styleOverrides: {
        line: { borderColor: paper.crease },
      },
    },
  },
});

export default theme;
