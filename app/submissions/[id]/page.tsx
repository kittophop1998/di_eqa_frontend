"use client";

import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { PaperCard, PaperSkeleton, SectionHeading, Eyebrow } from "@/components/ui";
import {
  accent,
  paper,
  fadeUp,
  hexToRgba,
  chevronCut,
  monoSx,
  tessellation,
  foldShadow,
} from "@/lib/design";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
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
import SummarizeOutlinedIcon from "@mui/icons-material/SummarizeOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";

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
      <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
        <Header />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert severity="error">{err}</Alert>
        </Container>
      </Box>
    );
  }
  if (!sub) {
    return (
      <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
        <Header />
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Stack spacing={2}>
            <PaperSkeleton height={220} />
            <PaperSkeleton height={260} sx={{ mt: 2 }} />
          </Stack>
        </Container>
      </Box>
    );
  }

  const sessionId = sub.sessionId || sessionFromUrl;
  const filteredAnswers = showWrongOnly ? sub.answers.filter((a) => !a.isCorrect) : sub.answers;
  const wrongCount = sub.answers.filter((a) => !a.isCorrect).length;
  const accentTone = sub.passed ? accent.sage : accent.coral;

  return (
    <>
      <Box
        sx={{
          minHeight: "100dvh",
          bgcolor: "background.default",
          "@media print": { display: "none" },
        }}
      >
        <Header />
        <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
          {/* ─── Score panel ─── */}
          <PaperCard cut={32} sx={{ overflow: "hidden", p: 0, ...fadeUp() }}>
            <Box
              sx={{
                position: "relative",
                p: { xs: 3, md: 4.5 },
                bgcolor: paper.ink,
                color: paper.white,
                overflow: "hidden",
              }}
            >
              <Box aria-hidden sx={{ position: "absolute", inset: 0, ...tessellation(paper.white, 0.035, 80) }} />
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: { xs: 140, md: 220 },
                  height: { xs: 140, md: 220 },
                  bgcolor: hexToRgba(accentTone, 0.22),
                  clipPath: "polygon(100% 0, 100% 100%, 0 0)",
                }}
              />

              <Box sx={{ position: "relative" }}>
                <Eyebrow onDark>ผลคะแนนของคุณ</Eyebrow>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ mt: 2, alignItems: "flex-end", flexWrap: "wrap", rowGap: 1 }}
                >
                  <Typography
                    sx={{
                      ...monoSx,
                      fontWeight: 700,
                      lineHeight: 0.9,
                      letterSpacing: "-0.04em",
                      fontSize: { xs: "3.5rem", md: "5rem" },
                      color: sub.passed ? accent.sage : accent.coral,
                    }}
                  >
                    {sub.percent}%
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ pb: 0.75, fontWeight: 500, color: hexToRgba(paper.white, 0.78) }}
                  >
                    ({sub.correct} / {sub.total} เซลล์ถูก)
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mt: 2.5, flexWrap: "wrap", rowGap: 1 }}>
                  <ResultTag tone="solid">{grade.label}</ResultTag>
                  <ResultTag>เกณฑ์ผ่าน {sub.passPercent}%</ResultTag>
                  <ResultTag icon={<AccessTimeOutlinedIcon sx={{ fontSize: 14 }} />}>
                    ใช้เวลา {Math.floor(sub.durationSec / 60)}:
                    {(sub.durationSec % 60).toString().padStart(2, "0")} นาที
                  </ResultTag>
                  {sub.passed && sub.certificateId && (
                    <ResultTag tone="gold" icon={<EmojiEventsOutlinedIcon sx={{ fontSize: 14 }} />}>
                      ใบประกาศ #{sub.certificateId}
                    </ResultTag>
                  )}
                </Stack>
              </Box>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                p: 2.5,
                alignItems: { xs: "flex-start", sm: "center" },
                justifyContent: "space-between",
              }}
            >
              <Typography variant="caption" color="text.secondary">
                ส่งเมื่อ{" "}
                <Box component="span" sx={monoSx}>
                  {new Date(sub.submittedAt).toLocaleString("th-TH")}
                </Box>
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", rowGap: 1.5 }}>
                {sub.passed && (
                  <Button
                    onClick={() => setShowCert(true)}
                    variant="contained"
                    color="primary"
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
                    startIcon={<LeaderboardOutlinedIcon />}
                  >
                    ดูกระดานคะแนนสด
                  </Button>
                )}
                <Button
                  component={NextLink}
                  href="/dashboard"
                  variant="outlined"
                  startIcon={<DashboardOutlinedIcon />}
                >
                  กลับหน้าหลัก
                </Button>
              </Stack>
            </Stack>
          </PaperCard>

          {/* ─── Per-category summary ─── */}
          <Box sx={{ mt: 6 }}>
            <SectionHeading icon={<SummarizeOutlinedIcon />} title="สรุปการนับแต่ละชนิด" />
            <PaperCard>
              <TableContainer sx={{ overflowX: "auto" }}>
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
                      const tone =
                        pct >= 80 ? accent.sageDeep : pct >= 60 ? accent.warmDeep : "#C2453D";
                      return (
                        <TableRow key={c.key} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                              <Box
                                aria-hidden
                                sx={{
                                  width: 12,
                                  height: 12,
                                  bgcolor: c.color,
                                  transform: "rotate(45deg)",
                                  flexShrink: 0,
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {c.label}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={monoSx}>
                            {c.userCount}
                          </TableCell>
                          <TableCell align="right" sx={{ ...monoSx, color: "text.secondary" }}>
                            {c.trueCount}
                          </TableCell>
                          <TableCell align="right" sx={{ ...monoSx, fontWeight: 700, color: accent.sageDeep }}>
                            {c.correct}
                          </TableCell>
                          <TableCell align="right">
                            <Box
                              component="span"
                              sx={{
                                display: "inline-block",
                                px: 1.25,
                                py: 0.35,
                                ...monoSx,
                                fontWeight: 700,
                                fontSize: "0.8125rem",
                                clipPath: chevronCut(6),
                                bgcolor: hexToRgba(tone, 0.14),
                                color: tone,
                              }}
                            >
                              {pct}%
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </PaperCard>
          </Box>

          {/* ─── Per-cell answer key ─── */}
          <Box sx={{ mt: 6 }}>
            <SectionHeading
              icon={<FactCheckOutlinedIcon />}
              title="เฉลยรายเซลล์"
              action={
                <FormControlLabel
                  control={
                    <Switch
                      checked={showWrongOnly}
                      onChange={(e) => setShowWrongOnly(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2">แสดงเฉพาะที่ตอบผิด ({wrongCount} ใบ)</Typography>
                  }
                />
              }
            />

            {filteredAnswers.length === 0 ? (
              <PaperCard sx={{ p: 5 }}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{ alignItems: "center", justifyContent: "center", color: accent.sageDeep }}
                >
                  <CelebrationOutlinedIcon />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    ตอบถูกทุกเซลล์!
                  </Typography>
                </Stack>
              </PaperCard>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
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
                    <PaperCard
                      key={a.cellId}
                      edge={a.isCorrect ? accent.sageDeep : "#C2453D"}
                      sx={{ overflow: "hidden" }}
                    >
                      <Box sx={{ aspectRatio: "1 / 1", bgcolor: paper.white }}>
                        <Box
                          component="img"
                          src={a.imageUrl}
                          alt={a.cellId}
                          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      </Box>
                      <Box sx={{ p: 1.25 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          คุณตอบ:{" "}
                          <Box
                            component="span"
                            sx={{ fontWeight: 700, color: assigned?.color || paper.fold }}
                          >
                            {assigned?.label || "ไม่ได้ตอบ"}
                          </Box>
                        </Typography>
                        {!a.isCorrect && (
                          <Typography variant="caption" sx={{ display: "block", mt: 0.35 }}>
                            <Box component="span" sx={{ color: "text.secondary" }}>
                              เฉลย:{" "}
                            </Box>
                            <Box
                              component="span"
                              sx={{ fontWeight: 700, color: correct?.color || accent.sageDeep }}
                            >
                              {correct?.label}
                            </Box>
                          </Typography>
                        )}
                      </Box>
                    </PaperCard>
                  );
                })}
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      {showCert && sub.passed && <CertificateOverlay sub={sub} onClose={() => setShowCert(false)} />}
    </>
  );
}

// ─── Tag used in the ink score panel ────────────────────────────────────────
function ResultTag({
  children,
  icon,
  tone = "ghost",
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "ghost" | "solid" | "gold";
}) {
  const styles = {
    ghost: { bgcolor: hexToRgba(paper.white, 0.1), color: hexToRgba(paper.white, 0.92) },
    solid: { bgcolor: paper.white, color: paper.ink },
    gold: { bgcolor: accent.warm, color: paper.ink },
  }[tone];

  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{
        px: 1.5,
        py: 0.6,
        alignItems: "center",
        clipPath: chevronCut(8),
        fontSize: "0.8125rem",
        fontWeight: 600,
        ...styles,
      }}
    >
      {icon}
      <Box component="span">{children}</Box>
    </Stack>
  );
}

// ─── Certificate ────────────────────────────────────────────────────────────
function CertificateOverlay({ sub, onClose }: { sub: Submission; onClose: () => void }) {
  const dateStr = new Date(sub.submittedAt).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Toolbar sits above the sheet — the sheet covers the whole viewport. */}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 400,
          "@media print": { display: "none" },
        }}
      >
        <Button onClick={() => window.print()} variant="contained" color="primary" startIcon={<PrintOutlinedIcon />}>
          พิมพ์ใบประกาศ
        </Button>
        <Button onClick={onClose} variant="contained" color="secondary" startIcon={<CloseOutlinedIcon />}>
          ปิด
        </Button>
      </Stack>

      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          overflow: "auto",
          bgcolor: paper.sheet,
          p: { xs: 2, md: 3 },
          pt: { xs: 9, md: 10 },
          "@media print": { position: "static", p: 0 },
        }}
      >
        <Box
          className="cert-sheet"
          sx={{
            position: "relative",
            mx: "auto",
            my: 3,
            width: "100%",
            maxWidth: "58rem",
            aspectRatio: "1.414 / 1",
            bgcolor: paper.sheet,
            border: `2px solid ${paper.ink}`,
            outline: `10px solid ${accent.warm}`,
            outlineOffset: -18,
            boxShadow: foldShadow.overlay,
            overflow: "hidden",
            "@media print": { my: 0, maxWidth: "none", boxShadow: "none" },
          }}
        >
          {/* Folded corner facets */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 120,
              height: 120,
              bgcolor: hexToRgba(accent.warm, 0.35),
              clipPath: "polygon(0 0, 100% 0, 0 100%)",
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 120,
              height: 120,
              bgcolor: hexToRgba(accent.coral, 0.18),
              clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
            }}
          />

          <Stack
            sx={{
              position: "relative",
              height: "100%",
              px: { xs: 4, md: 7 },
              py: { xs: 4, md: 5.5 },
              alignItems: "center",
              justifyContent: "space-between",
              textAlign: "center",
            }}
          >
            <Box>
              <Typography
                variant="overline"
                sx={{ color: accent.warmDeep, letterSpacing: "0.4em", fontWeight: 700 }}
              >
                Certificate of Achievement
              </Typography>
              <Typography variant="h2" sx={{ mt: 1, fontSize: { xs: "1.875rem", sm: "2.25rem" } }}>
                ใบประกาศนียบัตร
              </Typography>
              <Box aria-hidden sx={{ mx: "auto", mt: 1.5, height: 4, width: 120, bgcolor: accent.coral }} />
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                ขอมอบใบประกาศนียบัตรฉบับนี้ให้กับ
              </Typography>
              <Typography variant="h2" sx={{ mt: 1.5, fontSize: { xs: "1.875rem", sm: "2.25rem" } }}>
                {sub.fullName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                @{sub.username} · {sub.hospitalName}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
                ได้ผ่านการประเมินความรู้
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, px: 3 }}>
                &ldquo;{sub.quizTitle}&rdquo;
              </Typography>

              <Box
                sx={{
                  mt: 3,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  borderTop: `1px solid ${paper.crease}`,
                  borderBottom: `1px solid ${paper.crease}`,
                }}
              >
                <CertStat label="คะแนน" value={`${sub.correct} / ${sub.total}`} tone={accent.sageDeep} />
                <CertStat label="เปอร์เซ็นต์" value={`${sub.percent}%`} tone={accent.sageDeep} divider />
                <CertStat label="เกณฑ์ผ่าน" value={`${sub.passPercent}%`} tone={paper.ink} divider />
              </Box>
            </Box>

            <Stack
              direction="row"
              sx={{
                width: "100%",
                alignItems: "flex-end",
                justifyContent: "space-between",
                color: "text.secondary",
              }}
            >
              <Box sx={{ textAlign: "left" }}>
                <Typography variant="caption" sx={{ letterSpacing: "0.18em", fontSize: 10, textTransform: "uppercase" }}>
                  Certificate ID
                </Typography>
                <Typography variant="body2" sx={{ ...monoSx, fontWeight: 700, color: "text.primary" }}>
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
                <Typography variant="caption" sx={{ letterSpacing: "0.18em", fontSize: 10, textTransform: "uppercase" }}>
                  ออกให้เมื่อ
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {dateStr}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </>
  );
}

function CertStat({
  label,
  value,
  tone,
  divider,
}: {
  label: string;
  value: string;
  tone: string;
  divider?: boolean;
}) {
  return (
    <Box sx={{ py: 2, px: 1, borderLeft: divider ? `1px solid ${paper.crease}` : "none" }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
      >
        {label}
      </Typography>
      <Typography variant="h4" sx={{ ...monoSx, fontWeight: 700, color: tone }}>
        {value}
      </Typography>
    </Box>
  );
}
