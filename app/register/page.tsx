"use client";

import NextLink from "next/link";
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
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";

import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

export default function RegisterPage() {
  const router = useRouter();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [form, setForm] = useState({ username: "", fullName: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = auth.getHospital();
    if (!h) {
      router.replace("/login");
      return;
    }
    setHospital(h);
  }, [router]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospital) return;
    setErr("");
    setLoading(true);
    try {
      const data = await api<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ hospitalCode: hospital.code, ...form }),
      });
      auth.setSession(data.token, data.user);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e.message || "ลงทะเบียนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  if (!hospital) return null;

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
            }}
          >
            DI
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              DI EQA
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
              External Quality Assessment
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={3} sx={{ position: "relative", maxWidth: 520 }}>
          <Typography variant="overline" sx={{ color: "#93C5FD", letterSpacing: "0.22em", fontWeight: 700 }}>
            สมัครสมาชิก
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              lineHeight: 1.15,
              fontSize: { md: "2.25rem", lg: "2.5rem" },
            }}
          >
            ก้าวสู่การประเมินวิชาชีพ
            <Box component="br" />
            <Box component="span" sx={{ color: "#7DD3FC" }}>อย่างเป็นทางการ</Box>
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.7 }}>
            ลงทะเบียนเพื่อเข้าใช้งานระบบประเมินคุณภาพห้องปฏิบัติการ
            ทำข้อสอบและรับใบประกาศนียบัตรอย่างเป็นทางการ
          </Typography>
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", rowGap: 1.5, mt: 1 }}>
            <FeaturePill icon={<ShieldOutlinedIcon fontSize="small" />} label="ข้อมูลปลอดภัย" />
            <FeaturePill icon={<HubOutlinedIcon fontSize="small" />} label="ใช้งานได้ทุกที่" />
            <FeaturePill icon={<EmojiEventsOutlinedIcon fontSize="small" />} label="ใบประกาศ" />
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ position: "relative", color: "rgba(255,255,255,0.55)", alignItems: "center" }}>
          <VerifiedUserOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ letterSpacing: "0.04em" }}>
            © {new Date().getFullYear()} DI EQA · All rights reserved.
          </Typography>
        </Stack>
      </Box>

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
            maxWidth: 480,
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            border: { xs: "1px solid", md: "none" },
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ display: { xs: "flex", md: "none" }, mb: 3, alignItems: "center" }}>
            <Avatar variant="rounded" sx={{ width: 44, height: 44, bgcolor: "primary.main", fontWeight: 800 }}>
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
            สมัครสมาชิก
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
            สร้างบัญชีผู้ใช้งาน
          </Typography>

          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              mt: 3,
              px: 2,
              py: 1.5,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "#F8FAFC",
              alignItems: "center",
            }}
          >
            <Avatar variant="rounded" sx={{ width: 38, height: 38, bgcolor: "primary.light", color: "common.white" }}>
              <LocalHospitalOutlinedIcon fontSize="small" />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary">
                สมัครสำหรับโรงพยาบาล
              </Typography>
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }} title={hospital.name}>
                {hospital.name}
              </Typography>
              {hospital.province && (
                <Typography variant="caption" color="text.disabled">
                  {hospital.province}
                </Typography>
              )}
            </Box>
          </Stack>

          <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 3 }}>
            <Stack spacing={2.5}>
              <TextField
                fullWidth
                label="ชื่อ-นามสกุล"
                placeholder="เช่น สมชาย ใจดี"
                required
                value={form.fullName}
                onChange={set("fullName")}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label="ชื่อผู้ใช้"
                placeholder="ตัวพิมพ์เล็ก เช่น trainee01"
                required
                value={form.username}
                onChange={set("username")}
                slotProps={{
                  htmlInput: { minLength: 3 },
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
                label="อีเมล (ไม่บังคับ)"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={set("email")}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                label="รหัสผ่าน"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                required
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={set("password")}
                slotProps={{
                  htmlInput: { minLength: 6 },
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
                sx={{ py: 1.5, fontSize: "1rem", mt: 0.5 }}
              >
                {loading ? "กำลังสมัครสมาชิก..." : "ลงทะเบียน"}
              </Button>
            </Stack>
          </Box>

          <Divider sx={{ my: 3 }}>หรือ</Divider>
          <Typography variant="body2" align="center" color="text.secondary">
            มีบัญชีอยู่แล้ว?{" "}
            <Link component={NextLink} href="/login" sx={{ fontWeight: 700, color: "primary.main" }}>
              เข้าสู่ระบบ
            </Link>
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
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
    </Stack>
  );
}
