"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";
import { PaperCard, PaperSkeleton } from "@/components/ui";
import {
  accent,
  paper,
  hexToRgba,
  chevronCut,
  monoSx,
  foldShadow,
  easing,
  duration,
} from "@/lib/design";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";

import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";

type Cell = { id: string; imageUrl: string };
type Category = { key: string; label: string; color: string };
type Quiz = {
  id: string;
  title: string;
  description: string;
  category: string;
  passPercent: number;
  durationSec: number;
  categories: Category[];
  cells: Cell[];
};

export default function QuizPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const sessionId = search.get("session") || "";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selectedCell, setSelectedCell] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmEarly, setConfirmEarly] = useState(false);
  const [err, setErr] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!auth.isAuthed()) {
      router.replace("/");
      return;
    }
    api<Quiz>(`/api/quizzes/${params.id}${sessionId ? `?session=${sessionId}` : ""}`)
      .then((q) => {
        setQuiz(q);
        setSecondsLeft(q.durationSec);
        startedAt.current = Date.now();
      })
      .catch((e) => setErr(e.message));
  }, [params.id, router, sessionId]);

  useEffect(() => {
    if (!quiz) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          submit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz]);

  const totalCells = quiz?.cells.length || 0;
  const assignedCount = Object.keys(assignments).length;
  const remaining = totalCells - assignedCount;

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    if (!quiz) return m;
    for (const cat of quiz.categories) m[cat.key] = 0;
    for (const k of Object.values(assignments)) m[k] = (m[k] || 0) + 1;
    return m;
  }, [assignments, quiz]);

  useEffect(() => {
    if (!selectedCell || !selectedCategory) return;
    setAssignments((a) => ({ ...a, [selectedCell]: selectedCategory }));
    setSelectedCell("");
    setSelectedCategory("");
  }, [selectedCell, selectedCategory]);

  const onCellTap = (cellId: string) => {
    if (assignments[cellId]) {
      setAssignments((a) => {
        const next = { ...a };
        delete next[cellId];
        return next;
      });
      setSelectedCell("");
      return;
    }
    setSelectedCell((curr) => (curr === cellId ? "" : cellId));
  };

  const onCategoryTap = (key: string) => {
    if (!selectedCell) {
      setSelectedCategory((curr) => (curr === key ? "" : key));
      return;
    }
    setSelectedCategory(key);
  };

  const submit = async (force = false) => {
    if (!quiz || submitting) return;
    if (!force && remaining > 0 && !confirmEarly) {
      setConfirmEarly(true);
      return;
    }
    setSubmitting(true);
    setErr("");
    const dur = Math.round((Date.now() - startedAt.current) / 1000);
    try {
      const sub = await api<{ id: string }>(`/api/quizzes/${quiz.id}/submit`, {
        method: "POST",
        body: JSON.stringify({
          sessionId: sessionId || undefined,
          durationSec: dur,
          assignments,
        }),
      });
      router.replace(`/submissions/${sub.id}${sessionId ? `?session=${sessionId}` : ""}`);
    } catch (e: any) {
      setErr(e.message || "ส่งคำตอบไม่สำเร็จ");
      setSubmitting(false);
    }
  };

  const timeStr = useMemo(() => {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const s = (secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [secondsLeft]);

  if (err && !quiz) {
    return (
      <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
        <Header />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert severity="error">{err}</Alert>
        </Container>
      </Box>
    );
  }
  if (!quiz) {
    return (
      <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
        <Header />
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Stack spacing={2}>
            <PaperSkeleton height={28} width="40%" />
            <PaperSkeleton height={14} width="65%" />
            <PaperSkeleton height={420} sx={{ mt: 2 }} />
          </Stack>
        </Container>
      </Box>
    );
  }

  const progressPct = totalCells > 0 ? (assignedCount / totalCells) * 100 : 0;
  const lowTime = secondsLeft < 60;

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <Header />

      {/* ─── Sticky progress rail, docked under the nav ─── */}
      <Box
        sx={{
          position: "sticky",
          top: { xs: 64, sm: 72 },
          zIndex: 90,
          bgcolor: hexToRgba(paper.sheet, 0.95),
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${paper.crease}`,
        }}
      >
        <Container maxWidth="xl" sx={{ py: 1.5 }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: 1 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                {quiz.category}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
                {quiz.title}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                จำแนกแล้ว{" "}
                <Box component="span" sx={{ ...monoSx, fontWeight: 700, color: "text.primary" }}>
                  {assignedCount}
                </Box>
                <Box component="span" sx={monoSx}>
                  {" "}
                  / {totalCells}
                </Box>
              </Typography>
              <Stack
                direction="row"
                spacing={0.75}
                sx={{
                  alignItems: "center",
                  px: 1.75,
                  py: 0.85,
                  ...monoSx,
                  fontWeight: 700,
                  clipPath: chevronCut(9),
                  bgcolor: lowTime ? hexToRgba("#C2453D", 0.12) : hexToRgba(paper.ink, 0.06),
                  color: lowTime ? "#8E2E27" : paper.ink,
                }}
              >
                <AccessTimeOutlinedIcon sx={{ fontSize: 18 }} />
                <Box component="span">{timeStr}</Box>
              </Stack>
            </Stack>
          </Stack>
        </Container>
        <LinearProgress
          variant="determinate"
          value={progressPct}
          sx={{ height: 4, "& .MuiLinearProgress-bar": { transition: `transform 400ms ${easing}` } }}
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* ─── Instruction strip ─── */}
        <Box
          sx={{
            mb: 3,
            px: 2.5,
            py: 1.75,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
            border: `1px solid ${paper.crease}`,
            borderLeft: `3px solid ${selectedCell ? accent.coral : selectedCategory ? accent.warmDeep : accent.skyDeep}`,
            bgcolor: selectedCell
              ? hexToRgba(accent.coral, 0.06)
              : selectedCategory
                ? hexToRgba(accent.warm, 0.14)
                : paper.sheet,
            transition: `background-color ${duration.hover}ms ${easing}`,
          }}
        >
          <Box sx={{ color: selectedCell ? accent.coralInk : paper.steel, display: "flex" }}>
            {selectedCell ? <CheckCircleOutlineIcon /> : <LightbulbOutlinedIcon />}
          </Box>
          {/* minWidth 0 keeps the icon and copy on one line; Thai has no word
              breaks, so min-content would otherwise force a wrap on mobile. */}
          <Box sx={{ flexGrow: 1, minWidth: 0, wordBreak: "break-word" }}>
            {selectedCell ? (
              <Typography variant="body2">
                เลือกเซลล์แล้ว — กดที่ <Box component="strong">ชนิดเซลล์ฝั่งขวา</Box> เพื่อจำแนกเข้าหมวด
              </Typography>
            ) : selectedCategory ? (
              <Typography variant="body2">
                ตั้งชนิดปลายทาง{" "}
                <Box component="strong">
                  {quiz.categories.find((c) => c.key === selectedCategory)?.label}
                </Box>{" "}
                ไว้แล้ว — จิ้มเซลล์ที่ต้องการแปะได้เลย
              </Typography>
            ) : (
              <Typography variant="body2">
                วิธีทำ: <Box component="strong">1)</Box> จิ้มที่รูปเซลล์ฝั่งซ้าย{" "}
                <Box component="strong">2)</Box> จิ้มที่ชนิดเซลล์ฝั่งขวา → เซลล์จะวาร์ปทันที ·
                จิ้มเซลล์ที่จำแนกไปแล้วเพื่อเอากลับมาแก้ไข
              </Typography>
            )}
          </Box>
          {(selectedCell || selectedCategory) && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSelectedCell("");
                setSelectedCategory("");
              }}
              startIcon={<CloseOutlinedIcon fontSize="small" />}
            >
              ยกเลิก
            </Button>
          )}
        </Box>

        <Grid container spacing={2.5}>
          {/* ─── Cell tray ─── */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <PaperCard sx={{ p: 2.5 }}>
              <Stack direction="row" sx={{ mb: 2, alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  เซลล์ที่ยังไม่ได้จำแนก
                </Typography>
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.4,
                    clipPath: chevronCut(7),
                    bgcolor: hexToRgba(paper.ink, 0.06),
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                  }}
                >
                  เหลือ{" "}
                  <Box component="span" sx={monoSx}>
                    {remaining}
                  </Box>{" "}
                  ใบ
                </Box>
              </Stack>

              {remaining === 0 ? (
                <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
                  จำแนกครบทุกเซลล์แล้ว — กด <Box component="strong">ส่งคำตอบ</Box> ฝั่งขวาได้เลย
                </Alert>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: {
                      xs: "repeat(4, 1fr)",
                      sm: "repeat(6, 1fr)",
                      md: "repeat(8, 1fr)",
                      lg: "repeat(9, 1fr)",
                    },
                  }}
                >
                  {quiz.cells
                    .filter((cell) => !assignments[cell.id])
                    .map((cell) => {
                      const isSelected = selectedCell === cell.id;
                      return (
                        <Box
                          key={cell.id}
                          component="button"
                          type="button"
                          onClick={() => onCellTap(cell.id)}
                          aria-label={`เซลล์ ${cell.id}`}
                          aria-pressed={isSelected}
                          sx={{
                            position: "relative",
                            aspectRatio: "1 / 1",
                            overflow: "hidden",
                            p: 0,
                            cursor: "pointer",
                            background: paper.sheet,
                            border: `2px solid ${isSelected ? accent.coral : paper.crease}`,
                            boxShadow: isSelected ? foldShadow.accent : "none",
                            transform: isSelected ? "translateY(-3px)" : "none",
                            transition: `transform ${duration.hover}ms ${easing}, box-shadow ${duration.hover}ms ${easing}, border-color ${duration.hover}ms ${easing}`,
                            "&:hover": {
                              borderColor: accent.coral,
                              transform: "translateY(-3px)",
                              boxShadow: foldShadow.lift,
                            },
                          }}
                        >
                          <Box
                            component="img"
                            src={cell.imageUrl}
                            alt={cell.id}
                            draggable={false}
                            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                          {isSelected && (
                            <Box
                              sx={{
                                position: "absolute",
                                left: 0,
                                right: 0,
                                bottom: 0,
                                py: 0.25,
                                bgcolor: accent.coral,
                                color: paper.ink,
                                fontSize: 10,
                                fontWeight: 700,
                                textAlign: "center",
                              }}
                            >
                              เลือกอยู่
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                </Box>
              )}

              {assignedCount > 0 && (
                <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px solid ${paper.crease}` }}>
                  <Stack direction="row" sx={{ mb: 1.5, alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">
                      จำแนกไปแล้ว ({assignedCount}) — กดเพื่อนำกลับมาแก้
                    </Typography>
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      startIcon={<DeleteSweepOutlinedIcon fontSize="small" />}
                      onClick={() => setAssignments({})}
                    >
                      ล้างทั้งหมด
                    </Button>
                  </Stack>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 0.75,
                      gridTemplateColumns: {
                        xs: "repeat(6, 1fr)",
                        sm: "repeat(10, 1fr)",
                        md: "repeat(12, 1fr)",
                        lg: "repeat(14, 1fr)",
                      },
                    }}
                  >
                    {quiz.cells.map((cell) => {
                      const assigned = assignments[cell.id];
                      if (!assigned) return null;
                      const cat = quiz.categories.find((c) => c.key === assigned);
                      return (
                        <Box
                          key={cell.id}
                          component="button"
                          type="button"
                          onClick={() => onCellTap(cell.id)}
                          title={`${cell.id} → ${cat?.label}`}
                          sx={{
                            position: "relative",
                            aspectRatio: "1 / 1",
                            overflow: "hidden",
                            p: 0,
                            cursor: "pointer",
                            border: `1px solid ${paper.crease}`,
                            opacity: 0.72,
                            transition: `opacity ${duration.hover}ms ${easing}`,
                            "&:hover": { opacity: 1 },
                          }}
                        >
                          <Box
                            component="img"
                            src={cell.imageUrl}
                            alt={cell.id}
                            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                          />
                          <Box
                            sx={{
                              position: "absolute",
                              left: 0,
                              right: 0,
                              bottom: 0,
                              px: 0.25,
                              py: "1px",
                              fontSize: 8,
                              fontWeight: 700,
                              color: paper.white,
                              textAlign: "center",
                              backgroundColor: cat?.color || paper.steel,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {cat?.label?.slice(0, 3)}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </PaperCard>
          </Grid>

          {/* ─── Category rail ─── */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 160 } }}>
              <PaperCard sx={{ p: 2.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  ชนิดของเซลล์ (จิ้มเพื่อแปะ)
                </Typography>
                <Stack spacing={1}>
                  {quiz.categories.map((cat) => {
                    const isSelected = selectedCategory === cat.key;
                    const isPrimed = !!selectedCell;
                    return (
                      <Box
                        key={cat.key}
                        component="button"
                        type="button"
                        onClick={() => onCategoryTap(cat.key)}
                        aria-pressed={isSelected}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          px: 2,
                          py: 1.5,
                          textAlign: "left",
                          cursor: "pointer",
                          border: `1px solid ${
                            isSelected ? accent.warmDeep : isPrimed ? accent.coral : paper.crease
                          }`,
                          borderLeft: `4px solid ${cat.color}`,
                          bgcolor: isSelected
                            ? hexToRgba(accent.warm, 0.22)
                            : isPrimed
                              ? hexToRgba(accent.coral, 0.05)
                              : paper.sheet,
                          boxShadow: isSelected ? foldShadow.lift : "none",
                          transform: isSelected ? "translateY(-2px)" : "none",
                          transition: `transform ${duration.hover}ms ${easing}, background-color ${duration.hover}ms ${easing}, box-shadow ${duration.hover}ms ${easing}, border-color ${duration.hover}ms ${easing}`,
                          "&:hover": { transform: "translateY(-2px)", boxShadow: foldShadow.rest },
                          "&:active": { transform: "translateY(1px)" },
                        }}
                      >
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                          <Box
                            aria-hidden
                            sx={{
                              width: 14,
                              height: 14,
                              bgcolor: cat.color,
                              transform: "rotate(45deg)",
                              flexShrink: 0,
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {cat.label}
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            px: 1.25,
                            py: 0.4,
                            ...monoSx,
                            fontWeight: 700,
                            fontSize: "0.875rem",
                            color: paper.white,
                            bgcolor: cat.color,
                            clipPath: chevronCut(6),
                          }}
                        >
                          {counts[cat.key] || 0}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>

                <Stack
                  direction="row"
                  sx={{
                    mt: 2.5,
                    px: 2,
                    py: 1.25,
                    alignItems: "center",
                    justifyContent: "space-between",
                    bgcolor: paper.white,
                    borderLeft: `3px solid ${paper.ink}`,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    รวมที่จำแนกแล้ว
                  </Typography>
                  <Typography variant="body2" sx={{ ...monoSx, fontWeight: 700 }}>
                    {assignedCount} / {totalCells}
                  </Typography>
                </Stack>
              </PaperCard>

              <PaperCard cut={20} sx={{ p: 2.5 }}>
                {confirmEarly && remaining > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    ยังเหลืออีก {remaining} เซลล์ที่ไม่ได้จำแนก จะถูกนับเป็นไม่ถูก — กด &ldquo;ส่งคำตอบ&rdquo;
                    อีกครั้งเพื่อยืนยัน
                  </Alert>
                )}
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  color="primary"
                  endIcon={<SendOutlinedIcon />}
                  onClick={() => submit()}
                  disabled={submitting}
                  sx={{ py: 1.6, fontSize: "1rem" }}
                >
                  {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
                </Button>
                {submitting && <Box className="paper-skeleton" sx={{ height: 3, mt: 1 }} />}
                {err && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {err}
                  </Alert>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                  ผ่านเกณฑ์ที่{" "}
                  <Box component="span" sx={{ ...monoSx, fontWeight: 700 }}>
                    {quiz.passPercent}%
                  </Box>{" "}
                  — ถ้าผ่านจะได้รับใบประกาศนียบัตรหลังส่งคำตอบ
                </Typography>
              </PaperCard>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
