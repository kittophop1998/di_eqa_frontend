"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Alert from "@mui/material/Alert";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PlayCircleOutlinedIcon from "@mui/icons-material/PlayCircleOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

type QuizListItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  cellCount: number;
  passPercent: number;
  durationSec: number;
};

type SubmissionItem = {
  id: string;
  quizId: string;
  score: number;
  total: number;
  correct: number;
  percent: number;
  passed: boolean;
  certificateId?: string;
  submittedAt: string;
};

type ActiveSession = {
  id: string;
  code: string;
  quizId: string;
  status: string;
  startedAt?: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [history, setHistory] = useState<SubmissionItem[]>([]);
  const [active, setActive] = useState<ActiveSession[]>([]);
  const [liveBanner, setLiveBanner] = useState<{ sessionId: string; quizId: string } | null>(null);

  useEffect(() => {
    if (!auth.isAuthed()) {
      router.replace("/");
      return;
    }
    Promise.all([
      api<QuizListItem[]>("/api/quizzes"),
      api<SubmissionItem[]>("/api/submissions/me"),
      api<ActiveSession[]>("/api/sessions/active"),
    ])
      .then(([q, h, a]) => {
        setQuizzes(q || []);
        setHistory(h || []);
        setActive(a || []);
      })
      .catch(() => {
        auth.logout();
        router.replace("/");
      });

    const sock = new LiveSocket();
    sock.connect();
    const u = auth.getUser();
    const hospitalRoom = u?.hospitalId ? `hospital:${u.hospitalId}` : "global";
    sock.join(hospitalRoom);
    const off = sock.on((msg: WSMessage) => {
      if (msg.type === "session:start" && msg.payload) {
        setLiveBanner({ sessionId: msg.payload.sessionId, quizId: msg.payload.quizId });
        api<ActiveSession[]>("/api/sessions/active").then((a) => setActive(a || []));
      }
    });
    return () => {
      off();
      sock.close();
    };
  }, [router]);

  const user = auth.getUser();
  const activeQuizIds = new Set(active.map((s) => s.quizId));
  const standaloneQuizzes = quizzes.filter((q) => !activeQuizIds.has(q.id));

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Header />

      {liveBanner && (
        <Alert
          icon={<LiveTvOutlinedIcon />}
          severity="success"
          variant="filled"
          sx={{
            borderRadius: 0,
            justifyContent: "center",
            "& .MuiAlert-message": {
              display: "flex",
              width: "100%",
              maxWidth: "75rem",
              mx: "auto",
              alignItems: "center",
              gap: 2,
            },
          }}
        >
          <Stack direction="row" spacing={2} sx={{ flexGrow: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                วิทยากรเปิดข้อสอบสด
              </Typography>
              <Typography variant="caption">
                เข้าร่วมเซสชันเพื่อทำข้อสอบและขึ้นกระดานคะแนน
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              component={NextLink}
              href={`/quiz/${liveBanner.quizId}?session=${liveBanner.sessionId}`}
              variant="contained"
              color="inherit"
              size="small"
              sx={{ bgcolor: "common.white", color: "success.dark", "&:hover": { bgcolor: "grey.100" } }}
              endIcon={<ArrowForwardOutlinedIcon />}
            >
              เข้าร่วมตอนนี้
            </Button>
          </Stack>
        </Alert>
      )}

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            สวัสดี, {user?.fullName}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            เลือกข้อสอบที่ต้องการทำ หรือดูประวัติคะแนนของคุณ
          </Typography>
        </Box>

        {active.length > 0 && (
          <Box sx={{ mb: 5 }}>
            <SectionHeading icon={<LiveTvOutlinedIcon />} title="เซสชันสดที่กำลังเปิดอยู่" accent="success" />
            <Grid container spacing={2}>
              {active.map((s) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={s.id}>
                  <Card variant="outlined" sx={{ borderColor: "success.light", bgcolor: "rgba(34,197,94,0.04)" }}>
                    <CardActionArea component={NextLink} href={`/quiz/${s.quizId}?session=${s.id}`} sx={{ p: 2.5 }}>
                      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Chip
                          size="small"
                          icon={<FiberManualRecordIcon sx={{ fontSize: 10 }} />}
                          label={s.status === "running" ? "กำลังดำเนินการ" : "รอเริ่ม"}
                          color={s.status === "running" ? "success" : "warning"}
                          sx={{ fontWeight: 600 }}
                        />
                        <Typography variant="caption" color="text.disabled" sx={{ fontFamily: "monospace" }}>
                          {s.code}
                        </Typography>
                      </Stack>
                      <Typography variant="subtitle1" sx={{ mt: 1.5, fontWeight: 700 }}>
                        เข้าร่วมเซสชันสำหรับการอบรม
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        เริ่มทำข้อสอบและขึ้นกระดานคะแนนแบบเรียลไทม์
                      </Typography>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        <Box sx={{ mb: 5 }}>
          <SectionHeading icon={<GridViewOutlinedIcon />} title="ข้อสอบทั้งหมด" />
          {standaloneQuizzes.length === 0 ? (
            <EmptyState text="ยังไม่มีข้อสอบในระบบ" />
          ) : (
            <Grid container spacing={2}>
              {standaloneQuizzes.map((q) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={q.id}>
                  <Card variant="outlined" sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.25 }}>
                      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Chip size="small" label={q.category} color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                        <Typography variant="caption" color="text.secondary">
                          {q.cellCount} เซลล์
                        </Typography>
                      </Stack>
                      <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                        {q.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {q.description}
                      </Typography>
                      <Stack direction="row" spacing={1.5} sx={{ color: "text.secondary", mt: "auto", pt: 1, alignItems: "center" }}>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                          <AccessTimeOutlinedIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption">{Math.floor(q.durationSec / 60)} นาที</Typography>
                        </Stack>
                        <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "text.disabled" }} />
                        <Typography variant="caption">เกณฑ์ผ่าน {q.passPercent || 80}%</Typography>
                      </Stack>
                      <Button
                        component={NextLink}
                        href={`/quiz/${q.id}`}
                        variant="contained"
                        color="primary"
                        startIcon={<PlayCircleOutlinedIcon />}
                        sx={{ mt: 1 }}
                      >
                        เริ่มทำข้อสอบ
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Box>
          <SectionHeading icon={<HistoryOutlinedIcon />} title="ประวัติคะแนน" />
          {history.length === 0 ? (
            <EmptyState text="ยังไม่มีประวัติการทำข้อสอบ" />
          ) : (
            <Card variant="outlined">
              <Stack divider={<Divider />}>
                {history.map((s) => {
                  const pct = s.percent ?? (s.total > 0 ? Math.round((s.score / s.total) * 100) : 0);
                  const tone = pct >= 80 ? "success" : pct >= 60 ? "warning" : "error";
                  return (
                    <CardActionArea key={s.id} component={NextLink} href={`/submissions/${s.id}`}>
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{ p: 2, alignItems: "center", justifyContent: "space-between" }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.5, alignItems: "center" }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              จำแนกถูก {s.correct} / {s.total} เซลล์
                            </Typography>
                            {s.passed && (
                              <Chip
                                size="small"
                                icon={<EmojiEventsOutlinedIcon sx={{ fontSize: 14 }} />}
                                label="ได้ใบประกาศ"
                                color="warning"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                            )}
                          </Stack>
                          <Typography variant="caption" color="text.disabled">
                            {new Date(s.submittedAt).toLocaleString("th-TH")}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${pct}%`}
                          color={tone as any}
                          sx={{ fontWeight: 700, fontSize: "0.85rem", minWidth: 60 }}
                        />
                      </Stack>
                    </CardActionArea>
                  );
                })}
              </Stack>
            </Card>
          )}
        </Box>
      </Container>
    </Box>
  );
}

function SectionHeading({
  icon,
  title,
  accent,
}: {
  icon?: React.ReactNode;
  title: string;
  accent?: "success" | "primary";
}) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ mb: 2, alignItems: "center" }}>
      {icon && (
        <Avatar
          variant="rounded"
          sx={{
            width: 32,
            height: 32,
            bgcolor: accent === "success" ? "rgba(34,197,94,0.12)" : "rgba(30,58,138,0.08)",
            color: accent === "success" ? "success.dark" : "primary.main",
          }}
        >
          {icon}
        </Avatar>
      )}
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
    </Stack>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card variant="outlined">
      <Box sx={{ p: 6, textAlign: "center", color: "text.secondary" }}>
        <Typography>{text}</Typography>
      </Box>
    </Card>
  );
}
