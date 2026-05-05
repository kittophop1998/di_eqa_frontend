"use client";

import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";

import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";

type CellAnswer = {
  cellId: string;
  imageUrl: string;
  assignedType: string;
  correctType: string;
  isCorrect: boolean;
};

type CategoryStat = {
  key: string;
  label: string;
  color: string;
  userCount: number;
  trueCount: number;
  correct: number;
};

type Submission = {
  id: string;
  quizId: string;
  quizTitle: string;
  sessionId?: string;
  fullName: string;
  username: string;
  hospitalName: string;
  score: number;
  total: number;
  correct: number;
  percent: number;
  passPercent: number;
  passed: boolean;
  certificateId?: string;
  categories: CategoryStat[];
  answers: CellAnswer[];
  durationSec: number;
  submittedAt: string;
};

export default function SubmissionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const sessionFromUrl = search.get("session") || "";
  const [sub, setSub] = useState<Submission | null>(null);
  const [err, setErr] = useState("");
  const [showWrongOnly, setShowWrongOnly] = useState(true);
  const [showCert, setShowCert] = useState(false);

  useEffect(() => {
    if (!auth.isAuthed()) {
      router.replace("/");
      return;
    }
    api<Submission>(`/api/submissions/${params.id}`)
      .then(setSub)
      .catch((e) => setErr(e.message));
  }, [params.id, router]);

  const grade = useMemo(() => {
    if (!sub) return { label: "", color: "default" as const };
    if (sub.passed) return { label: "ผ่าน", color: "success" as const };
    if (sub.percent >= 60) return { label: "ใกล้ผ่าน", color: "warning" as const };
    return { label: "ควรทบทวน", color: "error" as const };
  }, [sub]);

  const categoryByKey = useMemo(() => {
    const m = new Map<string, CategoryStat>();
    sub?.categories?.forEach((c) => m.set(c.key, c));
    return m;
  }, [sub]);

  if (err) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Header />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert severity="error">{err}</Alert>
        </Container>
      </Box>
    );
  }
  if (!sub) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Header />
        <Container maxWidth="md" sx={{ py: 8, color: "text.secondary" }}>
          <Typography>กำลังโหลดผล...</Typography>
        </Container>
      </Box>
    );
  }

  const sessionId = sub.sessionId || sessionFromUrl;
  const filteredAnswers = showWrongOnly
    ? sub.answers.filter((a) => !a.isCorrect)
    : sub.answers;

  return (
    <>
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", "@media print": { display: "none" } }}>
        <Header />
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
          <Card variant="outlined" sx={{ overflow: "hidden" }}>
            <Box
              sx={{
                p: { xs: 3, md: 4 },
                color: "common.white",
                background: sub.passed
                  ? "linear-gradient(135deg, #15803D 0%, #22C55E 100%)"
                  : "linear-gradient(135deg, #1E3A8A 0%, #3B5BDB 100%)",
              }}
            >
              <Typography variant="overline" sx={{ opacity: 0.85, letterSpacing: "0.18em" }}>
                ผลคะแนนของคุณ
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ mt: 1, alignItems: "flex-end", flexWrap: "wrap" }}>
                <Typography variant="h1" sx={{ fontWeight: 800, fontSize: { xs: "3rem", md: "4rem" }, lineHeight: 1 }}>
                  {sub.percent}%
                </Typography>
                <Typography variant="h6" sx={{ pb: 0.5, opacity: 0.92, fontWeight: 500 }}>
                  ({sub.correct} / {sub.total} เซลล์ถูก)
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", rowGap: 1, alignItems: "center" }}>
                <Chip
                  label={grade.label}
                  color={grade.color}
                  size="small"
                  sx={{ fontWeight: 700, bgcolor: "rgba(255,255,255,0.95)", color: "text.primary" }}
                />
                <Chip
                  size="small"
                  label={`เกณฑ์ผ่าน ${sub.passPercent}%`}
                  sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "common.white", fontWeight: 600 }}
                />
                <Chip
                  size="small"
                  icon={<AccessTimeOutlinedIcon sx={{ color: "common.white !important" }} />}
                  label={`ใช้เวลา ${Math.floor(sub.durationSec / 60)}:${(sub.durationSec % 60).toString().padStart(2, "0")} นาที`}
                  sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "common.white", fontWeight: 600 }}
                />
                {sub.passed && sub.certificateId && (
                  <Chip
                    size="small"
                    icon={<EmojiEventsOutlinedIcon />}
                    label={`ใบประกาศ #${sub.certificateId}`}
                    sx={{ bgcolor: "#FCD34D", color: "#78350F", fontWeight: 700 }}
                  />
                )}
              </Stack>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                p: 2.5,
                borderTop: "1px solid",
                borderColor: "divider",
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                ส่งเมื่อ {new Date(sub.submittedAt).toLocaleString("th-TH")}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                {sub.passed && (
                  <Button
                    onClick={() => setShowCert(true)}
                    variant="contained"
                    color="success"
                    startIcon={<WorkspacePremiumOutlinedIcon />}
                  >
                    ดู / พิมพ์ใบประกาศ
                  </Button>
                )}
                {sessionId && (
                  <Button
                    component={NextLink}
                    href={`/leaderboard/${sessionId}`}
                    variant="outlined"
                    color="secondary"
                    startIcon={<LeaderboardOutlinedIcon />}
                  >
                    ดูกระดานคะแนนสด
                  </Button>
                )}
                <Button
                  component={NextLink}
                  href="/dashboard"
                  variant="contained"
                  color="primary"
                  startIcon={<DashboardOutlinedIcon />}
                >
                  กลับหน้าหลัก
                </Button>
              </Stack>
            </Stack>
          </Card>

          <Typography variant="h5" sx={{ fontWeight: 700, mt: 5, mb: 2 }}>
            สรุปการนับแต่ละชนิด
          </Typography>
          <Card variant="outlined">
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ชนิด</TableCell>
                    <TableCell align="right">คุณนับได้</TableCell>
                    <TableCell align="right">เฉลย</TableCell>
                    <TableCell align="right">ถูก</TableCell>
                    <TableCell align="right">% ถูก</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sub.categories.map((c) => {
                    const pct = c.trueCount > 0 ? Math.round((c.correct / c.trueCount) * 100) : 0;
                    const tone = pct >= 80 ? "success" : pct >= 60 ? "warning" : "error";
                    return (
                      <TableRow key={c.key} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                            <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: c.color }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {c.label}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                          {c.userCount}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace", color: "text.secondary" }}>
                          {c.trueCount}
                        </TableCell>
                        <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 700, color: "success.dark" }}>
                          {c.correct}
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={`${pct}%`} size="small" color={tone as any} sx={{ fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          <Stack
            direction="row"
            spacing={2}
            sx={{ mt: 5, mb: 2, alignItems: "center", justifyContent: "space-between" }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              เฉลยรายเซลล์
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={showWrongOnly}
                  onChange={(e) => setShowWrongOnly(e.target.checked)}
                  size="small"
                />
              }
              label={
                <Typography variant="body2">
                  แสดงเฉพาะที่ตอบผิด ({sub.answers.filter((a) => !a.isCorrect).length} ใบ)
                </Typography>
              }
            />
          </Stack>

          {filteredAnswers.length === 0 ? (
            <Card variant="outlined">
              <Stack
                direction="row"
                spacing={1}
                sx={{ p: 5, alignItems: "center", justifyContent: "center", color: "success.dark" }}
              >
                <CelebrationOutlinedIcon />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  ตอบถูกทุกเซลล์!
                </Typography>
              </Stack>
            </Card>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: 1.25,
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  sm: "repeat(4, 1fr)",
                  md: "repeat(5, 1fr)",
                  lg: "repeat(6, 1fr)",
                },
              }}
            >
              {filteredAnswers.map((a) => {
                const correct = categoryByKey.get(a.correctType);
                const assigned = a.assignedType ? categoryByKey.get(a.assignedType) : null;
                return (
                  <Card
                    key={a.cellId}
                    variant="outlined"
                    sx={{
                      overflow: "hidden",
                      borderLeftWidth: 4,
                      borderLeftStyle: "solid",
                      borderLeftColor: a.isCorrect ? "success.main" : "error.main",
                    }}
                  >
                    <Box sx={{ aspectRatio: "1 / 1", bgcolor: "background.default" }}>
                      <Box
                        component="img"
                        src={a.imageUrl}
                        alt={a.cellId}
                        sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </Box>
                    <Box sx={{ p: 1, fontSize: "0.75rem" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        คุณตอบ:{" "}
                        <Box
                          component="span"
                          sx={{ fontWeight: 700, color: assigned?.color || "text.disabled" }}
                        >
                          {assigned?.label || "ไม่ได้ตอบ"}
                        </Box>
                      </Typography>
                      {!a.isCorrect && (
                        <Typography variant="caption" sx={{ display: "block", color: "success.dark", mt: 0.25 }}>
                          เฉลย:{" "}
                          <Box
                            component="span"
                            sx={{ fontWeight: 700, color: correct?.color || "success.dark" }}
                          >
                            {correct?.label}
                          </Box>
                        </Typography>
                      )}
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
        </Container>
      </Box>

      {showCert && sub.passed && (
        <CertificateOverlay sub={sub} onClose={() => setShowCert(false)} />
      )}
    </>
  );
}

function CertificateOverlay({
  sub,
  onClose,
}: {
  sub: Submission;
  onClose: () => void;
}) {
  const dateStr = new Date(sub.submittedAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          bgcolor: "rgba(0,0,0,0.6)",
          p: 2,
          "@media print": { display: "none" },
        }}
      >
        <Stack direction="row" spacing={1} sx={{ position: "absolute", top: 16, right: 16 }}>
          <Button
            onClick={() => window.print()}
            variant="contained"
            color="primary"
            startIcon={<PrintOutlinedIcon />}
          >
            พิมพ์ใบประกาศ
          </Button>
          <Button onClick={onClose} variant="outlined" color="secondary" startIcon={<CloseOutlinedIcon />}>
            ปิด
          </Button>
        </Stack>
      </Box>

      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          overflow: "auto",
          bgcolor: "common.white",
          p: 3,
          "@media print": { position: "static", p: 0 },
        }}
      >
        <Box
          className="cert-sheet"
          sx={{
            mx: "auto",
            my: 3,
            width: "100%",
            maxWidth: "56rem",
            aspectRatio: "1.414 / 1",
            border: "12px double",
            borderColor: "#A16207",
            background: "linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 50%, #FEF3C7 100%)",
            p: { xs: 4, md: 6 },
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            "@media print": { my: 0, maxWidth: "none", boxShadow: "none" },
          }}
        >
          <Stack
            sx={{
              height: "100%",
              alignItems: "center",
              justifyContent: "space-between",
              textAlign: "center",
            }}
            spacing={2}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "#854D0E", letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 700 }}
              >
                Certificate of Achievement
              </Typography>
              <Typography
                variant="h2"
                sx={{ mt: 1, fontWeight: 800, color: "#78350F", fontSize: { xs: "1.875rem", sm: "2.25rem" } }}
              >
                ใบประกาศนียบัตร
              </Typography>
              <Box sx={{ mx: "auto", mt: 1, height: 4, width: 128, bgcolor: "#A16207" }} />
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                ขอมอบใบประกาศนียบัตรฉบับนี้ให้กับ
              </Typography>
              <Typography
                variant="h2"
                sx={{ mt: 1.5, fontWeight: 800, fontSize: { xs: "1.875rem", sm: "2.25rem" } }}
              >
                {sub.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                @{sub.username} · {sub.hospitalName}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                ได้ผ่านการประเมินความรู้
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, px: 3 }}>
                "{sub.quizTitle}"
              </Typography>

              <Box
                sx={{
                  mt: 3,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 2,
                  textAlign: "center",
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                  >
                    คะแนน
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "success.dark" }}>
                    {sub.correct} / {sub.total}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                  >
                    เปอร์เซ็นต์
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "success.dark" }}>
                    {sub.percent}%
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                  >
                    เกณฑ์ผ่าน
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: "text.primary" }}>
                    {sub.passPercent}%
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ width: "100%" }}>
              <Divider sx={{ mb: 2, mx: "auto", width: "66%", borderColor: "rgba(161,98,7,0.5)" }} />
              <Stack
                direction="row"
                sx={{ alignItems: "flex-end", justifyContent: "space-between", color: "text.secondary" }}
              >
                <Box sx={{ textAlign: "left" }}>
                  <Typography
                    variant="caption"
                    sx={{ textTransform: "uppercase", letterSpacing: "0.18em", fontSize: 10 }}
                  >
                    Certificate ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                    {sub.certificateId}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
                    DI EQA Online Assessment
                  </Typography>
                  <Typography variant="caption">ระบบประเมินความรู้ออนไลน์</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="caption"
                    sx={{ textTransform: "uppercase", letterSpacing: "0.18em", fontSize: 10 }}
                  >
                    ออกให้เมื่อ
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {dateStr}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>
    </>
  );
}
