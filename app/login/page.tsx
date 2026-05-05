"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { auth, type Hospital, type User } from "@/lib/auth";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";

import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

type Mode = "user" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("user");
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalId, setHospitalId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);

  useEffect(() => {
    if (auth.isAuthed()) {
      router.replace("/dashboard");
      return;
    }
    api<Hospital[]>("/api/hospitals", { auth: false })
      .then((list) => setHospitals(list || []))
      .catch(() => {})
      .finally(() => setHospitalsLoading(false));
  }, [router]);

  const selectedHospital = hospitals.find((h) => h.id === hospitalId) ?? null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "user" && !selectedHospital) {
      setErr("กรุณาเลือกโรงพยาบาล");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const body: Record<string, string | boolean> = { username, password };
      if (mode === "user" && selectedHospital) body.hospitalCode = selectedHospital.code;
      if (mode === "admin") body.isAdmin = true;
      const data = await api<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify(body),
      });
      if (selectedHospital) auth.setHospital(selectedHospital);
      auth.setSession(data.token, data.user);
      router.push(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (e: any) {
      setErr(e.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
        bgcolor: "background.default",
      }}
    >
      {/* ─────────── LEFT: Branding panel ─────────── */}
      <Box
        sx={{
          position: "relative",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          color: "common.white",
          px: { md: 6, lg: 9 },
          py: { md: 6, lg: 8 },
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #0B1B45 0%, #172554 35%, #1E3A8A 70%, #1E40AF 100%)",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.08,
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(96,165,250,0.35) 0%, rgba(96,165,250,0) 70%)",
            filter: "blur(8px)",
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            bottom: -160,
            left: -100,
            width: 420,
            height: 420,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(20,184,166,0.25) 0%, rgba(20,184,166,0) 70%)",
            filter: "blur(8px)",
          }}
        />

        <Stack direction="row" spacing={2} sx={{ position: "relative", alignItems: "center" }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 52,
              height: 52,
              bgcolor: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "0.04em",
            }}
          >
            DI
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              DI EQA
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.7)", letterSpacing: "0.06em" }}
            >
              External Quality Assessment
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={3} sx={{ position: "relative", maxWidth: 520 }}>
          <Typography
            variant="overline"
            sx={{ color: "#93C5FD", letterSpacing: "0.22em", fontWeight: 700 }}
          >
            ระบบประเมินคุณภาพทางห้องปฏิบัติการ
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              lineHeight: 1.15,
              fontSize: { md: "2.25rem", lg: "2.75rem" },
            }}
          >
            ยกระดับมาตรฐานวิชาชีพ
            <Box component="br" />
            ด้วยระบบประเมินที่
            <Box component="span" sx={{ color: "#7DD3FC" }}> เชื่อถือได้</Box>
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.7 }}>
            แพลตฟอร์มกลางสำหรับการอบรมและประเมินความรู้ของบุคลากรห้องปฏิบัติการทางการแพทย์
            ทำข้อสอบออนไลน์ ได้ผลลัพธ์ทันที พร้อมใบประกาศนียบัตรอย่างเป็นทางการ
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            sx={{ mt: 1, flexWrap: "wrap", rowGap: 2 }}
          >
            <FeaturePill icon={<ShieldOutlinedIcon fontSize="small" />} label="ปลอดภัยและมาตรฐาน" />
            <FeaturePill icon={<HubOutlinedIcon fontSize="small" />} label="ใช้งานทั่วประเทศ" />
            <FeaturePill icon={<EmojiEventsOutlinedIcon fontSize="small" />} label="ใบประกาศอย่างเป็นทางการ" />
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{ position: "relative", color: "rgba(255,255,255,0.55)", alignItems: "center" }}
        >
          <VerifiedUserOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ letterSpacing: "0.04em" }}>
            © {new Date().getFullYear()} DI EQA · All rights reserved.
          </Typography>
        </Stack>
      </Box>

      {/* ─────────── RIGHT: Form panel ─────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, sm: 6, md: 6, lg: 10 },
          py: { xs: 6, md: 8 },
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 460,
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            border: { xs: "1px solid", md: "none" },
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ display: { xs: "flex", md: "none" }, mb: 3, alignItems: "center" }}
          >
            <Avatar
              variant="rounded"
              sx={{
                width: 44,
                height: 44,
                bgcolor: "primary.main",
                fontWeight: 800,
              }}
            >
              DI
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
                DI EQA
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ระบบประเมินคุณภาพห้องปฏิบัติการ
              </Typography>
            </Box>
          </Stack>

          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>
            เข้าสู่ระบบ
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
            ยินดีต้อนรับกลับ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            กรุณาเลือกประเภทผู้ใช้และกรอกข้อมูลเพื่อเข้าสู่ระบบ
          </Typography>

          <Tabs
            value={mode}
            onChange={(_, v) => {
              setMode(v as Mode);
              setErr("");
              setUsername("");
              setPassword("");
            }}
            variant="fullWidth"
            sx={{
              mt: 3,
              mb: 3,
              minHeight: 44,
              "& .MuiTabs-indicator": { height: 3, borderRadius: 2 },
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Tab
              value="user"
              icon={<PersonOutlineIcon fontSize="small" />}
              iconPosition="start"
              label="ผู้เข้าอบรม"
              sx={{ minHeight: 44 }}
            />
            <Tab
              value="admin"
              icon={<AdminPanelSettingsOutlinedIcon fontSize="small" />}
              iconPosition="start"
              label="ผู้ดูแลระบบ"
              sx={{ minHeight: 44 }}
            />
          </Tabs>

          <Box component="form" onSubmit={onSubmit} noValidate>
            <Stack spacing={2.5}>
              {mode === "user" && (
                <TextField
                  select
                  fullWidth
                  label="โรงพยาบาล"
                  required
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  disabled={hospitalsLoading}
                  helperText={hospitalsLoading ? "กำลังโหลดรายชื่อโรงพยาบาล..." : " "}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocalHospitalOutlinedIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    },
                    select: {
                      displayEmpty: true,
                      MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } },
                    },
                  }}
                >
                  <MenuItem value="" disabled>
                    -- เลือกโรงพยาบาล --
                  </MenuItem>
                  {hospitals.map((h) => (
                    <MenuItem key={h.id} value={h.id}>
                      {h.name}
                      {h.province ? ` (${h.province})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                fullWidth
                label="ชื่อผู้ใช้"
                placeholder={mode === "admin" ? "admin" : "เช่น trainee01"}
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutlineIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label="รหัสผ่าน"
                placeholder="••••••••"
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                          size="small"
                          tabIndex={-1}
                          aria-label="toggle password visibility"
                        >
                          {showPassword ? (
                            <VisibilityOffOutlinedIcon fontSize="small" />
                          ) : (
                            <VisibilityOutlinedIcon fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {err && <Alert severity="error">{err}</Alert>}

              <Button
                type="submit"
                fullWidth
                size="large"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
                sx={{ py: 1.5, fontSize: "1rem", mt: 1 }}
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>
            </Stack>
          </Box>

          {mode === "user" && (
            <>
              <Divider sx={{ my: 3 }}>หรือ</Divider>
              <Typography variant="body2" align="center" color="text.secondary">
                ยังไม่มีบัญชีผู้ใช้?{" "}
                <Link
                  component="button"
                  type="button"
                  onClick={() => {
                    if (!selectedHospital) {
                      setErr("กรุณาเลือกโรงพยาบาลก่อนลงทะเบียน");
                      return;
                    }
                    auth.setHospital(selectedHospital);
                    router.push("/register");
                  }}
                  sx={{ fontWeight: 700, color: "primary.main" }}
                >
                  ลงทะเบียนที่นี่
                </Link>
              </Typography>
            </>
          )}

          <Typography
            variant="caption"
            color="text.disabled"
            align="center"
            sx={{ display: "block", mt: 4 }}
          >
            การใช้งานระบบนี้ถือว่าท่านยอมรับเงื่อนไขและนโยบายการคุ้มครองข้อมูลส่วนบุคคล
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        px: 1.5,
        py: 0.75,
        borderRadius: 999,
        bgcolor: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.16)",
        color: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(6px)",
        alignItems: "center",
      }}
    >
      {icon}
      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: "0.02em" }}>
        {label}
      </Typography>
    </Stack>
  );
}
