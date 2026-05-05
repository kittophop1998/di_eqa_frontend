"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { LiveSocket, type WSMessage } from "@/lib/ws";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import CircularProgress from "@mui/material/CircularProgress";

import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import StopOutlinedIcon from "@mui/icons-material/StopOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
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

  const statusChip = (status: string) => {
    if (status === "running")
      return (
        <Chip
          icon={<FiberManualRecordIcon sx={{ fontSize: 10 }} />}
          color="success"
          label="กำลังเปิด"
          sx={{ fontWeight: 600 }}
        />
      );
    if (status === "ended")
      return (
        <Chip
          icon={<FiberManualRecordIcon sx={{ fontSize: 10 }} />}
          color="default"
          label="สิ้นสุดแล้ว"
          sx={{ fontWeight: 600 }}
        />
      );
    return (
      <Chip
        icon={<FiberManualRecordIcon sx={{ fontSize: 10 }} />}
        color="warning"
        label="รอเริ่ม"
        sx={{ fontWeight: 600 }}
      />
    );
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Header />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Link
          component={NextLink}
          href="/admin"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            color: "primary.main",
            fontWeight: 600,
            fontSize: "0.875rem",
            mb: 2,
          }}
        >
          <ArrowBackOutlinedIcon fontSize="small" />
          กลับแผงควบคุม
        </Link>

        {!session ? (
          <Card variant="outlined">
            <Box sx={{ p: 6, textAlign: "center", color: "text.secondary" }}>
              <CircularProgress size={20} sx={{ mr: 1, verticalAlign: "middle" }} />
              กำลังโหลด...
            </Box>
          </Card>
        ) : (
          <>
            <Card variant="outlined">
              <Box sx={{ p: { xs: 3, md: 4 } }}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={2}
                  sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                      รหัสเซสชัน
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{ fontFamily: "monospace", fontWeight: 800, letterSpacing: "0.1em", mt: 0.5 }}
                    >
                      {session.code}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: "center" }}>
                      <Box className="ws-pulse" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "success.main" }} />
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "text.secondary" }}>
                        <GroupOutlinedIcon fontSize="small" />
                        <Typography variant="body2">
                          ผู้เข้าร่วมออนไลน์ <Box component="strong" sx={{ color: "text.primary" }}>{presence}</Box> คน
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                  <Box>{statusChip(session.status)}</Box>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: "wrap", rowGap: 1 }}>
                  {session.status === "pending" && (
                    <Button
                      onClick={start}
                      disabled={busy}
                      variant="contained"
                      color="success"
                      startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <PlayArrowOutlinedIcon />}
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
                      startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <StopOutlinedIcon />}
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
                    color="secondary"
                    startIcon={<VisibilityOutlinedIcon />}
                  >
                    ดูข้อสอบ
                  </Button>
                </Stack>

                {err && (
                  <Alert severity="error" sx={{ mt: 2.5 }}>
                    {err}
                  </Alert>
                )}
              </Box>
            </Card>

            <Box sx={{ mt: 4 }}>
              <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
                <LeaderboardOutlinedIcon color="primary" />
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  กระดานคะแนน (เรียลไทม์)
                </Typography>
              </Stack>
              <Card variant="outlined">
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 80 }}>อันดับ</TableCell>
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
                        board.map((e) => (
                          <TableRow key={e.userId} hover>
                            <TableCell>
                              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                                {e.rank <= 3 && (
                                  <EmojiEventsOutlinedIcon
                                    fontSize="small"
                                    sx={{
                                      color:
                                        e.rank === 1
                                          ? "#D97706"
                                          : e.rank === 2
                                            ? "#94A3B8"
                                            : "#A16207",
                                    }}
                                  />
                                )}
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                  #{e.rank}
                                </Typography>
                              </Stack>
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
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {e.score}{" "}
                                <Box component="span" sx={{ color: "text.disabled", fontWeight: 400 }}>
                                  / {e.total}
                                </Box>
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}
