"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth, type User } from "@/lib/auth";
import { LiveSocket, type WSMessage } from "@/lib/ws";
import {
  CardSkeletonGrid,
  EmptyState,
  Eyebrow,
  PaperCard,
  SectionHeading,
  StatusMark,
} from "@/components/ui";
import { accent, paper, fadeUp, hexToRgba, chevronCut, monoSx, liftSx } from "@/lib/design";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import GridViewOutlinedIcon from "@mui/icons-material/GridViewOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PlayCircleOutlinedIcon from "@mui/icons-material/PlayCircleOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";

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
  const [loading, setLoading] = useState(true);
  const [liveBanner, setLiveBanner] = useState<{ sessionId: string; quizId: string } | null>(null);
  // Read after mount — localStorage is unavailable during SSR, and reading it
  // while rendering makes the server and client markup disagree.
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth.isAuthed()) {
      router.replace("/");
      return;
    }
    setUser(auth.getUser());
    Promise.all([
      api<QuizListItem[]>("/api/quizzes"),
      api<SubmissionItem[]>("/api/submissions/me"),
      api<ActiveSession[]>("/api/sessions/active"),
    ])
      .then(([q, h, a]) => {
        setQuizzes(q || []);
        setHistory(h || []);
        setActive(a || []);
        setLoading(false);
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

  const activeQuizIds = new Set(active.map((s) => s.quizId));
  const standaloneQuizzes = quizzes.filter((q) => !activeQuizIds.has(q.id));

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <Header />

      {/* ─── Live session banner ─── */}
      {liveBanner && (
        <Box sx={{ bgcolor: paper.ink, color: paper.white, borderBottom: `3px solid ${accent.coral}` }}>
          <Container maxWidth="lg" sx={{ py: 1.75 }}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ alignItems: "center", flexWrap: "wrap", rowGap: 1.5 }}
            >
              <StatusMark color={accent.coral} size={10} pulse />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  วิทยากรเปิดข้อสอบสด
                </Typography>
                <Typography variant="caption" sx={{ color: hexToRgba(paper.white, 0.7) }}>
                  เข้าร่วมเซสชันเพื่อทำข้อสอบและขึ้นกระดานคะแนน
                </Typography>
              </Box>
              <Button
                component={NextLink}
                href={`/quiz/${liveBanner.quizId}?session=${liveBanner.sessionId}`}
                variant="contained"
                color="primary"
                size="small"
                endIcon={<ArrowForwardOutlinedIcon />}
              >
                เข้าร่วมตอนนี้
              </Button>
            </Stack>
          </Container>
        </Box>
      )}

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        {/* ─── Greeting ─── */}
        <Stack spacing={1.5} sx={{ mb: { xs: 4, md: 6 }, ...fadeUp() }}>
          <Eyebrow>แดชบอร์ด</Eyebrow>
          <Typography variant="h3">สวัสดี, {user?.fullName}</Typography>
          <Typography variant="body1" color="text.secondary">
            เลือกข้อสอบที่ต้องการทำ หรือดูประวัติคะแนนของคุณ
          </Typography>
        </Stack>

        {/* ─── Live sessions ─── */}
        {active.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <SectionHeading icon={<LiveTvOutlinedIcon />} title="เซสชันสดที่กำลังเปิดอยู่" tone="success" />
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
              }}
            >
              {active.map((s, i) => (
                <PaperCard
                  key={s.id}
                  cut={20}
                  edge={accent.sageDeep}
                  sx={{
                    bgcolor: hexToRgba(accent.sage, 0.14),
                    ...liftSx,
                    ...fadeUp(i),
                  }}
                >
                  <Box
                    component={NextLink}
                    href={`/quiz/${s.quizId}?session=${s.id}`}
                    sx={{ display: "block", p: 2.5 }}
                  >
                    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <StatusMark
                          color={s.status === "running" ? accent.sageDeep : accent.warmDeep}
                          pulse={s.status === "running"}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: "0.04em" }}>
                          {s.status === "running" ? "กำลังดำเนินการ" : "รอเริ่ม"}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ ...monoSx, color: "text.secondary" }}>
                        {s.code}
                      </Typography>
                    </Stack>
                    <Typography variant="subtitle1" sx={{ mt: 1.75, fontWeight: 700 }}>
                      เข้าร่วมเซสชันสำหรับการอบรม
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      เริ่มทำข้อสอบและขึ้นกระดานคะแนนแบบเรียลไทม์
                    </Typography>
                  </Box>
                </PaperCard>
              ))}
            </Box>
          </Box>
        )}

        {/* ─── Quiz catalogue ─── */}
        <Box sx={{ mb: 6 }}>
          <SectionHeading icon={<GridViewOutlinedIcon />} title="ข้อสอบทั้งหมด" />
          {loading ? (
            <CardSkeletonGrid count={3} height={230} />
          ) : standaloneQuizzes.length === 0 ? (
            <EmptyState
              icon={<ScienceOutlinedIcon />}
              title="ยังไม่มีข้อสอบในระบบ"
              description="เมื่อวิทยากรเผยแพร่ชุดข้อสอบ รายการจะปรากฏที่นี่"
            />
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
              }}
            >
              {standaloneQuizzes.map((q, i) => (
                <PaperCard
                  key={q.id}
                  cut={20}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    p: 2.5,
                    ...liftSx,
                    ...fadeUp(i),
                  }}
                >
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                    <Box
                      sx={{
                        px: 1.25,
                        py: 0.4,
                        clipPath: chevronCut(7),
                        bgcolor: hexToRgba(accent.coral, 0.14),
                        color: accent.coralInk,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {q.category}
                    </Box>
                    <Typography variant="caption" sx={{ ...monoSx, color: "text.secondary" }}>
                      {q.cellCount} เซลล์
                    </Typography>
                  </Stack>

                  <Typography variant="h6" sx={{ mt: 1.75, fontWeight: 700, lineHeight: 1.35 }}>
                    {q.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 0.75,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {q.description}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                      mt: "auto",
                      pt: 2,
                      alignItems: "center",
                      color: "text.secondary",
                    }}
                  >
                    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                      <AccessTimeOutlinedIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption" sx={monoSx}>
                        {Math.floor(q.durationSec / 60)} นาที
                      </Typography>
                    </Stack>
                    <Box aria-hidden sx={{ width: 4, height: 4, bgcolor: paper.fold, transform: "rotate(45deg)" }} />
                    <Typography variant="caption">
                      เกณฑ์ผ่าน{" "}
                      <Box component="span" sx={monoSx}>
                        {q.passPercent || 80}%
                      </Box>
                    </Typography>
                  </Stack>

                  <Button
                    component={NextLink}
                    href={`/quiz/${q.id}`}
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<PlayCircleOutlinedIcon />}
                    sx={{ mt: 2 }}
                  >
                    เริ่มทำข้อสอบ
                  </Button>
                </PaperCard>
              ))}
            </Box>
          )}
        </Box>

        {/* ─── Score history ─── */}
        <Box>
          <SectionHeading icon={<HistoryOutlinedIcon />} title="ประวัติคะแนน" />
          {loading ? (
            <PaperCard sx={{ p: 2.5 }}>
              <Stack spacing={1.5}>
                {[0, 1, 2].map((i) => (
                  <Box key={i} className="paper-skeleton" sx={{ height: 44 }} />
                ))}
              </Stack>
            </PaperCard>
          ) : history.length === 0 ? (
            <EmptyState
              icon={<HistoryOutlinedIcon />}
              title="ยังไม่มีประวัติการทำข้อสอบ"
              description="เมื่อคุณส่งคำตอบครั้งแรก ผลคะแนนจะถูกบันทึกไว้ที่นี่"
              action={
                standaloneQuizzes.length > 0 ? (
                  <Button
                    component={NextLink}
                    href={`/quiz/${standaloneQuizzes[0].id}`}
                    variant="contained"
                    color="primary"
                    startIcon={<PlayCircleOutlinedIcon />}
                  >
                    เริ่มทำข้อสอบแรก
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <PaperCard>
              {history.map((s, i) => {
                const pct = s.percent ?? (s.total > 0 ? Math.round((s.score / s.total) * 100) : 0);
                const tone =
                  pct >= 80 ? accent.sageDeep : pct >= 60 ? accent.warmDeep : "#C2453D";
                return (
                  <Box
                    key={s.id}
                    component={NextLink}
                    href={`/submissions/${s.id}`}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      px: 2.5,
                      py: 2,
                      borderTop: i === 0 ? "none" : `1px solid ${paper.crease}`,
                      borderLeft: "3px solid transparent",
                      transition: "background-color 200ms, border-color 200ms",
                      "&:hover": {
                        bgcolor: hexToRgba(accent.coral, 0.05),
                        borderLeftColor: accent.coral,
                      },
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 0.5, alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          จำแนกถูก{" "}
                          <Box component="span" sx={monoSx}>
                            {s.correct} / {s.total}
                          </Box>{" "}
                          เซลล์
                        </Typography>
                        {s.passed && (
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{
                              alignItems: "center",
                              px: 1,
                              py: 0.25,
                              bgcolor: hexToRgba(accent.warm, 0.32),
                              color: accent.warmDeep,
                              clipPath: chevronCut(6),
                            }}
                          >
                            <EmojiEventsOutlinedIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              ได้ใบประกาศ
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(s.submittedAt).toLocaleString("th-TH")}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        minWidth: 68,
                        textAlign: "center",
                        bgcolor: hexToRgba(tone, 0.12),
                        color: tone,
                        borderLeft: `3px solid ${tone}`,
                        ...monoSx,
                        fontWeight: 700,
                      }}
                    >
                      {pct}%
                    </Box>
                  </Box>
                );
              })}
            </PaperCard>
          )}
        </Box>
      </Container>
    </Box>
  );
}
