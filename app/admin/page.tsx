"use client";

import NextLink from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Alert from "@mui/material/Alert";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Radio from "@mui/material/Radio";
import CircularProgress from "@mui/material/CircularProgress";

import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";

type QuizListItem = {
  id: string;
  title: string;
  category: string;
  cellCount: number;
  passPercent: number;
  durationSec: number;
};
type Session = {
  id: string;
  code: string;
  quizId: string;
  hospitalId: string;
  status: string;
  startedAt?: string;
  createdAt: string;
};
type Hospital = {
  id: string;
  code: string;
  name: string;
  province: string;
};

function HospitalPickerDialog({
  open,
  hospitals,
  quizTitle,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  hospitals: Hospital[];
  quizTitle: string;
  onConfirm: (hospital: Hospital) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Hospital | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelected(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  const filtered = hospitals.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.code.toLowerCase().includes(search.toLowerCase()) ||
      (h.province ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          เลือกโรงพยาบาล
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          สร้างเซสชัน <Box component="strong" sx={{ color: "text.primary" }}>{quizTitle}</Box> สำหรับโรงพยาบาลใด?
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          size="small"
          placeholder="ค้นหาชื่อ / รหัส รพ. / จังหวัด..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box
          sx={{
            mt: 2,
            maxHeight: 320,
            overflowY: "auto",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
          }}
        >
          {filtered.length === 0 ? (
            <Box sx={{ p: 3, textAlign: "center", color: "text.disabled" }}>
              <Typography variant="body2">ไม่พบโรงพยาบาล</Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {filtered.map((h) => {
                const isSelected = selected?.id === h.id;
                return (
                  <ListItemButton key={h.id} selected={isSelected} onClick={() => setSelected(h)}>
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Radio checked={isSelected} size="small" />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {h.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.disabled">
                          {h.code}
                          {h.province ? ` · ${h.province}` : ""}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCancel} disabled={loading} variant="outlined" color="secondary">
          ยกเลิก
        </Button>
        <Button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected || loading}
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <AddCircleOutlineIcon />}
        >
          {loading ? "กำลังสร้าง..." : "สร้างเซสชัน"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [pendingQuiz, setPendingQuiz] = useState<QuizListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  const refresh = async () => {
    const [q, s, h] = await Promise.all([
      api<QuizListItem[]>("/api/quizzes"),
      api<Session[]>("/api/sessions/active"),
      api<Hospital[]>("/api/hospitals"),
    ]);
    setQuizzes(q || []);
    setSessions(s || []);
    setHospitals(h || []);
  };

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
    refresh().catch((e) => setErr(e.message));
  }, [router]);

  const handleCreateClick = (quiz: QuizListItem) => {
    setErr("");
    setPendingQuiz(quiz);
  };

  const handleConfirmCreate = async (hospital: Hospital) => {
    if (!pendingQuiz) return;
    setCreating(true);
    setErr("");
    try {
      const s = await api<Session>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ quizId: pendingQuiz.id, hospitalCode: hospital.code }),
      });
      router.push(`/admin/session/${s.id}`);
    } catch (e: any) {
      setErr(e.message || "สร้างเซสชันไม่สำเร็จ");
    } finally {
      setCreating(false);
      setPendingQuiz(null);
    }
  };

  const hospName = (id: string) => hospitals.find((h) => h.id === id)?.name ?? id;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Header />

      <HospitalPickerDialog
        open={Boolean(pendingQuiz)}
        hospitals={hospitals}
        quizTitle={pendingQuiz?.title || ""}
        loading={creating}
        onConfirm={handleConfirmCreate}
        onCancel={() => setPendingQuiz(null)}
      />

      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Box sx={{ mb: { xs: 3, md: 5 } }}>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>
            สำหรับวิทยากร
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, mt: 0.5 }}>
            แผงควบคุมวิทยากร
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            สร้างเซสชันสด เปิดข้อสอบให้ผู้เข้าอบรมพร้อมกัน และดูกระดานคะแนนแบบเรียลไทม์
          </Typography>
        </Box>

        {err && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {err}
          </Alert>
        )}

        <Box sx={{ mb: 5 }}>
          <SectionHeading icon={<QuizOutlinedIcon />} title="เลือกข้อสอบเพื่อสร้างเซสชัน" />
          <Grid container spacing={2}>
            {quizzes.map((q) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={q.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Chip size="small" label={q.category} color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 1.5 }}>
                      {q.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      {q.cellCount} เซลล์ · {Math.floor(q.durationSec / 60)} นาที · ผ่าน{" "}
                      {q.passPercent || 80}%
                    </Typography>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<LocalHospitalOutlinedIcon />}
                      onClick={() => handleCreateClick(q)}
                      sx={{ mt: 2 }}
                    >
                      เลือก รพ. และสร้างเซสชัน
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box>
          <SectionHeading icon={<LiveTvOutlinedIcon />} title="เซสชันที่กำลังเปิดอยู่" accent="success" />
          {sessions.length === 0 ? (
            <Card variant="outlined">
              <Box sx={{ p: 6, textAlign: "center", color: "text.secondary" }}>
                <Typography>ยังไม่มีเซสชันที่เปิดอยู่</Typography>
              </Box>
            </Card>
          ) : (
            <Card variant="outlined">
              <Stack divider={<Divider />}>
                {sessions.map((s) => (
                  <Stack
                    key={s.id}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{
                      p: 2.5,
                      alignItems: { xs: "flex-start", sm: "center" },
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        รหัสเซสชัน
                      </Typography>
                      <Typography variant="h6" sx={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}>
                        {s.code}
                      </Typography>
                    </Box>
                    {s.hospitalId && (
                      <Stack direction="row" spacing={1} sx={{ color: "text.secondary", alignItems: "center" }}>
                        <LocalHospitalOutlinedIcon fontSize="small" />
                        <Typography variant="body2">{hospName(s.hospitalId)}</Typography>
                      </Stack>
                    )}
                    <Chip
                      size="small"
                      icon={<FiberManualRecordIcon sx={{ fontSize: 10 }} />}
                      label={s.status === "running" ? "กำลังเปิด" : "รอเริ่ม"}
                      color={s.status === "running" ? "success" : "warning"}
                      sx={{ fontWeight: 600 }}
                    />
                    <Button
                      component={NextLink}
                      href={`/admin/session/${s.id}`}
                      variant="outlined"
                      size="small"
                      endIcon={<ArrowForwardOutlinedIcon />}
                    >
                      จัดการ
                    </Button>
                  </Stack>
                ))}
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
