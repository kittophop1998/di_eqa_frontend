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
import Grid from "@mui/material/Grid";
import Snackbar from "@mui/material/Snackbar";
import Autocomplete from "@mui/material/Autocomplete";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

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
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";

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

const STEPS = [
  { label: "ประเภทสมาชิก", short: "เริ่มต้น" },
  { label: "ข้อมูลส่วนตัว", short: "บัญชี" },
  { label: "หน่วยงาน & ที่อยู่", short: "ที่อยู่" },
  { label: "ตรวจสอบและยืนยัน", short: "ยืนยัน" },
];

export default function RegisterPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeStep, setActiveStep] = useState(0);
  const [memberType, setMemberType] = useState<MemberType>("external");
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
    }
  }, []);

  const set =
    (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const selectMemberType = (value: MemberType) => {
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

  // Password strength scoring (0-4)
  const passwordStrength = useMemo(() => {
    const p = form.password;
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score += 1;
    if (p.length >= 10) score += 1;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score += 1;
    if (/[0-9]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    return Math.min(score, 4);
  }, [form.password]);

  const passwordStrengthLabel = ["อ่อนมาก", "อ่อน", "พอใช้", "ดี", "ดีมาก"][passwordStrength];
  const passwordStrengthColor = (
    ["error", "error", "warning", "info", "success"] as const
  )[passwordStrength];

  const stepValid = (step: number): boolean => {
    if (step === 0) {
      if (memberType === "internal") return !!hospital;
      return true;
    }
    if (step === 1) {
      return (
        form.firstName.trim().length > 0 &&
        form.lastName.trim().length > 0 &&
        form.username.trim().length >= 3 &&
        form.password.length >= 6
      );
    }
    if (step === 2) {
      return form.clinic.trim().length > 0;
    }
    return true;
  };

  const allValid = STEPS.every((_, i) => stepValid(i));
  const progressPct = ((activeStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (!stepValid(activeStep)) {
      setErr("กรุณากรอกข้อมูลที่จำเป็นในขั้นตอนนี้ให้ครบถ้วน");
      return;
    }
    setErr("");
    setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setErr("");
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeStep < STEPS.length - 1) {
      handleNext();
      return;
    }
    setErr("");

    if (memberType === "internal" && !hospital) {
      setErr("กรุณาเลือกโรงพยาบาลสำหรับบุคลากรภายใน");
      setActiveStep(0);
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
        background:
          "radial-gradient(1200px 600px at -10% -10%, rgba(125,211,252,0.15) 0%, transparent 60%)," +
          "radial-gradient(1200px 600px at 110% 110%, rgba(30,58,138,0.10) 0%, transparent 60%)," +
          "linear-gradient(180deg, #F8FAFC 0%, #EEF2F7 100%)",
        pb: { xs: 12, md: 10 },
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
        <Container maxWidth="md" sx={{ py: 1.5 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Avatar
                variant="rounded"
                sx={{ width: 38, height: 38, bgcolor: "primary.main", fontWeight: 800 }}
              >
                DI
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.15 }}>
                  DI EQA
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: { xs: "none", sm: "block" } }}
                >
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
              {isMobile ? "เข้าสู่ระบบ" : "กลับไปเข้าสู่ระบบ"}
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ─────────── Hero (compact) ─────────── */}
      <Container maxWidth="md" sx={{ pt: { xs: 3, md: 5 }, pb: { xs: 1, md: 2 } }}>
        <Stack spacing={0.5} sx={{ alignItems: "center", textAlign: "center" }}>
          <Typography
            variant="overline"
            color="primary.main"
            sx={{ fontWeight: 700, letterSpacing: "0.2em" }}
          >
            สมัครสมาชิก
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, fontSize: { xs: "1.5rem", md: "2rem" } }}
          >
            สร้างบัญชีผู้ใช้งาน DI EQA
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520, lineHeight: 1.6 }}>
            กรอกข้อมูล 4 ขั้นตอนง่ายๆ เพื่อใช้สำหรับจัดส่งเอกสาร ตัวอย่างทดสอบ
            และออกใบประกาศนียบัตร
          </Typography>
        </Stack>
      </Container>

      {/* ─────────── Stepper ─────────── */}
      <Container maxWidth="md" sx={{ pt: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            mb: 2,
          }}
        >
          {isMobile ? (
            <Stack spacing={1.25}>
              <Stack
                direction="row"
                sx={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, color: "primary.main" }}>
                  ขั้นตอนที่ {activeStep + 1} / {STEPS.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {STEPS[activeStep].label}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progressPct}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Stack>
          ) : (
            <Stepper activeStep={activeStep} alternativeLabel>
              {STEPS.map((s, i) => (
                <Step key={s.label} completed={stepValid(i) && i < activeStep}>
                  <StepLabel
                    slotProps={{
                      label: {
                        sx: { fontWeight: i === activeStep ? 700 : 500, fontSize: 14 },
                      },
                    }}
                  >
                    {s.label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          )}
        </Paper>
      </Container>

      {/* ─────────── Form ─────────── */}
      <Container maxWidth="md">
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2.5}>
            {/* ── Step 0: Member type + Hospital ── */}
            {activeStep === 0 && (
              <SectionCard
                icon={<GroupOutlinedIcon />}
                title="เลือกประเภทสมาชิก"
                subtitle="เริ่มต้นโดยเลือกประเภทที่ตรงกับสถานะของท่าน"
              >
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MemberTypeCard
                      selected={memberType === "internal"}
                      icon={<GroupOutlinedIcon />}
                      title="บุคลากรภายใน"
                      description="สังกัดโรงพยาบาลในระบบ"
                      onClick={() => selectMemberType("internal")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MemberTypeCard
                      selected={memberType === "external"}
                      icon={<PublicOutlinedIcon />}
                      title="บุคลากรภายนอก"
                      description="ไม่ได้สังกัดในระบบ"
                      onClick={() => selectMemberType("external")}
                    />
                  </Grid>
                </Grid>

                {memberType === "internal" && (
                  <Box sx={{ mt: 3 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 700, mb: 1.5 }}
                    >
                      เลือกโรงพยาบาลของท่าน
                      <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
                        *
                      </Typography>
                    </Typography>
                    <Autocomplete
                      fullWidth
                      options={hospitals}
                      value={hospital}
                      loading={hospitalsLoading}
                      disabled={hospitalsLoading}
                      getOptionLabel={(h) =>
                        h.name + (h.province ? ` (${h.province})` : "")
                      }
                      isOptionEqualToValue={(a, b) => a.id === b.id}
                      noOptionsText="ไม่พบโรงพยาบาลที่ค้นหา"
                      loadingText="กำลังโหลดรายชื่อโรงพยาบาล..."
                      onChange={(_, selected) => {
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
                      slotProps={{
                        paper: {
                          elevation: 8,
                          sx: {
                            mt: 0.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                            boxShadow:
                              "0 10px 30px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.08)",
                            overflow: "hidden",
                          },
                        },
                        listbox: {
                          sx: {
                            maxHeight: 320,
                            py: 0.5,
                            "& .MuiAutocomplete-option": {
                              borderRadius: 1.5,
                              mx: 0.5,
                              my: 0.25,
                              transition: "background-color .15s",
                              "&[aria-selected='true']": {
                                bgcolor: "rgba(30,58,138,0.08)",
                              },
                              "&.Mui-focused, &:hover": {
                                bgcolor: "rgba(30,58,138,0.06)",
                              },
                            },
                          },
                        },
                      }}
                      renderInput={(params) => {
                        const p = params as any;
                        const inputSlot = p.slotProps?.input ?? p.InputProps ?? {};
                        return (
                          <TextField
                            {...params}
                            required
                            placeholder="พิมพ์ชื่อโรงพยาบาลเพื่อค้นหา..."
                            slotProps={{
                              ...p.slotProps,
                              input: {
                                ...inputSlot,
                                startAdornment: (
                                  <>
                                    <InputAdornment position="start">
                                      <LocalHospitalOutlinedIcon
                                        fontSize="small"
                                        color="action"
                                      />
                                    </InputAdornment>
                                    {inputSlot.startAdornment}
                                  </>
                                ),
                                endAdornment: (
                                  <>
                                    {hospitalsLoading ? (
                                      <CircularProgress size={16} />
                                    ) : null}
                                    {inputSlot.endAdornment}
                                  </>
                                ),
                              },
                            }}
                          />
                        );
                      }}
                      renderOption={(props, h) => (
                        <Box component="li" {...props} key={h.id}>
                          <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: "center", width: "100%", py: 0.5 }}
                          >
                            <Avatar
                              variant="rounded"
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "rgba(30,58,138,0.08)",
                                color: "primary.main",
                                fontSize: 13,
                                fontWeight: 700,
                              }}
                            >
                              {h.name.charAt(0)}
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, lineHeight: 1.3 }}
                                noWrap
                              >
                                {h.name}
                              </Typography>
                              {h.province && (
                                <Typography variant="caption" color="text.secondary">
                                  {h.province}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </Box>
                      )}
                    />

                    {hospital && (
                      <Paper
                        elevation={0}
                        sx={{
                          mt: 2,
                          p: 2,
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "success.light",
                          bgcolor: "rgba(46,160,67,0.06)",
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <CheckCircleRoundedIcon color="success" />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                            {hospital.name}
                          </Typography>
                          {hospital.province && (
                            <Typography variant="caption" color="text.secondary">
                              จังหวัด{hospital.province}
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    )}
                  </Box>
                )}
              </SectionCard>
            )}

            {/* ── Step 1: Personal info ── */}
            {activeStep === 1 && (
              <SectionCard
                icon={<BadgeOutlinedIcon />}
                title="ข้อมูลส่วนตัวและบัญชีผู้ใช้"
                subtitle="ใช้สำหรับเข้าสู่ระบบและออกใบประกาศนียบัตร"
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
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="อีเมล"
                      type="email"
                      placeholder="example@email.com"
                      value={form.email}
                      onChange={set("email")}
                      helperText="ใช้รับการแจ้งเตือนและกู้คืนรหัสผ่าน"
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
                      placeholder="เช่น trainee01"
                      required
                      value={form.username}
                      onChange={set("username")}
                      helperText="3–32 ตัวอักษร ใช้ตัวพิมพ์เล็ก"
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
                  <Grid size={{ xs: 12, sm: 6 }}>
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
                    {form.password && (
                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={0.5}>
                          {[0, 1, 2, 3].map((i) => (
                            <Box
                              key={i}
                              sx={{
                                flex: 1,
                                height: 4,
                                borderRadius: 2,
                                bgcolor:
                                  i < passwordStrength
                                    ? `${passwordStrengthColor}.main`
                                    : "grey.200",
                                transition: "background-color .2s",
                              }}
                            />
                          ))}
                        </Stack>
                        <Typography
                          variant="caption"
                          color={`${passwordStrengthColor}.main`}
                          sx={{ fontWeight: 600 }}
                        >
                          ความปลอดภัย: {passwordStrengthLabel}
                        </Typography>
                      </Stack>
                    )}
                  </Grid>
                </Grid>
              </SectionCard>
            )}

            {/* ── Step 2: Address & Org ── */}
            {activeStep === 2 && (
              <Stack spacing={2.5}>
                <SectionCard
                  icon={<LocalHospitalOutlinedIcon />}
                  title="ข้อมูลหน่วยงาน"
                  subtitle="ข้อมูลคลินิก / ห้องปฏิบัติการ"
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
                        <MenuItem value="">
                          <em>-- เลือก --</em>
                        </MenuItem>
                        {HOSPITAL_TYPES.map((t) => (
                          <MenuItem key={t} value={t}>
                            {t}
                          </MenuItem>
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
                        <MenuItem value="">
                          <em>-- เลือก --</em>
                        </MenuItem>
                        {BED_SIZES.map((b) => (
                          <MenuItem key={b} value={b}>
                            {b}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>
                </SectionCard>

                <SectionCard
                  icon={<HomeOutlinedIcon />}
                  title="ที่อยู่สำหรับจัดส่ง"
                  subtitle="ใช้สำหรับจัดส่งเอกสารและตัวอย่างทดสอบ"
                >
                  <Grid container spacing={2}>
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
                      <Autocomplete
                        fullWidth
                        options={THAI_PROVINCES}
                        value={form.province || null}
                        onChange={(_, v) =>
                          setForm((f) => ({ ...f, province: v ?? "" }))
                        }
                        slotProps={{
                          paper: {
                            elevation: 8,
                            sx: {
                              mt: 0.5,
                              borderRadius: 2,
                              border: "1px solid",
                              borderColor: "divider",
                              bgcolor: "background.paper",
                              boxShadow:
                                "0 10px 30px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.08)",
                              overflow: "hidden",
                            },
                          },
                          listbox: {
                            sx: {
                              maxHeight: 320,
                              py: 0.5,
                              "& .MuiAutocomplete-option": {
                                borderRadius: 1.5,
                                mx: 0.5,
                                my: 0.25,
                                "&[aria-selected='true']": {
                                  bgcolor: "rgba(30,58,138,0.08)",
                                },
                                "&.Mui-focused, &:hover": {
                                  bgcolor: "rgba(30,58,138,0.06)",
                                },
                              },
                            },
                          },
                        }}
                        renderInput={(params) => (
                          <TextField {...params} label="จังหวัด" placeholder="เลือกจังหวัด" />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="รหัสไปรษณีย์"
                        placeholder="เช่น 92140"
                        value={form.postalCode}
                        onChange={set("postalCode")}
                        slotProps={{
                          htmlInput: {
                            inputMode: "numeric",
                            maxLength: 5,
                            pattern: "[0-9]{5}",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </SectionCard>
              </Stack>
            )}

            {/* ── Step 3: Review ── */}
            {activeStep === 3 && (
              <Stack spacing={2.5}>
                <SectionCard
                  icon={<WorkspacePremiumOutlinedIcon />}
                  title="ปีออกประกาศนียบัตร"
                  subtitle="เลือกปีที่ต้องการให้ออกใบประกาศนียบัตร"
                >
                  <TextField
                    select
                    fullWidth
                    label="ปีที่ออกประกาศนียบัตร"
                    value={form.certificateYear}
                    onChange={set("certificateYear")}
                    sx={{ maxWidth: { sm: 320 } }}
                  >
                    <MenuItem value="">
                      <em>-- เลือกปี --</em>
                    </MenuItem>
                    {yearOptions.map((y) => (
                      <MenuItem key={y} value={String(y)}>
                        {y}
                      </MenuItem>
                    ))}
                  </TextField>
                </SectionCard>

                <SectionCard
                  icon={<HowToRegOutlinedIcon />}
                  title="ตรวจสอบข้อมูลก่อนสมัคร"
                  subtitle="โปรดตรวจสอบความถูกต้องของข้อมูลที่กรอก"
                >
                  <Stack spacing={2.5}>
                    <ReviewBlock
                      title="ประเภทสมาชิก"
                      onEdit={() => setActiveStep(0)}
                      rows={[
                        [
                          "ประเภท",
                          memberType === "internal"
                            ? "บุคลากรภายใน"
                            : "บุคลากรภายนอก",
                        ],
                        ...(hospital
                          ? ([
                              ["โรงพยาบาล", hospital.name],
                              ["จังหวัด", hospital.province ?? "-"],
                            ] as [string, string][])
                          : []),
                      ]}
                    />
                    <ReviewBlock
                      title="ข้อมูลส่วนตัว"
                      onEdit={() => setActiveStep(1)}
                      rows={[
                        ["ชื่อ-นามสกุล", `${form.firstName} ${form.lastName}`.trim() || "-"],
                        ["อีเมล", form.email || "-"],
                        ["ชื่อผู้ใช้", form.username || "-"],
                      ]}
                    />
                    <ReviewBlock
                      title="หน่วยงาน & ที่อยู่"
                      onEdit={() => setActiveStep(2)}
                      rows={[
                        ["คลินิก / หน่วยงาน", form.clinic || "-"],
                        ["ห้องปฏิบัติการ", form.labName || "-"],
                        ["ประเภท", form.hospitalType || "-"],
                        ["จำนวนเตียง", form.bedSize || "-"],
                        [
                          "ที่อยู่",
                          [form.addressNo, form.building, form.subDistrict, form.district, form.province, form.postalCode]
                            .filter(Boolean)
                            .join(" ") || "-",
                        ],
                      ]}
                    />
                  </Stack>
                </SectionCard>
              </Stack>
            )}

            {/* ── Inline error ── */}
            {err && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {err}
              </Alert>
            )}
          </Stack>
        </Box>
      </Container>

      {/* ─────────── Sticky Action Bar ─────────── */}
      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          bgcolor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid",
          borderColor: "divider",
          py: 1.5,
        }}
      >
        <Container maxWidth="md">
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ alignItems: "center", justifyContent: "space-between" }}
          >
            <Button
              variant="outlined"
              size="large"
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              startIcon={<ArrowBackOutlinedIcon />}
              sx={{ fontWeight: 600, textTransform: "none" }}
            >
              {isMobile ? "ก่อนหน้า" : "ขั้นตอนก่อนหน้า"}
            </Button>

            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              {!isMobile && (
                <Typography variant="caption" color="text.secondary">
                  {activeStep + 1} / {STEPS.length}
                </Typography>
              )}
              {activeStep < STEPS.length - 1 ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleNext}
                  disabled={!stepValid(activeStep)}
                  endIcon={<ArrowForwardOutlinedIcon />}
                  sx={{
                    fontWeight: 700,
                    textTransform: "none",
                    px: { xs: 2.5, sm: 4 },
                    boxShadow: "0 8px 20px rgba(30,58,138,0.22)",
                  }}
                >
                  ถัดไป
                </Button>
              ) : (
                <Button
                  type="submit"
                  onClick={onSubmit}
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={loading || !allValid}
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <HowToRegOutlinedIcon />
                    )
                  }
                  sx={{
                    fontWeight: 700,
                    textTransform: "none",
                    px: { xs: 2.5, sm: 4 },
                    boxShadow: "0 10px 24px rgba(30,58,138,0.25)",
                  }}
                >
                  {loading ? "กำลังสมัคร..." : "ยืนยันสมัครสมาชิก"}
                </Button>
              )}
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Snackbar
        open={success}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={1400}
      >
        <Alert severity="success" variant="filled" sx={{ fontWeight: 600 }}>
          สมัครสมาชิกสำเร็จ กำลังกลับไปยังหน้าเข้าสู่ระบบ...
        </Alert>
      </Snackbar>

      {/* ─────────── Footer link ─────────── */}
      <Container maxWidth="md" sx={{ pt: 2 }}>
        <Divider sx={{ my: 2 }}>หรือ</Divider>
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
      </Container>
    </Box>
  );
}

// ─── Section card primitive ─────────────────────────────────────────────────
function SectionCard({
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

// ─── Member type card ───────────────────────────────────────────────────────
function MemberTypeCard({
  selected,
  icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "2px solid",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "rgba(30,58,138,0.04)" : "background.paper",
        transition: "all .2s",
        position: "relative",
        overflow: "hidden",
        boxShadow: selected ? "0 10px 24px rgba(30,58,138,0.15)" : "none",
      }}
    >
      <CardActionArea onClick={onClick} sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 48,
              height: 48,
              bgcolor: selected ? "primary.main" : "rgba(30,58,138,0.08)",
              color: selected ? "common.white" : "primary.main",
              transition: "all .2s",
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", justifyContent: "space-between" }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              {selected && (
                <CheckCircleRoundedIcon color="primary" fontSize="small" />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

// ─── Review block ───────────────────────────────────────────────────────────
function ReviewBlock({
  title,
  rows,
  onEdit,
}: {
  title: string;
  rows: [string, string][];
  onEdit?: () => void;
}) {
  return (
    <Box>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {onEdit && (
          <Button
            size="small"
            onClick={onEdit}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            แก้ไข
          </Button>
        )}
      </Stack>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "grey.50",
        }}
      >
        <Grid container spacing={1.25}>
          {rows.map(([k, v]) => (
            <Grid size={{ xs: 12, sm: 6 }} key={k}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {k}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
                {v}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
