"use client";

import { createTheme, alpha } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    brand: Palette["primary"];
  }
  interface PaletteOptions {
    brand?: PaletteOptions["primary"];
  }
}

const PRIMARY = "#1E3A8A";
const PRIMARY_LIGHT = "#3B5BDB";
const PRIMARY_DARK = "#172554";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: PRIMARY,
      light: PRIMARY_LIGHT,
      dark: PRIMARY_DARK,
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#475569",
      light: "#64748b",
      dark: "#334155",
      contrastText: "#ffffff",
    },
    success: { main: "#15803D", light: "#22C55E", dark: "#14532D" },
    warning: { main: "#B45309", light: "#F59E0B", dark: "#78350F" },
    error: { main: "#B91C1C", light: "#EF4444", dark: "#7F1D1D" },
    info: { main: "#0E7490", light: "#06B6D4", dark: "#155E75" },
    brand: { main: PRIMARY, light: PRIMARY_LIGHT, dark: PRIMARY_DARK, contrastText: "#ffffff" },
    background: { default: "#F4F6FB", paper: "#FFFFFF" },
    text: { primary: "#0F172A", secondary: "#475569", disabled: "#94A3B8" },
    divider: "#E2E8F0",
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      '"Sarabun", "Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    h1: { fontSize: "2.25rem", fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontSize: "1.875rem", fontWeight: 700, letterSpacing: "-0.015em" },
    h3: { fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.01em" },
    h4: { fontSize: "1.25rem", fontWeight: 600 },
    h5: { fontSize: "1.125rem", fontWeight: 600 },
    h6: { fontSize: "1rem", fontWeight: 600 },
    subtitle1: { fontSize: "1rem", fontWeight: 500 },
    subtitle2: { fontSize: "0.875rem", fontWeight: 500 },
    body1: { fontSize: "0.95rem", lineHeight: 1.6 },
    body2: { fontSize: "0.875rem", lineHeight: 1.55 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0 },
    overline: { letterSpacing: "0.12em", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { height: "100%" },
        body: {
          height: "100%",
          backgroundColor: "#F4F6FB",
          color: "#0F172A",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        "*::-webkit-scrollbar": { width: 10, height: 10 },
        "*::-webkit-scrollbar-thumb": { backgroundColor: "#CBD5E1", borderRadius: 8 },
        "*::-webkit-scrollbar-thumb:hover": { backgroundColor: "#94A3B8" },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
        outlined: { borderColor: "#E2E8F0" },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0, variant: "outlined" },
      styleOverrides: {
        root: { borderColor: "#E2E8F0", borderRadius: 12 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: "#0F172A",
          borderBottom: "1px solid #E2E8F0",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingInline: 18,
          paddingBlock: 8,
          fontWeight: 600,
        },
        sizeSmall: { paddingInline: 12, paddingBlock: 4 },
        sizeLarge: { paddingInline: 22, paddingBlock: 11, fontSize: "0.95rem" },
        contained: ({ ownerState }) =>
          ownerState.color === "primary"
            ? {
                boxShadow: `0 1px 2px ${alpha(PRIMARY, 0.2)}`,
                "&:hover": { boxShadow: `0 4px 12px ${alpha(PRIMARY, 0.25)}` },
              }
            : {},
        outlined: {
          borderColor: "#CBD5E1",
          color: "#1E293B",
          "&:hover": {
            borderColor: PRIMARY,
            backgroundColor: alpha(PRIMARY, 0.04),
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "#ffffff",
          "& fieldset": { borderColor: "#E2E8F0" },
          "&:hover fieldset": { borderColor: "#94A3B8" },
          "&.Mui-focused fieldset": { borderColor: PRIMARY, borderWidth: 1.5 },
        },
        input: { paddingTop: 12, paddingBottom: 12 },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          color: "#475569",
          "&.Mui-focused": { color: PRIMARY_DARK },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, borderRadius: 8 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, minHeight: 44 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#0F172A",
          fontSize: "0.78rem",
          padding: "6px 10px",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: 10,
          ...(ownerState.variant === "standard" && ownerState.severity === "error" && {
            backgroundColor: "#FEF2F2",
            color: "#991B1B",
            border: "1px solid #FECACA",
          }),
          ...(ownerState.variant === "standard" && ownerState.severity === "success" && {
            backgroundColor: "#F0FDF4",
            color: "#166534",
            border: "1px solid #BBF7D0",
          }),
          ...(ownerState.variant === "standard" && ownerState.severity === "info" && {
            backgroundColor: "#EFF6FF",
            color: "#1E3A8A",
            border: "1px solid #BFDBFE",
          }),
          ...(ownerState.variant === "standard" && ownerState.severity === "warning" && {
            backgroundColor: "#FFFBEB",
            color: "#92400E",
            border: "1px solid #FDE68A",
          }),
        }),
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 14 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "#F8FAFC",
            color: "#475569",
            fontWeight: 600,
            fontSize: "0.75rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          },
        },
      },
    },
  },
});

export default theme;
