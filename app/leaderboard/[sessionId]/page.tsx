"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { LiveSocket, type WSMessage } from "@/lib/ws";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

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
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0F172A 100%)",
        color: "common.white",
      }}
    >
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", flexWrap: "wrap", rowGap: 2 }}
        >
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: connected ? "success.light" : "warning.light",
                }}
              />
              <Typography
                variant="overline"
                sx={{ color: "#BFDBFE", letterSpacing: "0.22em", fontWeight: 700 }}
              >
                {connected ? "Live" : "Connecting"}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: "center" }}>
              <EmojiEventsOutlinedIcon sx={{ color: "#FBBF24", fontSize: 32 }} />
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                กระดานคะแนนสด
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: "#BFDBFE", mt: 0.5 }}>
              ผู้เข้าร่วมออนไลน์ {presence} คน · อัปเดตทันทีเมื่อมีคนส่งคำตอบ
            </Typography>
          </Box>
          <Button
            component={NextLink}
            href={`/admin/session/${params.sessionId}`}
            variant="outlined"
            startIcon={<ArrowBackOutlinedIcon />}
            sx={{
              color: "common.white",
              borderColor: "rgba(255,255,255,0.25)",
              bgcolor: "rgba(255,255,255,0.06)",
              "&:hover": { borderColor: "rgba(255,255,255,0.5)", bgcolor: "rgba(255,255,255,0.12)" },
            }}
          >
            กลับ
          </Button>
        </Stack>

        <Stack spacing={1.25} sx={{ mt: 5 }}>
          {board.length === 0 ? (
            <Box
              sx={{
                p: 6,
                borderRadius: 3,
                textAlign: "center",
                bgcolor: "rgba(255,255,255,0.05)",
                color: "#BFDBFE",
              }}
            >
              <Typography>กำลังรอผู้เข้าร่วมส่งคำตอบ...</Typography>
            </Box>
          ) : (
            board.map((e, i) => {
              const pct = e.total > 0 ? Math.round((e.score / e.total) * 100) : 0;
              const isTop = i < 3;
              const flashing = flashId === e.userId;
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
              const medalBg =
                i === 0 ? "#D97706" : i === 1 ? "#94A3B8" : i === 2 ? "#A16207" : "rgba(255,255,255,0.12)";
              return (
                <Stack
                  key={e.userId}
                  direction="row"
                  spacing={2}
                  sx={{
                    px: 2,
                    py: 2,
                    borderRadius: 3,
                    alignItems: "center",
                    transition: "all 0.3s ease",
                    bgcolor: flashing
                      ? "rgba(34,197,94,0.32)"
                      : isTop
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(255,255,255,0.05)",
                    boxShadow: flashing
                      ? "0 0 0 2px rgba(74,222,128,0.6)"
                      : isTop
                        ? "inset 0 0 0 1px rgba(255,255,255,0.18)"
                        : "none",
                  }}
                >
                  <Avatar
                    variant="rounded"
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: medalBg,
                      color: "common.white",
                      fontSize: 18,
                      fontWeight: 800,
                    }}
                  >
                    {medal}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700 }} noWrap>
                      {e.fullName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#BFDBFE" }}>
                      @{e.username} · {e.hospital}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {e.score}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#BFDBFE" }}>
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
