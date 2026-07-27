"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { LiveSocket, type WSMessage } from "@/lib/ws";
import { StatusMark, Tessellation } from "@/components/ui";
import {
  accent,
  paper,
  medal,
  fadeUp,
  hexToRgba,
  chevronCut,
  monoSx,
  easing,
  duration,
} from "@/lib/design";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";

type Entry = {
  rank: number;
  userId: string;
  username: string;
  fullName: string;
  hospital: string;
  score: number;
  total: number;
  correct: number;
};

export default function LeaderboardPage() {
  const params = useParams<{ sessionId: string }>();
  const [board, setBoard] = useState<Entry[]>([]);
  const [presence, setPresence] = useState(0);
  const [flashId, setFlashId] = useState<string>("");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!auth.isAuthed()) return;
    const refresh = () =>
      api<Entry[]>(`/api/sessions/${params.sessionId}/leaderboard?limit=50`)
        .then(setBoard)
        .catch(() => {});
    refresh();
    const interval = setInterval(refresh, 8000);

    const sock = new LiveSocket();
    sock.connect();
    setTimeout(() => setConnected(true), 600);
    sock.join(`session:${params.sessionId}`);
    const off = sock.on((msg: WSMessage) => {
      if (msg.type === "leaderboard:update" && msg.payload) {
        setFlashId(msg.payload.userId);
        setTimeout(() => setFlashId(""), 1800);
        refresh();
      } else if (msg.type === "presence" && msg.payload) {
        setPresence(msg.payload.count || 0);
      }
    });
    return () => {
      clearInterval(interval);
      off();
      sock.close();
    };
  }, [params.sessionId]);

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        bgcolor: paper.ink,
        color: paper.white,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Tessellation color={paper.white} alpha={0.03} size={88} sx={{ position: "fixed" }} />
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          top: 0,
          right: 0,
          width: { xs: 200, md: 360 },
          height: { xs: 200, md: 360 },
          bgcolor: hexToRgba(paper.white, 0.05),
          clipPath: "polygon(100% 0, 100% 100%, 0 0)",
        }}
      />

      <Container maxWidth="md" sx={{ position: "relative", py: { xs: 4, md: 6 } }}>
        {/* ─── Header ─── */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            flexWrap: "wrap",
            rowGap: 2,
            ...fadeUp(),
          }}
        >
          <Box>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", mb: 1.5 }}>
              <StatusMark color={connected ? accent.sage : accent.warm} pulse={connected} />
              <Typography
                variant="overline"
                sx={{ color: connected ? accent.sage : accent.warm, lineHeight: 1.4 }}
              >
                {connected ? "Live" : "Connecting"}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <EmojiEventsOutlinedIcon sx={{ color: accent.warm, fontSize: 34 }} />
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                กระดานคะแนนสด
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{ mt: 1.25, alignItems: "center", color: hexToRgba(paper.white, 0.65) }}
            >
              <GroupOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="body2">
                ผู้เข้าร่วมออนไลน์{" "}
                <Box component="span" sx={{ ...monoSx, fontWeight: 700, color: paper.white }}>
                  {presence}
                </Box>{" "}
                คน · อัปเดตทันทีเมื่อมีคนส่งคำตอบ
              </Typography>
            </Stack>
          </Box>

          <Button
            component={NextLink}
            href={`/admin/session/${params.sessionId}`}
            variant="outlined"
            startIcon={<ArrowBackOutlinedIcon />}
            sx={{
              color: paper.white,
              borderColor: hexToRgba(paper.white, 0.28),
              "&:hover": { borderColor: accent.coral, bgcolor: hexToRgba(accent.coral, 0.12) },
            }}
          >
            กลับ
          </Button>
        </Stack>

        {/* ─── Board ─── */}
        <Stack spacing={1.25} sx={{ mt: 5 }}>
          {board.length === 0 ? (
            <Box
              sx={{
                p: 6,
                textAlign: "center",
                bgcolor: hexToRgba(paper.white, 0.05),
                borderLeft: `3px solid ${hexToRgba(paper.white, 0.2)}`,
                color: hexToRgba(paper.white, 0.7),
              }}
            >
              <Typography>กำลังรอผู้เข้าร่วมส่งคำตอบ...</Typography>
              <Box className="paper-skeleton" sx={{ height: 3, mt: 3, opacity: 0.25 }} />
            </Box>
          ) : (
            board.map((e, i) => {
              const pct = e.total > 0 ? Math.round((e.score / e.total) * 100) : 0;
              const isTop = i < 3;
              const flashing = flashId === e.userId;
              const rankFill =
                i === 0 ? medal.first : i === 1 ? medal.second : i === 2 ? medal.third : hexToRgba(paper.white, 0.1);

              return (
                <Stack
                  key={e.userId}
                  direction="row"
                  spacing={2}
                  sx={{
                    px: 2,
                    py: 1.75,
                    alignItems: "center",
                    transition: `background-color ${duration.entry}ms ${easing}, transform ${duration.hover}ms ${easing}`,
                    bgcolor: flashing
                      ? hexToRgba(accent.sage, 0.3)
                      : isTop
                        ? hexToRgba(paper.white, 0.1)
                        : hexToRgba(paper.white, 0.05),
                    borderLeft: `3px solid ${
                      flashing ? accent.sage : isTop ? rankFill : hexToRgba(paper.white, 0.15)
                    }`,
                    transform: flashing ? "translateX(6px)" : "none",
                    ...fadeUp(Math.min(i, 8)),
                  }}
                >
                  {/* Rank facet — numerals, no emoji medals. */}
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      clipPath: chevronCut(12),
                      bgcolor: rankFill,
                      color: isTop ? paper.ink : paper.white,
                      ...monoSx,
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                    }}
                  >
                    {i + 1}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                      {e.fullName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: hexToRgba(paper.white, 0.6) }} noWrap>
                      @{e.username} · {e.hospital}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                    <Typography sx={{ ...monoSx, fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.1 }}>
                      {e.score}
                    </Typography>
                    <Typography variant="caption" sx={{ ...monoSx, color: hexToRgba(paper.white, 0.6) }}>
                      / {e.total} ({pct}%)
                    </Typography>
                  </Box>
                </Stack>
              );
            })
          )}
        </Stack>
      </Container>
    </Box>
  );
}
