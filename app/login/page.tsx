"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { api } from "@/lib/api";
import { auth, type User } from "@/lib/auth";
import { Eyebrow, Field, PaperCard, Tessellation, Wordmark } from "@/components/ui";
import { accent, paper, fadeUp, hexToRgba, chevronCut } from "@/lib/design";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";

import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth.isAuthed()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      // 1. Authenticate — no hospitalCode needed.
      const loginData = await api<{ token: string; user: User }>("/api/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ username, password }),
      });

      // Store token so the /me call can attach it.
      localStorage.setItem("di_eqa_token", loginData.token);

      // 2. Fetch full profile (includes hospital + profile fields).
      const fullUser = await api<User>("/api/auth/me");
      auth.setSession(loginData.token, fullUser);
      if (fullUser.hospital) auth.setHospital(fullUser.hospital);

      // Route based on role.
      const { role } = fullUser;
      if (role === "super_admin" || role === "admin" || role === "instructor") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (e: any) {
      setErr(e?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
        bgcolor: "background.default",
      }}
    >
      {/* ─── LEFT: ink panel ─── */}
      <Box
        sx={{
          position: "relative",
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          bgcolor: paper.ink,
          color: paper.white,
          px: { md: 6, lg: 9 },
          py: { md: 6, lg: 8 },
          overflow: "hidden",
        }}
      >
        <Tessellation color={paper.white} alpha={0.03} size={88} />
        {/* Two planes of the same sheet, folded back at opposite corners. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 300,
            height: 300,
            bgcolor: hexToRgba(paper.white, 0.05),
            clipPath: "polygon(0 100%, 0 0, 100% 100%)",
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 200,
            height: 200,
            bgcolor: hexToRgba(paper.white, 0.035),
            clipPath: "polygon(100% 0, 100% 100%, 0 0)",
          }}
        />

        <Box sx={{ position: "relative" }}>
          <Wordmark size={46} onDark caption="External Quality Assessment" />
        </Box>

        <Stack spacing={3} sx={{ position: "relative", maxWidth: 540 }}>
          <Eyebrow onDark>ระบบประเมินคุณภาพทางห้องปฏิบัติการ</Eyebrow>
          <Typography variant="h2" sx={{ fontSize: { md: "2.25rem", lg: "2.75rem" }, lineHeight: 1.15 }}>
            ยกระดับมาตรฐานวิชาชีพ
            <Box component="br" />
            ด้วยระบบประเมินที่
            <Box component="span" sx={{ color: accent.coral }}> เชื่อถือได้</Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: hexToRgba(paper.white, 0.72), lineHeight: 1.7, maxWidth: "62ch" }}
          >
            แพลตฟอร์มกลางสำหรับการอบรมและประเมินความรู้ของบุคลากรห้องปฏิบัติการทางการแพทย์
            ทำข้อสอบออนไลน์ ได้ผลลัพธ์ทันที พร้อมใบประกาศนียบัตรอย่างเป็นทางการ
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ mt: 1, flexWrap: "wrap", rowGap: 1.5 }}>
            <FeatureTag icon={<ShieldOutlinedIcon fontSize="small" />} label="ปลอดภัยและมาตรฐาน" />
            <FeatureTag icon={<HubOutlinedIcon fontSize="small" />} label="ใช้งานทั่วประเทศ" />
            <FeatureTag icon={<EmojiEventsOutlinedIcon fontSize="small" />} label="ใบประกาศอย่างเป็นทางการ" />
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{ position: "relative", color: hexToRgba(paper.white, 0.45), alignItems: "center" }}
        >
          <VerifiedUserOutlinedIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" sx={{ letterSpacing: "0.04em" }}>
            © {new Date().getFullYear()} DI EQA · All rights reserved.
          </Typography>
        </Stack>
      </Box>

      {/* ─── RIGHT: form panel ─── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2.5, sm: 6, lg: 9 },
          py: { xs: 5, md: 8 },
        }}
      >
        <PaperCard cut={28} sx={{ width: "100%", maxWidth: 470, p: { xs: 3, sm: 5 }, ...fadeUp() }}>
          {/* Mobile lockup */}
          <Box sx={{ display: { xs: "block", md: "none" }, mb: 3.5 }}>
            <Wordmark size={42} />
          </Box>

          <Eyebrow>เข้าสู่ระบบ</Eyebrow>
          <Typography variant="h4" sx={{ mt: 1.5 }}>
            ยินดีต้อนรับกลับ
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าสู่ระบบ
          </Typography>

          <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 4 }}>
            <Stack spacing={2.5}>
              <Field
                label="ชื่อผู้ใช้"
                placeholder="เช่น trainee01"
                required
                autoFocus
                autoComplete="username"
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

              <Field
                label="รหัสผ่าน"
                placeholder="••••••••"
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
                          aria-label="สลับการแสดงรหัสผ่าน"
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
                endIcon={!loading ? <ArrowForwardOutlinedIcon /> : undefined}
                sx={{ py: 1.65, fontSize: "1rem", mt: 1 }}
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </Button>

              {/* Shimmer bar stands in for a spinner while the request runs. */}
              {loading && <Box className="paper-skeleton" sx={{ height: 3, mt: -1 }} />}
            </Stack>
          </Box>

          <Box
            sx={{
              mt: 4,
              pt: 3,
              borderTop: `1px solid ${paper.crease}`,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              ยังไม่มีบัญชี?{" "}
              <Link component={NextLink} href="/register" onClick={() => auth.clearHospital()}>
                สมัครสมาชิกใหม่
              </Link>
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 3 }}>
              การใช้งานระบบนี้ถือว่าท่านยอมรับเงื่อนไขและนโยบายการคุ้มครองข้อมูลส่วนบุคคล
            </Typography>
          </Box>
        </PaperCard>
      </Box>
    </Box>
  );
}

function FeatureTag({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        px: 1.75,
        py: 0.85,
        alignItems: "center",
        clipPath: chevronCut(10),
        bgcolor: hexToRgba(paper.white, 0.08),
        borderLeft: `2px solid ${accent.coral}`,
        color: hexToRgba(paper.white, 0.92),
      }}
    >
      {icon}
      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: "0.02em" }}>
        {label}
      </Typography>
    </Stack>
  );
}
