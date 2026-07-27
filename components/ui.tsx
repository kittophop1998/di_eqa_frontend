"use client";

/**
 * Origami Geométrico — shared UI primitives.
 *
 * Folded, angular, precise: labels sit above inputs, headings are marked by a
 * crease rule instead of a rounded avatar, and loading states shimmer rather
 * than spin.
 */

import { useId } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField, { type TextFieldProps } from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import type { SxProps, Theme } from "@mui/material/styles";

import {
  accent,
  paper,
  foldShadow,
  cornerCut,
  chevronCut,
  liftSx,
  tessellation,
  hexToRgba,
} from "@/lib/design";

// ─── Tone map ───────────────────────────────────────────────────────────────

type Tone = "accent" | "success" | "warning" | "info" | "ink";

const TONES: Record<Tone, { fg: string; bg: string }> = {
  accent: { fg: accent.coralInk, bg: hexToRgba(accent.coral, 0.14) },
  success: { fg: accent.sageDeep, bg: hexToRgba(accent.sage, 0.35) },
  warning: { fg: accent.warmDeep, bg: hexToRgba(accent.warm, 0.35) },
  info: { fg: accent.skyDeep, bg: hexToRgba(accent.sky, 0.3) },
  ink: { fg: paper.white, bg: paper.ink },
};

// ─── Logo ───────────────────────────────────────────────────────────────────

/** The DI mark: a folded square with its top-right corner turned back. */
export function LogoMark({
  size = 40,
  tone = "accent",
}: {
  size?: number;
  tone?: "accent" | "ink" | "paper";
}) {
  const fill = tone === "accent" ? accent.coral : tone === "ink" ? paper.ink : paper.white;
  const text = tone === "paper" ? paper.ink : tone === "ink" ? paper.white : paper.ink;
  const foldSize = Math.round(size * 0.34);

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          bgcolor: fill,
          clipPath: cornerCut(foldSize),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: text,
          fontWeight: 700,
          fontSize: size * 0.36,
          letterSpacing: "0.02em",
          lineHeight: 1,
        }}
      >
        DI
      </Box>
      {/* The turned-back corner — the fold catching light. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: foldSize,
          height: foldSize,
          bgcolor: hexToRgba(paper.ink, 0.28),
          clipPath: "polygon(0 0, 100% 100%, 0 100%)",
        }}
      />
    </Box>
  );
}

/** Full lockup: mark + wordmark + descriptor line. */
export function Wordmark({
  size = 40,
  tone = "accent",
  caption = "ระบบประเมินคุณภาพห้องปฏิบัติการ",
  onDark = false,
}: {
  size?: number;
  tone?: "accent" | "ink" | "paper";
  caption?: string | null;
  onDark?: boolean;
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
      <LogoMark size={size} tone={tone} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: size * 0.42,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            color: onDark ? paper.white : paper.ink,
          }}
        >
          DI EQA
        </Typography>
        {caption && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              lineHeight: 1.2,
              color: onDark ? hexToRgba(paper.white, 0.62) : paper.steel,
            }}
          >
            {caption}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

// ─── Headings ───────────────────────────────────────────────────────────────

/** Section heading marked by a crease rule and a faceted icon tile. */
export function SectionHeading({
  icon,
  title,
  subtitle,
  action,
  tone = "accent",
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  tone?: Tone;
}) {
  const t = TONES[tone];
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ mb: 2.5, alignItems: "center", flexWrap: "wrap", rowGap: 1.5 }}
    >
      {icon && (
        <Box
          aria-hidden
          sx={{
            width: 36,
            height: 36,
            display: "grid",
            placeItems: "center",
            bgcolor: t.bg,
            color: t.fg,
            clipPath: chevronCut(9),
            flexShrink: 0,
            "& svg": { fontSize: 20 },
          }}
        >
          {icon}
        </Box>
      )}
      <Box sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}

/** Eyebrow label preceded by a short coral crease. */
export function Eyebrow({
  children,
  onDark = false,
}: {
  children: React.ReactNode;
  onDark?: boolean;
}) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
      <Box aria-hidden sx={{ width: 24, height: 3, bgcolor: accent.coral, flexShrink: 0 }} />
      <Typography
        variant="overline"
        sx={{ color: onDark ? hexToRgba(paper.white, 0.75) : paper.steel, lineHeight: 1.4 }}
      >
        {children}
      </Typography>
    </Stack>
  );
}

// ─── Surfaces ───────────────────────────────────────────────────────────────

/** A sheet of paper. `cut` turns back the top-right corner; `hover` lifts it. */
export function PaperCard({
  children,
  cut = 0,
  hover = false,
  edge,
  sx,
  ...rest
}: {
  children: React.ReactNode;
  cut?: number;
  hover?: boolean;
  /** Colour of the 3px leading crease on the left edge. */
  edge?: string;
  sx?: SxProps<Theme>;
} & Omit<React.ComponentProps<typeof Paper>, "children" | "sx">) {
  return (
    <Paper
      {...rest}
      sx={{
        position: "relative",
        bgcolor: "background.paper",
        border: `1px solid ${paper.crease}`,
        boxShadow: foldShadow.rest,
        ...(cut ? { clipPath: cornerCut(cut) } : null),
        ...(edge ? { borderLeft: `3px solid ${edge}` } : null),
        ...(hover ? liftSx : null),
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

/** Angular divider between stacked sections — a mountain fold. */
export function FoldDivider({ sx }: { sx?: SxProps<Theme> }) {
  return (
    <Box
      aria-hidden
      sx={{
        height: 1,
        bgcolor: paper.crease,
        position: "relative",
        "&::after": {
          content: '""',
          position: "absolute",
          left: 0,
          top: -1,
          width: 56,
          height: 3,
          bgcolor: accent.coral,
        },
        ...sx,
      }}
    />
  );
}

/** Tessellated backdrop for ink panels. */
export function Tessellation({
  color = paper.white,
  alpha = 0.05,
  size = 56,
  sx,
}: {
  color?: string;
  alpha?: number;
  size?: number;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      aria-hidden
      sx={{ position: "absolute", inset: 0, ...tessellation(color, alpha, size), ...sx }}
    />
  );
}

// ─── Inputs: label above, error below, no floating labels ───────────────────

/** Wraps any control with a static label above and helper/error text below. */
export function FieldShell({
  label,
  required,
  helperText,
  error,
  htmlFor,
  children,
  sx,
}: {
  label?: React.ReactNode;
  required?: boolean;
  helperText?: React.ReactNode;
  error?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box sx={{ width: "100%", ...sx }}>
      {label && (
        <Typography
          component="label"
          htmlFor={htmlFor}
          sx={{
            display: "block",
            mb: 0.75,
            fontSize: "0.875rem",
            fontWeight: 500,
            letterSpacing: "0.01em",
            color: paper.steel,
          }}
        >
          {label}
          {required && (
            <Box component="span" aria-hidden sx={{ color: accent.coral, ml: 0.5 }}>
              *
            </Box>
          )}
        </Typography>
      )}
      {children}
      {helperText && (
        <Typography
          variant="caption"
          sx={{ display: "block", mt: 0.75, color: error ? "error.main" : "text.secondary" }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
}

export type FieldProps = Omit<TextFieldProps, "label" | "helperText" | "variant"> & {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
};

/** TextField with the label lifted out above the box. Same props otherwise. */
export function Field({ label, helperText, required, error, id, ...rest }: FieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell
      label={label}
      required={required}
      helperText={helperText}
      error={error}
      htmlFor={fieldId}
    >
      {/* TextFieldProps is a variant union; the cast keeps the spread simple. */}
      <TextField id={fieldId} fullWidth required={required} error={error} {...(rest as any)} />
    </FieldShell>
  );
}

// ─── Loading & empty states ─────────────────────────────────────────────────

/** Shimmering placeholder matching the component it stands in for. */
export function PaperSkeleton({
  height = 16,
  width = "100%",
  sx,
}: {
  height?: number | string;
  width?: number | string;
  sx?: SxProps<Theme>;
}) {
  return <Box className="paper-skeleton" sx={{ height, width, ...sx }} />;
}

/** Stack of skeleton cards used while a list loads. */
export function CardSkeletonGrid({ count = 3, height = 180 }: { count?: number; height?: number }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <PaperSkeleton key={i} height={height} />
      ))}
    </Box>
  );
}

/** Icon-based composition with descriptive text and an optional action. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <PaperCard sx={{ px: 3, py: { xs: 5, md: 7 }, textAlign: "center" }}>
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        {icon && (
          <Box
            aria-hidden
            sx={{
              width: 56,
              height: 56,
              display: "grid",
              placeItems: "center",
              bgcolor: hexToRgba(accent.coral, 0.1),
              color: accent.coralInk,
              clipPath: cornerCut(14),
              "& svg": { fontSize: 28 },
            }}
          >
            {icon}
          </Box>
        )}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 420 }}>
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
    </PaperCard>
  );
}

// ─── Status dot ─────────────────────────────────────────────────────────────

/** Square status marker rotated 45° — a diamond, never a circle. */
export function StatusMark({
  color = accent.sageDeep,
  size = 8,
  pulse = false,
  sx,
}: {
  color?: string;
  size?: number;
  pulse?: boolean;
  sx?: SxProps<Theme>;
}) {
  return (
    <Box
      aria-hidden
      className={pulse ? "ws-pulse" : undefined}
      sx={{
        width: size,
        height: size,
        bgcolor: color,
        transform: "rotate(45deg)",
        flexShrink: 0,
        ...sx,
      }}
    />
  );
}
