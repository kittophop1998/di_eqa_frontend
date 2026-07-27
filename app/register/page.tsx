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
import { Eyebrow, Field, FieldShell, PaperCard, Wordmark } from "@/components/ui";
import {
  accent,
  paper,
  fadeUp,
  hexToRgba,
  chevronCut,
  cornerCut,
  foldShadow,
  easing,
  duration,
  tessellation,
} from "@/lib/design";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Snackbar from "@mui/material/Snackbar";
import Autocomplete from "@mui/material/Autocomplete";
import LinearProgress from "@mui/material/LinearProgress";
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
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

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

/**
 * Fields an internal member inherits from their hospital. They are filled in
 * from the hospital record and locked, so a member's organisation/address can
 * never drift away from the hospital it belongs to.
 */
const HOSPITAL_LOCKED_KEYS = [
  "clinic",
  "subDistrict",
  "district",
  "province",
  "postalCode",
] as const;

type HospitalLockedKey = (typeof HOSPITAL_LOCKED_KEYS)[number];

function hospitalDerivedFields(h: Hospital): Pick<FormState, HospitalLockedKey> {
  return {
    clinic: h.name ?? "",
    subDistrict: h.subDistrict ?? "",
    district: h.district ?? "",
    province: h.province ?? "",
    postalCode: h.postalCode ?? "",
  };
}

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

  // Internal members inherit their organisation + address from the hospital
  // record, so those fields are auto-filled and read-only.
  const lockedByHospital = memberType === "internal" && !!hospital;

  useEffect(() => {
    // Restore a previously chosen hospital, preferring the freshly fetched
    // record: a copy cached before hospitals carried address fields would
    // otherwise leave the locked fields blank with no way to fill them.
    const restore = (h: Hospital) => {
      setHospital(h);
      setMemberType("internal");
      setForm((f) => ({ ...f, ...hospitalDerivedFields(h) }));
    };

    setHospitalsLoading(true);
    api<Hospital[]>("/api/hospitals", { auth: false })
      .then((list) => {
        const fresh = list || [];
        setHospitals(fresh);
        const stored = auth.getHospital();
        if (stored) {
          restore(fresh.find((h) => h.id === stored.id || h.code === stored.code) ?? stored);
        }
      })
      .catch(() => {
        const stored = auth.getHospital();
        if (stored) restore(stored);
      })
      .finally(() => setHospitalsLoading(false));
  }, []);

  const set =
    (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  /**
   * Hands the locked fields back to the member. Only values still equal to the
   * hospital's are cleared, so anything they typed themselves survives.
   */
  const releaseHospitalFields = (h: Hospital | null) => {
    if (!h) return;
    const derived = hospitalDerivedFields(h);
    setForm((f) => {
      const next = { ...f };
      for (const k of HOSPITAL_LOCKED_KEYS) {
        if (next[k] === derived[k]) next[k] = "";
      }
      return next;
    });
  };

  const selectMemberType = (value: MemberType) => {
    setErr("");
    setMemberType(value);
    if (value === "external") {
      releaseHospitalFields(hospital);
    } else if (hospital) {
      setForm((f) => ({ ...f, ...hospitalDerivedFields(hospital) }));
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
        minHeight: "100dvh",
        bgcolor: "background.default",
        ...tessellation(paper.ink, 0.014, 96),
        pb: { xs: 14, md: 12 },
      }}
    >
      {/* ─────────── Top bar ─────────── */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          bgcolor: hexToRgba(paper.sheet, 0.92),
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${paper.crease}`,
        }}
      >
        <Container maxWidth="md" sx={{ py: 1.5 }}>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Wordmark size={36} />
            <Button
              component={NextLink}
              href="/login"
              variant="text"
              startIcon={<ArrowBackOutlinedIcon />}
            >
              {isMobile ? "เข้าสู่ระบบ" : "กลับไปเข้าสู่ระบบ"}
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ─────────── Hero ─────────── */}
      <Container maxWidth="md" sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 1, md: 2 } }}>
        <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center", ...fadeUp() }}>
          <Eyebrow>สมัครสมาชิก</Eyebrow>
          <Typography variant="h3" sx={{ fontSize: { xs: "1.625rem", md: "2rem" } }}>
            สร้างบัญชีผู้ใช้งาน DI EQA
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: "58ch", lineHeight: 1.7 }}>
            กรอกข้อมูล 4 ขั้นตอนง่ายๆ เพื่อใช้สำหรับจัดส่งเอกสาร ตัวอย่างทดสอบ
            และออกใบประกาศนียบัตร
          </Typography>
        </Stack>
      </Container>

      {/* ─────────── Step rail ─────────── */}
      <Container maxWidth="md" sx={{ pt: 4 }}>
        <PaperCard sx={{ p: { xs: 2, sm: 2.5 }, mb: 2.5 }}>
          {isMobile ? (
            <Stack spacing={1.25}>
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: accent.coralInk }}>
                  ขั้นตอนที่ {activeStep + 1} / {STEPS.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {STEPS[activeStep].label}
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={progressPct} sx={{ height: 6 }} />
            </Stack>
          ) : (
            <StepRail activeStep={activeStep} stepValid={stepValid} />
          )}
        </PaperCard>
      </Container>

      {/* ─────────── Form ─────────── */}
      <Container maxWidth="md">
        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={2.5}>
            {/* ── Step 0: Member type + hospital ── */}
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
                  <Box sx={{ mt: 3.5 }}>
                    <FieldShell label="เลือกโรงพยาบาลของท่าน" required>
                      <Autocomplete
                        fullWidth
                        options={hospitals}
                        value={hospital}
                        loading={hospitalsLoading}
                        disabled={hospitalsLoading}
                        getOptionLabel={(h) => h.name + (h.province ? ` (${h.province})` : "")}
                        isOptionEqualToValue={(a, b) => a.id === b.id}
                        noOptionsText="ไม่พบโรงพยาบาลที่ค้นหา"
                        loadingText="กำลังโหลดรายชื่อโรงพยาบาล..."
                        onChange={(_, selected) => {
                          if (selected) {
                            auth.setHospital(selected);
                            // Overwrite, don't merge: the locked fields must
                            // always mirror the hospital that is selected now.
                            setForm((f) => ({ ...f, ...hospitalDerivedFields(selected) }));
                          } else {
                            releaseHospitalFields(hospital);
                            auth.clearHospital();
                          }
                          setHospital(selected);
                        }}
                        slotProps={{ listbox: { sx: { maxHeight: 320, py: 0 } } }}
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
                                        <LocalHospitalOutlinedIcon fontSize="small" color="action" />
                                      </InputAdornment>
                                      {inputSlot.startAdornment}
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
                              <Box
                                aria-hidden
                                sx={{
                                  width: 30,
                                  height: 30,
                                  display: "grid",
                                  placeItems: "center",
                                  bgcolor: hexToRgba(accent.coral, 0.12),
                                  color: accent.coralInk,
                                  clipPath: chevronCut(8),
                                  fontSize: 13,
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {h.name.charAt(0)}
                              </Box>
                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }} noWrap>
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
                    </FieldShell>

                    {hospitalsLoading && (
                      <Box className="paper-skeleton" sx={{ height: 3, mt: 1 }} />
                    )}

                    {hospital && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          bgcolor: hexToRgba(accent.sage, 0.22),
                          borderLeft: `3px solid ${accent.sageDeep}`,
                        }}
                      >
                        <CheckRoundedIcon sx={{ color: accent.sageDeep }} />
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
                      </Box>
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
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
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
                    <Field
                      label="นามสกุล"
                      required
                      value={form.lastName}
                      onChange={set("lastName")}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Field
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
                    <Field
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
                    <Field
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
                    {form.password && (
                      <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                        <Stack direction="row" spacing={0.5}>
                          {[0, 1, 2, 3].map((i) => (
                            <Box
                              key={i}
                              sx={{
                                flex: 1,
                                height: 4,
                                bgcolor:
                                  i < passwordStrength ? `${passwordStrengthColor}.main` : paper.crease,
                                transition: `background-color ${duration.hover}ms ${easing}`,
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

            {/* ── Step 2: Org & address ── */}
            {activeStep === 2 && (
              <Stack spacing={2.5}>
                {lockedByHospital && (
                  <Box
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      bgcolor: hexToRgba(accent.sky, 0.22),
                      borderLeft: `3px solid ${accent.skyDeep}`,
                    }}
                  >
                    <LockOutlinedIcon sx={{ color: accent.skyDeep, fontSize: 20, mt: 0.25 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ข้อมูลหน่วยงานและที่อยู่ถูกกำหนดจาก {hospital?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        บุคลากรภายในจะใช้ที่อยู่ของโรงพยาบาลที่สังกัด หากต้องการแก้ไข
                        กรุณาเปลี่ยนโรงพยาบาลในขั้นตอนแรก หรือเลือกเป็นบุคลากรภายนอก
                      </Typography>
                    </Box>
                  </Box>
                )}

                <SectionCard
                  icon={<LocalHospitalOutlinedIcon />}
                  title="ข้อมูลหน่วยงาน"
                  subtitle="ข้อมูลคลินิก / ห้องปฏิบัติการ"
                >
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        label="คลินิก / หน่วยงาน"
                        placeholder="เช่น รพ.ย่านตาขาว"
                        required
                        value={form.clinic}
                        onChange={set("clinic")}
                        disabled={lockedByHospital}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        label="ชื่อห้องปฏิบัติการ"
                        placeholder="เช่น กลุ่มงานเทคนิคการแพทย์"
                        value={form.labName}
                        onChange={set("labName")}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        select
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
                      </Field>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        select
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
                      </Field>
                    </Grid>
                  </Grid>
                </SectionCard>

                <SectionCard
                  icon={<HomeOutlinedIcon />}
                  title="ที่อยู่สำหรับจัดส่ง"
                  subtitle="ใช้สำหรับจัดส่งเอกสารและตัวอย่างทดสอบ"
                >
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        label="ที่อยู่เลขที่"
                        placeholder="เช่น 293"
                        value={form.addressNo}
                        onChange={set("addressNo")}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        label="ตึก ชั้น ซอย ถนน"
                        placeholder="เช่น ม.1"
                        value={form.building}
                        onChange={set("building")}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        label="แขวง / ตำบล"
                        value={form.subDistrict}
                        onChange={set("subDistrict")}
                        disabled={lockedByHospital}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        label="เขต / อำเภอ"
                        value={form.district}
                        onChange={set("district")}
                        disabled={lockedByHospital}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FieldShell label="จังหวัด">
                        <Autocomplete
                          fullWidth
                          disabled={lockedByHospital}
                          options={THAI_PROVINCES}
                          value={form.province || null}
                          onChange={(_, v) => setForm((f) => ({ ...f, province: v ?? "" }))}
                          slotProps={{ listbox: { sx: { maxHeight: 320, py: 0 } } }}
                          renderInput={(params) => (
                            <TextField {...params} placeholder="เลือกจังหวัด" />
                          )}
                        />
                      </FieldShell>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Field
                        label="รหัสไปรษณีย์"
                        placeholder="เช่น 92140"
                        value={form.postalCode}
                        onChange={set("postalCode")}
                        disabled={lockedByHospital}
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
                  <Field
                    select
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
                  </Field>
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
                        ["ประเภท", memberType === "internal" ? "บุคลากรภายใน" : "บุคลากรภายนอก"],
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
                          [
                            form.addressNo,
                            form.building,
                            form.subDistrict,
                            form.district,
                            form.province,
                            form.postalCode,
                          ]
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
            {err && <Alert severity="error">{err}</Alert>}
          </Stack>
        </Box>
      </Container>

      {/* ─────────── Footer link ─────────── */}
      <Container maxWidth="md" sx={{ pt: 4 }}>
        <Box sx={{ borderTop: `1px solid ${paper.crease}`, pt: 3 }}>
          <Typography variant="body2" align="center" color="text.secondary">
            มีบัญชีอยู่แล้ว?{" "}
            <Link component={NextLink} href="/login">
              เข้าสู่ระบบ
            </Link>
          </Typography>
        </Box>
      </Container>

      {/* ─────────── Sticky action bar ─────────── */}
      <Box
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 200,
          bgcolor: hexToRgba(paper.sheet, 0.94),
          backdropFilter: "blur(8px)",
          borderTop: `1px solid ${paper.crease}`,
          boxShadow: foldShadow.lift,
          py: 1.5,
        }}
      >
        <Container maxWidth="md">
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Button
              variant="outlined"
              size="large"
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              startIcon={<ArrowBackOutlinedIcon />}
            >
              {isMobile ? "ก่อนหน้า" : "ขั้นตอนก่อนหน้า"}
            </Button>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              {!isMobile && (
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "var(--font-mono)" }}>
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
                  sx={{ px: { xs: 2.5, sm: 4 } }}
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
                  startIcon={<HowToRegOutlinedIcon />}
                  sx={{ px: { xs: 2.5, sm: 4 } }}
                >
                  {loading ? "กำลังสมัคร..." : "ยืนยันสมัครสมาชิก"}
                </Button>
              )}
            </Stack>
          </Stack>
        </Container>
        {loading && <Box className="paper-skeleton" sx={{ height: 3, mt: 1.5, mb: -1.5 }} />}
      </Box>

      <Snackbar open={success} anchorOrigin={{ vertical: "top", horizontal: "center" }} autoHideDuration={1400}>
        <Alert severity="success" variant="filled" sx={{ fontWeight: 600 }}>
          สมัครสมาชิกสำเร็จ กำลังกลับไปยังหน้าเข้าสู่ระบบ...
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ─── Step rail: numbered facets joined by creases ───────────────────────────
function StepRail({
  activeStep,
  stepValid,
}: {
  activeStep: number;
  stepValid: (step: number) => boolean;
}) {
  return (
    <Stack direction="row" sx={{ alignItems: "flex-start" }}>
      {STEPS.map((s, i) => {
        const done = stepValid(i) && i < activeStep;
        const current = i === activeStep;
        return (
          <Stack
            key={s.label}
            direction="row"
            sx={{ alignItems: "center", flex: i === STEPS.length - 1 ? "0 0 auto" : 1, minWidth: 0 }}
          >
            <Stack spacing={1} sx={{ alignItems: "center", px: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  display: "grid",
                  placeItems: "center",
                  clipPath: chevronCut(9),
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  transition: `background-color ${duration.hover}ms ${easing}`,
                  bgcolor: current ? accent.coral : done ? paper.ink : paper.crease,
                  color: current ? paper.ink : done ? paper.white : paper.steel,
                }}
              >
                {done ? <CheckRoundedIcon sx={{ fontSize: 18 }} /> : i + 1}
              </Box>
              <Typography
                variant="caption"
                noWrap
                sx={{
                  fontWeight: current ? 700 : 500,
                  color: current ? "text.primary" : "text.secondary",
                }}
              >
                {s.label}
              </Typography>
            </Stack>
            {i < STEPS.length - 1 && (
              <Box
                aria-hidden
                sx={{
                  flex: 1,
                  height: 2,
                  mb: 3,
                  minWidth: 12,
                  bgcolor: i < activeStep ? paper.ink : paper.crease,
                }}
              />
            )}
          </Stack>
        );
      })}
    </Stack>
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
    <PaperCard cut={24} sx={{ p: { xs: 2.5, sm: 4 }, ...fadeUp() }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", mb: 3.5 }}>
        <Box
          aria-hidden
          sx={{
            width: 44,
            height: 44,
            display: "grid",
            placeItems: "center",
            bgcolor: hexToRgba(accent.coral, 0.12),
            color: accent.coralInk,
            clipPath: chevronCut(11),
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
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
    </PaperCard>
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
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      sx={{
        width: "100%",
        textAlign: "left",
        cursor: "pointer",
        p: { xs: 2, sm: 2.5 },
        bgcolor: selected ? hexToRgba(accent.coral, 0.07) : paper.sheet,
        border: `1px solid ${selected ? accent.coral : paper.crease}`,
        borderLeft: `3px solid ${selected ? accent.coral : paper.crease}`,
        clipPath: cornerCut(18),
        boxShadow: selected ? foldShadow.lift : foldShadow.rest,
        transition: `background-color ${duration.hover}ms ${easing}, box-shadow ${duration.hover}ms ${easing}, transform ${duration.hover}ms ${easing}`,
        "&:hover": { transform: "translateY(-2px)", boxShadow: foldShadow.lift },
        "&:active": { transform: "translateY(1px)" },
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Box
          aria-hidden
          sx={{
            width: 46,
            height: 46,
            display: "grid",
            placeItems: "center",
            clipPath: chevronCut(11),
            flexShrink: 0,
            bgcolor: selected ? accent.coral : hexToRgba(paper.fold, 0.25),
            color: selected ? paper.ink : paper.steel,
            transition: `background-color ${duration.hover}ms ${easing}`,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {selected && <CheckRoundedIcon sx={{ fontSize: 18, color: accent.coralInk }} />}
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Stack>
    </Box>
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
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.25 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Box aria-hidden sx={{ width: 16, height: 3, bgcolor: accent.coral }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Stack>
        {onEdit && (
          <Button size="small" onClick={onEdit} startIcon={<EditOutlinedIcon fontSize="small" />}>
            แก้ไข
          </Button>
        )}
      </Stack>
      <Box sx={{ p: 2, bgcolor: paper.white, border: `1px solid ${paper.crease}` }}>
        <Grid container spacing={1.5}>
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
