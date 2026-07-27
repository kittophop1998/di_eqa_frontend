"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { LiveSocket, type WSMessage } from "@/lib/ws";
import { Eyebrow, PaperCard, PaperSkeleton, SectionHeading, StatusMark } from "@/components/ui";
import {
  accent,
  paper,
  medal,
  fadeUp,
  hexToRgba,
  chevronCut,
  monoSx,
  tessellation,
} from "@/lib/design";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import StopOutlinedIcon from "@mui/icons-material/StopOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";

type Session = {
  id: string;
  code: string;
  quizId: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
};

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

export default function AdminSessionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [board, setBoard] = useState<Entry[]>([]);
  const [presence, setPresence] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const u = auth.getUser();
    if (!u) {
      router.replace("/");
      return;
    }
    if (u.role !== "instructor" && u.role !== "admin") {
      router.replace("/dashboard");
      return;
    }
    const refresh = () => {
      api<Session>(`/api/sessions/${params.id}`).then(setSession).catch((e) => setErr(e.message));
      api<Entry[]>(`/api/sessions/${params.id}/leaderboard?limit=100`).then(setBoard).catch(() => {});
    };
    refresh();

    const sock = new LiveSocket();
    sock.connect();
    sock.join(`session:${params.id}`);
    const off = sock.on((msg: WSMessage) => {
      if (msg.type === "leaderboard:update" || msg.type === "submission:new") {
        api<Entry[]>(`/api/sessions/${params.id}/leaderboard?limit=100`).then(setBoard).catch(() => {});
      } else if (msg.type === "presence" && msg.payload) {
        setPresence(msg.payload.count || 0);
      } else if (msg.type === "session:end") {
        refresh();
      }
    });

    return () => {
      off();
      sock.close();
    };
  }, [params.id, router]);

  const start = async () => {
    setBusy(true);
    setErr("");
    try {
      const s = await api<Session>(`/api/sessions/${params.id}/start`, { method: "POST" });
      setSession(s);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const end = async () => {
    setBusy(true);
    setErr("");
    try {
      const s = await api<Session>(`/api/sessions/${params.id}/end`, { method: "POST" });
      setSession(s);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const statusTag = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      running: { label: "กำลังเปิด", color: accent.sage },
      ended: { label: "สิ้นสุดแล้ว", color: paper.fold },
    };
    const s = map[status] ?? { label: "รอเริ่ม", color: accent.warm };
    return (
      <Stack
        direction="row"
        spacing={1}
        sx={{
          px: 1.75,
          py: 0.75,
          alignItems: "center",
          bgcolor: hexToRgba(paper.white, 0.1),
          clipPath: chevronCut(9),
        }}
      >
        <StatusMark color={s.color} pulse={status === "running"} />
        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.04em" }}>
          {s.label}
        </Typography>
      </Stack>
    );
  };

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Link
          component={NextLink}
          href="/admin"
          sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, fontSize: "0.875rem", mb: 2.5 }}
        >
          <ArrowBackOutlinedIcon fontSize="small" />
          กลับแผงควบคุม
        </Link>

        {!session ? (
          <Stack spacing={2}>
            <PaperSkeleton height={200} />
            <PaperSkeleton height={280} />
          </Stack>
        ) : (
          <>
            {/* ─── Session control panel ─── */}
            <PaperCard cut={30} sx={{ p: 0, overflow: "hidden", ...fadeUp() }}>
              <Box
                sx={{
                  position: "relative",
                  p: { xs: 3, md: 4 },
                  bgcolor: paper.ink,
                  color: paper.white,
                  overflow: "hidden",
                }}
              >
                <Box aria-hidden sx={{ position: "absolute", inset: 0, ...tessellation(paper.white, 0.035, 80) }} />
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2.5}
                  sx={{
                    position: "relative",
                    alignItems: { xs: "flex-start", md: "center" },
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Eyebrow onDark>รหัสเซสชัน</Eyebrow>
                    <Typography
                      sx={{
                        ...monoSx,
                        mt: 1.5,
                        fontWeight: 700,
                        fontSize: { xs: "2.25rem", md: "3rem" },
                        letterSpacing: "0.12em",
                        lineHeight: 1,
                        color: accent.coral,
                      }}
                    >
                      {session.code}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ mt: 2, alignItems: "center", color: hexToRgba(paper.white, 0.7) }}
                    >
                      <GroupOutlinedIcon sx={{ fontSize: 16 }} />
                      <Typography variant="body2">
                        ผู้เข้าร่วมออนไลน์{" "}
                        <Box component="span" sx={{ ...monoSx, fontWeight: 700, color: paper.white }}>
                          {presence}
                        </Box>{" "}
                        คน
                      </Typography>
                    </Stack>
                  </Box>
                  {statusTag(session.status)}
                </Stack>
              </Box>

              <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 1.5 }}>
                  {session.status === "pending" && (
                    <Button
                      onClick={start}
                      disabled={busy}
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrowOutlinedIcon />}
                    >
                      เปิดข้อสอบให้ทุกคนพร้อมกัน
                    </Button>
                  )}
                  {session.status === "running" && (
                    <Button
                      onClick={end}
                      disabled={busy}
                      variant="contained"
                      color="error"
                      startIcon={<StopOutlinedIcon />}
                    >
                      หยุดเซสชัน
                    </Button>
                  )}
                  <Button
                    component={NextLink}
                    href={`/leaderboard/${session.id}`}
                    variant="outlined"
                    startIcon={<LeaderboardOutlinedIcon />}
                  >
                    เปิดกระดานคะแนนสด
                  </Button>
                  <Button
                    component={NextLink}
                    href={`/quiz/${session.quizId}?session=${session.id}`}
                    variant="outlined"
                    startIcon={<VisibilityOutlinedIcon />}
                  >
                    ดูข้อสอบ
                  </Button>
                </Stack>

                {busy && <Box className="paper-skeleton" sx={{ height: 3, mt: 2 }} />}
                {err && (
                  <Alert severity="error" sx={{ mt: 2.5 }}>
                    {err}
                  </Alert>
                )}
              </Box>
            </PaperCard>

            {/* ─── Live board ─── */}
            <Box sx={{ mt: 5 }}>
              <SectionHeading icon={<LeaderboardOutlinedIcon />} title="กระดานคะแนน (เรียลไทม์)" />
              <PaperCard>
                <TableContainer sx={{ overflowX: "auto" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 90 }}>อันดับ</TableCell>
                        <TableCell>ผู้เข้าอบรม</TableCell>
                        <TableCell>โรงพยาบาล</TableCell>
                        <TableCell align="right">คะแนน</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {board.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                            ยังไม่มีผู้ส่งคำตอบ
                          </TableCell>
                        </TableRow>
                      ) : (
                        board.map((e) => {
                          const rankFill =
                            e.rank === 1
                              ? medal.first
                              : e.rank === 2
                                ? medal.second
                                : e.rank === 3
                                  ? medal.third
                                  : hexToRgba(paper.ink, 0.06);
                          return (
                            <TableRow key={e.userId} hover>
                              <TableCell>
                                <Box
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    display: "grid",
                                    placeItems: "center",
                                    clipPath: chevronCut(9),
                                    bgcolor: rankFill,
                                    color: paper.ink,
                                    ...monoSx,
                                    fontWeight: 700,
                                    fontSize: "0.875rem",
                                  }}
                                >
                                  {e.rank}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {e.fullName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  @{e.username}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ color: "text.secondary" }}>{e.hospital}</TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ ...monoSx, fontWeight: 700 }}>
                                  {e.score}
                                  <Box component="span" sx={{ color: "text.disabled", fontWeight: 400 }}>
                                    {" "}
                                    / {e.total}
                                  </Box>
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </PaperCard>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
