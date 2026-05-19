"use client";

import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { auth, type Hospital, type MemberType, type User } from "@/lib/auth";
import {
  BED_SIZES,
  HOSPITAL_TYPES,
  THAI_PROVINCES,
  buildCertificateYearOptions,
} from "@/lib/registerOptions";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Avatar from "@mui/material/Avatar";
import CircularProgress from "@mui/material/CircularProgress";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Grid from "@mui/material/Grid";
import Snackbar from "@mui/material/Snackbar";

import PersonOutlineIcon from "@mui/icons-material/PersonOutlineOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";

type FormState = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;

  clinic: string;
  labName: string;
  hospitalType: string;
  bedSize: string;

  addressNo: string;
  building: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;

  certificateYear: string;
};

const EMPTY_FORM: FormState = {
  username: "",
  password: "",
  firstName: "",
  lastName: "",
  email: "",
  clinic: "",
  labName: "",
  hospitalType: "",
  bedSize: "",
  addressNo: "",
  building: "",
  subDistrict: "",
  district: "",
  province: "",
  postalCode: "",
  certificateYear: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [memberType, setMemberType] = useState<MemberType>("internal");
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const yearOptions = useMemo(() => buildCertificateYearOptions(), []);

  useEffect(() => {
    setHospitalsLoading(true);
    api<Hospital[]>("/api/hospitals", { auth: false })
      .then((list) => setHospitals(list || []))
      .catch(() => {})
      .finally(() => setHospitalsLoading(false));
  }, []);

  useEffect(() => {
    const h = auth.getHospital();
    if (h) {
      setHospital(h);
      setMemberType("internal");
      setForm((f) => ({
        ...f,
        clinic: f.clinic || h.name,
        province: f.province || h.province || "",
      }));
    } else {
      setMemberType("external");
    }
  }, []);

  const set =
    (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const handleMemberTypeChange = (_: unknown, value: MemberType | null) => {
    if (!value) return;
    setErr("");
    setMemberType(value);
    if (value === "external") {
      if (hospital) {
        setForm((f) => ({
          ...f,
          clinic: f.clinic === hospital.name ? "" : f.clinic,
          province: f.province === hospital.province ? "" : f.province,
        }));
      }
    } else if (hospital) {
      setForm((f) => ({
        ...f,
        clinic: f.clinic || hospital.name,
        province: f.province || hospital.province || "",
      }));
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (memberType === "internal" && !hospital) {
      setErr("กรุณาเลือกโรงพยาบาลสำหรับบุคลากรภายใน");
      return;
    }

    const payload: Record<string, unknown> = {
      memberType,
      username: form.username,
      password: form.password,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      fullName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      email: form.email.trim(),

      clinic: form.clinic.trim(),
      labName: form.labName.trim(),
      hospitalType: form.hospitalType,
      bedSize: form.bedSize,

      address: {
        addressNo: form.addressNo.trim(),
        building: form.building.trim(),
        subDistrict: form.subDistrict.trim(),
        district: form.district.trim(),
        province: form.province,
        postalCode: form.postalCode.trim(),
      },

      certificateYear: form.certificateYear ? Number(form.certificateYear) : undefined,
    };

    if (memberType === "internal" && hospital) {
      payload.hospitalCode = hospital.code;
    }

    setLoading(true);
    try {
      await api<{ token: string; user: User }>("/api/auth/register", {
        method: "POST",
        auth: false,
        body: JSON.stringify(payload),
      });
      // Clear any stale token from a previous session — user must log in fresh.
      auth.logout();
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1400);
    } catch (e: any) {
      setErr(e?.message || "ลงทะเบียนไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        position: "relative",
        background:
          "radial-gradient(1200px 600px at -10% -10%, rgba(125,211,252,0.15) 0%, transparent 60%)," +
          "radial-gradient(1200px 600px at 110% 110%, rgba(30,58,138,0.10) 0%, transparent 60%)," +
          "linear-gradient(180deg, #F8FAFC 0%, #EEF2F7 100%)",
      }}
    >
      {/* ─────────── Top Bar ─────────── */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Container maxWidth="lg" sx={{ py: 1.5 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Avatar
                variant="rounded"
                sx={{ width: 40, height: 40, bgcolor: "primary.main", fontWeight: 800 }}
              >
                DI
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
                  DI EQA
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
                  ระบบประเมินคุณภาพห้องปฏิบัติการ
                </Typography>
              </Box>
            </Stack>
            <Button
              component={NextLink}
              href="/login"
              variant="text"
              startIcon={<ArrowBackOutlinedIcon />}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              กลับไปเข้าสู่ระบบ
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ─────────── Hero ─────────── */}
      <Container maxWidth="lg" sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 2, md: 3 }, textAlign: "center" }}>
        <Stack spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 56,
              height: 56,
              bgcolor: "primary.main",
              boxShadow: "0 10px 30px rgba(30,58,138,0.25)",
            }}
          >
            <HowToRegOutlinedIcon fontSize="medium" />
          </Avatar>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700, letterSpacing: "0.2em" }}>
            สมัครสมาชิก
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
            สร้างบัญชีผู้ใช้งาน DI EQA
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 640, lineHeight: 1.7 }}
          >
            กรอกข้อมูลให้ครบถ้วน เพื่อใช้สำหรับการจัดส่งเอกสาร ตัวอย่างทดสอบ
            และออกใบประกาศนียบัตรอย่างเป็นทางการ
          </Typography>
        </Stack>
      </Container>

      {/* ─────────── Form ─────────── */}
      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 10 } }}>
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={3}>
            {/* ── Card 0: Member type + Hospital ── */}
            <FormCard
              icon={<GroupOutlinedIcon />}
              title="ประเภทสมาชิก"
              subtitle="เลือกประเภทที่ตรงกับสถานะของท่าน"
            >
              <ToggleButtonGroup
                exclusive
                fullWidth
                color="primary"
                value={memberType}
                onChange={handleMemberTypeChange}
                sx={{
                  "& .MuiToggleButton-root": {
                    py: 1.25,
                    textTransform: "none",
                    fontWeight: 600,
                    borderColor: "divider",
                  },
                }}
              >
                <ToggleButton value="internal">
                  <GroupOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                  บุคลากรภายใน
                </ToggleButton>
                <ToggleButton value="external">
                  <PublicOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                  บุคลากรภายนอก
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
                {memberType === "internal"
                  ? "บุคลากรภายใน: สังกัดโรงพยาบาลที่อยู่ในระบบ — เลือกโรงพยาบาลจากรายการด้านล่าง"
                  : "บุคลากรภายนอก: ไม่สังกัดโรงพยาบาลในระบบ สามารถกรอกข้อมูลหน่วยงานเองได้"}
              </Typography>

              {memberType === "internal" && (
                <TextField
                  select
                  fullWidth
                  required
                  label="โรงพยาบาล / สถานพยาบาล"
                  value={hospital?.id ?? ""}
                  disabled={hospitalsLoading}
                  helperText={hospitalsLoading ? "กำลังโหลดรายชื่อโรงพยาบาล..." : " "}
                  onChange={(e) => {
                    const selected = hospitals.find((h) => h.id === e.target.value) ?? null;
                    setHospital(selected);
                    if (selected) {
                      auth.setHospital(selected);
                      setForm((f) => ({
                        ...f,
                        clinic: f.clinic || selected.name,
                        province: f.province || selected.province || "",
                      }));
                    }
                  }}
                  sx={{ mt: 2 }}
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
                  <MenuItem value="" disabled>-- เลือกโรงพยาบาล --</MenuItem>
                  {hospitals.map((h) => (
                    <MenuItem key={h.id} value={h.id}>
                      {h.name}{h.province ? ` (${h.province})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </FormCard>

            {/* ── Card 1: Personal info ── */}
            <FormCard
              icon={<BadgeOutlinedIcon />}
              title="ข้อมูลส่วนตัว"
              subtitle="ชื่อ-นามสกุล และข้อมูลติดต่อสำหรับเข้าสู่ระบบ"
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="ชื่อ"
                    required
                    value={form.firstName}
                    onChange={set("firstName")}
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
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="นามสกุล"
                    required
                    value={form.lastName}
                    onChange={set("lastName")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="อีเมล"
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
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="ชื่อผู้ใช้"
                    placeholder="ตัวพิมพ์เล็ก เช่น trainee01"
                    required
                    value={form.username}
                    onChange={set("username")}
                    slotProps={{
                      htmlInput: { minLength: 3, maxLength: 32 },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
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
                </Grid>
              </Grid>
            </FormCard>

            {/* ── Card 2: Address ── */}
            <FormCard
              icon={<HomeOutlinedIcon />}
              title="ที่อยู่สำหรับจัดส่งเอกสาร / ตัวอย่างทดสอบ"
              subtitle="ข้อมูลนี้จะใช้ในการจัดส่งเอกสารและตัวอย่างทดสอบไปยังหน่วยงานของท่าน"
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="คลินิก / หน่วยงาน"
                    placeholder="เช่น รพ.ย่านตาขาว"
                    required
                    value={form.clinic}
                    onChange={set("clinic")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="ชื่อห้องปฏิบัติการ"
                    placeholder="เช่น กลุ่มงานเทคนิคการแพทย์"
                    value={form.labName}
                    onChange={set("labName")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="ประเภทโรงพยาบาล / หน่วยงาน"
                    value={form.hospitalType}
                    onChange={set("hospitalType")}
                  >
                    <MenuItem value=""><em>-- เลือก --</em></MenuItem>
                    {HOSPITAL_TYPES.map((t) => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="จำนวนเตียง"
                    value={form.bedSize}
                    onChange={set("bedSize")}
                  >
                    <MenuItem value=""><em>-- เลือก --</em></MenuItem>
                    {BED_SIZES.map((b) => (
                      <MenuItem key={b} value={b}>{b}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="ที่อยู่เลขที่"
                    placeholder="เช่น 293"
                    value={form.addressNo}
                    onChange={set("addressNo")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="ตึก ชั้น ซอย ถนน"
                    placeholder="เช่น ม.1"
                    value={form.building}
                    onChange={set("building")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="แขวง / ตำบล"
                    value={form.subDistrict}
                    onChange={set("subDistrict")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="เขต / อำเภอ"
                    value={form.district}
                    onChange={set("district")}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="จังหวัด"
                    value={form.province}
                    onChange={set("province")}
                    slotProps={{
                      select: {
                        MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } },
                      },
                    }}
                  >
                    <MenuItem value=""><em>-- เลือกจังหวัด --</em></MenuItem>
                    {THAI_PROVINCES.map((p) => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="รหัสไปรษณีย์"
                    placeholder="เช่น 92140"
                    value={form.postalCode}
                    onChange={set("postalCode")}
                    slotProps={{
                      htmlInput: { inputMode: "numeric", maxLength: 5, pattern: "[0-9]{5}" },
                    }}
                  />
                </Grid>
              </Grid>
            </FormCard>

            {/* ── Card 3: Certificate ── */}
            <FormCard
              icon={<WorkspacePremiumOutlinedIcon />}
              title="ข้อมูลประกาศนียบัตร"
              subtitle="ระบุปีที่จะออกใบประกาศนียบัตรของท่าน"
            >
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label="ปีที่ออกประกาศนียบัตร"
                    value={form.certificateYear}
                    onChange={set("certificateYear")}
                  >
                    <MenuItem value=""><em>-- เลือกปี --</em></MenuItem>
                    {yearOptions.map((y) => (
                      <MenuItem key={y} value={String(y)}>{y}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </FormCard>

            {/* ── Error + Submit ── */}
            {err && <Alert severity="error">{err}</Alert>}

            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, sm: 3 },
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    พร้อมสมัครสมาชิกแล้ว?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    หลังสมัครสำเร็จ ระบบจะนำท่านกลับไปยังหน้าเข้าสู่ระบบ
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                  <Button
                    component={NextLink}
                    href="/login"
                    variant="outlined"
                    size="large"
                    sx={{ px: 3, fontWeight: 600 }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading || (memberType === "internal" && !hospital)}
                    startIcon={
                      loading ? <CircularProgress size={18} color="inherit" /> : <HowToRegOutlinedIcon />
                    }
                    sx={{
                      px: 4,
                      fontWeight: 700,
                      boxShadow: "0 10px 24px rgba(30,58,138,0.25)",
                    }}
                  >
                    {loading ? "กำลังสมัคร..." : "ลงทะเบียน"}
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            <Divider sx={{ mt: 1 }}>หรือ</Divider>
            <Typography variant="body2" align="center" color="text.secondary">
              มีบัญชีอยู่แล้ว?{" "}
              <Link
                component={NextLink}
                href="/login"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                เข้าสู่ระบบ
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Container>

      <Snackbar
        open={success}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={1400}
      >
        <Alert severity="success" variant="filled" sx={{ fontWeight: 600 }}>
          สมัครสมาชิกสำเร็จ กำลังกลับไปยังหน้าเข้าสู่ระบบ...
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ─── Form card primitive ─────────────────────────────────────────────────────
function FormCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 4 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", mb: 3 }}>
        <Avatar
          variant="rounded"
          sx={{
            width: 44,
            height: 44,
            bgcolor: "rgba(30,58,138,0.08)",
            color: "primary.main",
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
      {children}
    </Paper>
  );
}
