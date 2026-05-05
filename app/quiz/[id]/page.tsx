"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";

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
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Header />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Alert severity="error">{err}</Alert>
        </Container>
      </Box>
    );
  }
  if (!quiz) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Header />
        <Container maxWidth="md" sx={{ py: 8, color: "text.secondary" }}>
          <Typography>กำลังโหลดข้อสอบ...</Typography>
        </Container>
      </Box>
    );
  }

  const progressPct = totalCells > 0 ? (assignedCount / totalCells) * 100 : 0;
  const lowTime = secondsLeft < 60;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Header />

      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="xl" sx={{ py: 1.5 }}>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: 1 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: "0.08em" }}>
                {quiz.category}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {quiz.title}
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary">
                จำแนกแล้ว{" "}
                <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                  {assignedCount}
                </Box>{" "}
                / {totalCells}
              </Typography>
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  alignItems: "center",
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1.5,
                  fontFamily: "monospace",
                  fontWeight: 700,
                  bgcolor: lowTime ? "rgba(220,38,38,0.1)" : "rgba(15,23,42,0.06)",
                  color: lowTime ? "error.dark" : "text.primary",
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
          sx={{ height: 4, "& .MuiLinearProgress-bar": { transition: "transform 0.4s ease" } }}
        />
      </Box>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Alert
          icon={
            selectedCell ? <CheckCircleOutlineIcon /> : selectedCategory ? <LightbulbOutlinedIcon /> : <LightbulbOutlinedIcon />
          }
          severity={selectedCell ? "info" : selectedCategory ? "warning" : "info"}
          variant="outlined"
          sx={{
            mb: 3,
            bgcolor: selectedCell
              ? "rgba(30,58,138,0.04)"
              : selectedCategory
                ? "rgba(180,83,9,0.04)"
                : "background.paper",
          }}
          action={
            (selectedCell || selectedCategory) && (
              <Button
                size="small"
                color="inherit"
                onClick={() => {
                  setSelectedCell("");
                  setSelectedCategory("");
                }}
                startIcon={<CloseOutlinedIcon fontSize="small" />}
              >
                ยกเลิก
              </Button>
            )
          }
        >
          {selectedCell ? (
            <Typography variant="body2">
              เลือกเซลล์แล้ว — กดที่ <Box component="strong">ชนิดเซลล์ฝั่งขวา</Box> เพื่อจำแนกเข้าหมวด
            </Typography>
          ) : selectedCategory ? (
            <Typography variant="body2">
              ตั้งชนิดปลายทาง <Box component="strong">{quiz.categories.find((c) => c.key === selectedCategory)?.label}</Box>{" "}
              ไว้แล้ว — จิ้มเซลล์ที่ต้องการแปะได้เลย
            </Typography>
          ) : (
            <Typography variant="body2">
              วิธีทำ: <Box component="strong">1)</Box> จิ้มที่รูปเซลล์ฝั่งซ้าย <Box component="strong">2)</Box>{" "}
              จิ้มที่ชนิดเซลล์ฝั่งขวา → เซลล์จะวาร์ปทันที · จิ้มเซลล์ที่จำแนกไปแล้วเพื่อเอากลับมาแก้ไข
            </Typography>
          )}
        </Alert>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card variant="outlined" sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                sx={{ mb: 2, alignItems: "center", justifyContent: "space-between" }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  เซลล์ที่ยังไม่ได้จำแนก
                </Typography>
                <Chip label={`เหลือ ${remaining} ใบ`} size="small" />
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
                          onClick={() => onCellTap(cell.id)}
                          aria-label={`เซลล์ ${cell.id}`}
                          sx={{
                            position: "relative",
                            aspectRatio: "1 / 1",
                            overflow: "hidden",
                            borderRadius: 1.5,
                            border: "2px solid",
                            borderColor: isSelected ? "primary.main" : "divider",
                            boxShadow: isSelected ? "0 0 0 4px rgba(30,58,138,0.15)" : "none",
                            transform: isSelected ? "scale(1.04)" : "none",
                            transition: "all 0.18s ease",
                            cursor: "pointer",
                            background: "white",
                            p: 0,
                            "&:hover": {
                              borderColor: isSelected ? "primary.main" : "primary.light",
                              boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
                            },
                          }}
                        >
                          <Box
                            component="img"
                            src={cell.imageUrl}
                            alt={cell.id}
                            draggable={false}
                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          {isSelected && (
                            <Box
                              sx={{
                                position: "absolute",
                                left: 4,
                                right: 4,
                                bottom: 4,
                                px: 0.5,
                                py: 0.25,
                                borderRadius: 0.75,
                                bgcolor: "primary.main",
                                color: "common.white",
                                fontSize: 10,
                                fontWeight: 700,
                                textAlign: "center",
                              }}
                            >
                              เลือกอยู่ ✓
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                </Box>
              )}

              {assignedCount > 0 && (
                <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
                  <Stack
                    direction="row"
                    sx={{ mb: 1.5, alignItems: "center", justifyContent: "space-between" }}
                  >
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
                          onClick={() => onCellTap(cell.id)}
                          title={`${cell.id} → ${cat?.label}`}
                          sx={{
                            position: "relative",
                            aspectRatio: "1 / 1",
                            overflow: "hidden",
                            borderRadius: 1,
                            border: "1px solid",
                            borderColor: "divider",
                            opacity: 0.75,
                            cursor: "pointer",
                            p: 0,
                            transition: "opacity 0.15s ease",
                            "&:hover": { opacity: 1 },
                          }}
                        >
                          <Box
                            component="img"
                            src={cell.imageUrl}
                            alt={cell.id}
                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
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
                              color: "common.white",
                              textAlign: "center",
                              backgroundColor: cat?.color || "#475569",
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
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2}>
              <Card variant="outlined" sx={{ p: 2.5 }}>
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
                        onClick={() => onCategoryTap(cat.key)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          px: 2,
                          py: 1.5,
                          borderRadius: 1.5,
                          border: "2px solid",
                          borderColor: isSelected
                            ? "warning.main"
                            : isPrimed
                              ? "primary.light"
                              : "divider",
                          bgcolor: isSelected
                            ? "rgba(245,158,11,0.08)"
                            : "background.paper",
                          boxShadow: isSelected ? "0 0 0 3px rgba(245,158,11,0.18)" : "none",
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          "&:hover": {
                            borderColor: isSelected
                              ? "warning.main"
                              : isPrimed
                                ? "primary.main"
                                : "secondary.light",
                            bgcolor: isSelected
                              ? "rgba(245,158,11,0.1)"
                              : isPrimed
                                ? "rgba(30,58,138,0.04)"
                                : "background.paper",
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              bgcolor: cat.color,
                            }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {cat.label}
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            px: 1.25,
                            py: 0.5,
                            borderRadius: 1,
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.875rem",
                            color: "common.white",
                            bgcolor: cat.color,
                          }}
                        >
                          {counts[cat.key] || 0}
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
                <Box
                  sx={{
                    mt: 2.5,
                    px: 2,
                    py: 1.25,
                    borderRadius: 1.5,
                    bgcolor: "background.default",
                  }}
                >
                  <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="body2" color="text.secondary">
                      รวมที่จำแนกแล้ว
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                      {assignedCount} / {totalCells}
                    </Typography>
                  </Stack>
                </Box>
              </Card>

              <Card variant="outlined" sx={{ p: 2.5 }}>
                {confirmEarly && remaining > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    ยังเหลืออีก {remaining} เซลล์ที่ไม่ได้จำแนก จะถูกนับเป็นไม่ถูก — กด "ส่งคำตอบ" อีกครั้งเพื่อยืนยัน
                  </Alert>
                )}
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  color="success"
                  endIcon={<SendOutlinedIcon />}
                  onClick={() => submit()}
                  disabled={submitting}
                  sx={{ py: 1.5, fontSize: "1rem" }}
                >
                  {submitting ? "กำลังส่ง..." : "ส่งคำตอบ"}
                </Button>
                {err && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {err}
                  </Alert>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
                  ผ่านเกณฑ์ที่ {quiz.passPercent}% — ถ้าผ่านจะได้รับใบประกาศนียบัตรหลังส่งคำตอบ
                </Typography>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
