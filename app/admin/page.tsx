"use client";

import NextLink from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { auth, type UserRole } from "@/lib/auth";

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
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import LocalHospitalOutlinedIcon from "@mui/icons-material/LocalHospitalOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import LiveTvOutlinedIcon from "@mui/icons-material/LiveTvOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";

// ─── Types ───────────────────────────────────────────────────────────────────

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

type UserItem = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  memberType: string;
  hospitalId?: string;
  hospitalName?: string;
  createdAt: string;
};

type UsersResponse = {
  users: UserItem[];
  total: number;
  page: number;
  limit: number;
};

type AuditLogItem = {
  id: string;
  action: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  targetId?: string;
  targetName?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  createdAt: string;
};

type AuditLogsResponse = {
  logs: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
};

const AUDIT_ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "ทั้งหมด" },
  { value: "user.register", label: "สมัครสมาชิก" },
  { value: "user.role_change", label: "เปลี่ยน Role" },
];

function auditActionLabel(action: string): string {
  switch (action) {
    case "user.register":    return "สมัครสมาชิก";
    case "user.role_change": return "เปลี่ยน Role";
    default:                 return action;
  }
}

function auditActionIcon(action: string) {
  switch (action) {
    case "user.register":    return <PersonAddOutlinedIcon fontSize="small" />;
    case "user.role_change": return <SwapHorizOutlinedIcon fontSize="small" />;
    default:                 return <HistoryOutlinedIcon fontSize="small" />;
  }
}

function auditActionColor(action: string): "default" | "primary" | "warning" | "info" {
  switch (action) {
    case "user.register":    return "info";
    case "user.role_change": return "warning";
    default:                 return "default";
  }
}

function formatAuditTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("th-TH", {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "user", label: "ผู้เข้าอบรม (user)" },
  { value: "admin", label: "ผู้ดูแลระบบ (admin)" },
  { value: "super_admin", label: "Super Admin" },
];

function roleChipColor(role: UserRole): "default" | "primary" | "error" | "warning" {
  switch (role) {
    case "super_admin": return "error";
    case "admin":       return "primary";
    default:            return "default";
  }
}

function roleLabel(role: UserRole): string {
  switch (role) {
    case "super_admin": return "Super Admin";
    case "admin":       return "ผู้ดูแลระบบ";
    case "instructor":  return "วิทยากร";
    default:            return "ผู้เข้าอบรม";
  }
}

// ─── Hospital picker dialog ───────────────────────────────────────────────────

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
        <Typography variant="h5" sx={{ fontWeight: 700 }}>เลือกโรงพยาบาล</Typography>
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
                      primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{h.name}</Typography>}
                      secondary={
                        <Typography variant="caption" color="text.disabled">
                          {h.code}{h.province ? ` · ${h.province}` : ""}
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
        <Button onClick={onCancel} disabled={loading} variant="outlined" color="secondary">ยกเลิก</Button>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole>("user");
  const [tabIndex, setTabIndex] = useState(0);

  // Session management state
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [pendingQuiz, setPendingQuiz] = useState<QuizListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [sessionErr, setSessionErr] = useState("");

  // User management state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchInput, setUserSearchInput] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [userErr, setUserErr] = useState("");
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Audit log state (super_admin only)
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditAction, setAuditAction] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditErr, setAuditErr] = useState("");

  const USER_LIMIT = 20;
  const AUDIT_LIMIT = 50;
  const totalPages = Math.ceil(userTotal / USER_LIMIT);
  const auditTotalPages = Math.ceil(auditTotal / AUDIT_LIMIT);
  const isSuperAdmin = currentRole === "super_admin";

  // ── Initialise ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const u = auth.getUser();
    if (!u) { router.replace("/"); return; }
    const allowedRoles: UserRole[] = ["instructor", "admin", "super_admin"];
    if (!allowedRoles.includes(u.role)) { router.replace("/dashboard"); return; }
    setCurrentRole(u.role);

    loadSessionData();
  }, [router]);

  const loadSessionData = async () => {
    try {
      const [q, s, h] = await Promise.all([
        api<QuizListItem[]>("/api/quizzes"),
        api<Session[]>("/api/sessions/active"),
        api<Hospital[]>("/api/hospitals"),
      ]);
      setQuizzes(q || []);
      setSessions(s || []);
      setHospitals(h || []);
    } catch (e: any) {
      setSessionErr(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    }
  };

  const loadUsers = async (page = userPage, search = userSearch) => {
    setUsersLoading(true);
    setUserErr("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(USER_LIMIT) });
      if (search) params.set("search", search);
      const data = await api<UsersResponse>(`/api/users?${params}`);
      setUsers(data.users || []);
      setUserTotal(data.total || 0);
    } catch (e: any) {
      setUserErr(e?.message || "โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
    } finally {
      setUsersLoading(false);
    }
  };

  // Load users when tab switches to user management (super_admin only)
  useEffect(() => {
    if (tabIndex === 1 && isSuperAdmin) {
      loadUsers(1, "");
    }
  }, [tabIndex, isSuperAdmin]);

  // Audit log loader — defined outside useEffect so we can call it from
  // buttons (refresh / pagination / filter) as well as from initial mount.
  const loadAuditLogs = async (page = auditPage, action = auditAction) => {
    setAuditLoading(true);
    setAuditErr("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(AUDIT_LIMIT) });
      if (action) params.set("action", action);
      const data = await api<AuditLogsResponse>(`/api/audit-logs?${params}`);
      setAuditLogs(data.logs || []);
      setAuditTotal(data.total || 0);
    } catch (e: any) {
      setAuditErr(e?.message || "โหลด audit log ไม่สำเร็จ");
    } finally {
      setAuditLoading(false);
    }
  };

  // Load audit logs on switching to that tab.
  useEffect(() => {
    if (tabIndex === 2 && isSuperAdmin) {
      setAuditPage(1);
      loadAuditLogs(1, auditAction);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabIndex, isSuperAdmin]);

  // ── Session handlers ────────────────────────────────────────────────────────
  const handleConfirmCreate = async (hospital: Hospital) => {
    if (!pendingQuiz) return;
    setCreating(true);
    setSessionErr("");
    try {
      const s = await api<Session>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({ quizId: pendingQuiz.id, hospitalCode: hospital.code }),
      });
      router.push(`/admin/session/${s.id}`);
    } catch (e: any) {
      setSessionErr(e?.message || "สร้างเซสชันไม่สำเร็จ");
    } finally {
      setCreating(false);
      setPendingQuiz(null);
    }
  };

  // ── User management handlers ────────────────────────────────────────────────
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingRole(userId);
    try {
      await api(`/api/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (e: any) {
      setUserErr(e?.message || "เปลี่ยน role ไม่สำเร็จ");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setUserSearch(userSearchInput);
    setUserPage(1);
    loadUsers(1, userSearchInput);
  };

  const handlePageChange = (_: unknown, page: number) => {
    setUserPage(page);
    loadUsers(page, userSearch);
  };

  const handleAuditActionChange = (val: string) => {
    setAuditAction(val);
    setAuditPage(1);
    loadAuditLogs(1, val);
  };

  const handleAuditPageChange = (_: unknown, page: number) => {
    setAuditPage(page);
    loadAuditLogs(page, auditAction);
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

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 }, px: { xs: 2, sm: 3 } }}>
        {/* Page heading */}
        <Box sx={{ mb: { xs: 2.5, md: 4 } }}>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>
            แผงควบคุม
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mt: 0.5,
              fontSize: { xs: "1.75rem", sm: "2.25rem", md: "3rem" },
              lineHeight: 1.2,
            }}
          >
            Admin Panel
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 0.5, fontSize: { xs: "0.9rem", sm: "1rem" } }}
          >
            {isSuperAdmin
              ? "จัดการเซสชัน ข้อสอบ และสิทธิ์ผู้ใช้งานระบบ"
              : "สร้างเซสชันสด เปิดข้อสอบให้ผู้เข้าอบรมพร้อมกัน"}
          </Typography>
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            mb: { xs: 2.5, md: 4 },
            borderBottom: "1px solid",
            borderColor: "divider",
            "& .MuiTabs-indicator": { height: 3, borderRadius: 2 },
          }}
        >
          <Tab
            label="จัดการเซสชัน"
            icon={<QuizOutlinedIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: 48, textTransform: "none", fontWeight: 600 }}
          />
          {isSuperAdmin && (
            <Tab
              label="จัดการผู้ใช้"
              icon={<PeopleOutlinedIcon fontSize="small" />}
              iconPosition="start"
              sx={{ minHeight: 48, textTransform: "none", fontWeight: 600 }}
            />
          )}
          {isSuperAdmin && (
            <Tab
              label="Audit Log"
              icon={<HistoryOutlinedIcon fontSize="small" />}
              iconPosition="start"
              sx={{ minHeight: 48, textTransform: "none", fontWeight: 600 }}
            />
          )}
        </Tabs>

        {/* ─── Tab 0: Session management ─────────────────────────────────── */}
        {tabIndex === 0 && (
          <>
            {sessionErr && <Alert severity="error" sx={{ mb: 3 }}>{sessionErr}</Alert>}

            <Box sx={{ mb: 5 }}>
              <SectionHeading icon={<QuizOutlinedIcon />} title="เลือกข้อสอบเพื่อสร้างเซสชัน" />
              <Grid container spacing={2}>
                {quizzes.map((q) => (
                  <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={q.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Chip
                          size="small"
                          label={q.category}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 1.5 }}>
                          {q.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                          {q.cellCount} เซลล์ · {Math.floor(q.durationSec / 60)} นาที · ผ่าน {q.passPercent || 80}%
                        </Typography>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          startIcon={<LocalHospitalOutlinedIcon />}
                          onClick={() => { setSessionErr(""); setPendingQuiz(q); }}
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
                          <Typography variant="caption" color="text.secondary">รหัสเซสชัน</Typography>
                          <Typography
                            variant="h6"
                            sx={{ fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.08em" }}
                          >
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
          </>
        )}

        {/* ─── Tab 1: User management (super_admin only) ─────────────────── */}
        {tabIndex === 1 && isSuperAdmin && (
          <UserManagementPanel
            users={users}
            loading={usersLoading}
            err={userErr}
            totalPages={totalPages}
            page={userPage}
            searchInput={userSearchInput}
            onSearchInputChange={setUserSearchInput}
            onSearch={handleUserSearch}
            onPageChange={handlePageChange}
            onRoleChange={handleRoleChange}
            onRefresh={() => loadUsers(userPage, userSearch)}
            updatingRole={updatingRole}
          />
        )}

        {/* ─── Tab 2: Audit Log (super_admin only) ───────────────────────── */}
        {tabIndex === 2 && isSuperAdmin && (
          <AuditLogPanel
            logs={auditLogs}
            loading={auditLoading}
            err={auditErr}
            totalPages={auditTotalPages}
            page={auditPage}
            action={auditAction}
            onActionChange={handleAuditActionChange}
            onPageChange={handleAuditPageChange}
            onRefresh={() => loadAuditLogs(auditPage, auditAction)}
          />
        )}
      </Container>
    </Box>
  );
}

// ─── User Management Panel ────────────────────────────────────────────────────

function UserManagementPanel({
  users,
  loading,
  err,
  totalPages,
  page,
  searchInput,
  onSearchInputChange,
  onSearch,
  onPageChange,
  onRoleChange,
  onRefresh,
  updatingRole,
}: {
  users: UserItem[];
  loading: boolean;
  err: string;
  totalPages: number;
  page: number;
  searchInput: string;
  onSearchInputChange: (v: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onPageChange: (e: unknown, page: number) => void;
  onRoleChange: (userId: string, role: UserRole) => void;
  onRefresh: () => void;
  updatingRole: string | null;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box>
      <SectionHeading icon={<PeopleOutlinedIcon />} title="จัดการผู้ใช้งาน" />

      {/* Search bar */}
      <Box component="form" onSubmit={onSearch} sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ alignItems: { sm: "center" } }}
        >
          <TextField
            size="small"
            fullWidth
            placeholder="ค้นหาชื่อ / username / อีเมล..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ flexGrow: 1, maxWidth: { sm: 400 } }}
          />
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Button
              type="submit"
              variant="contained"
              size="small"
              sx={{ flexGrow: { xs: 1, sm: 0 } }}
            >
              ค้นหา
            </Button>
            <Tooltip title="รีเฟรช">
              <IconButton size="small" onClick={onRefresh}>
                <RefreshOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      {/* Mobile: card list / Desktop: table */}
      {isMobile ? (
        <Stack spacing={1.5}>
          {loading ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : users.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 4, textAlign: "center", borderRadius: 2, color: "text.disabled" }}
            >
              <Typography variant="body2">ไม่พบรายชื่อผู้ใช้</Typography>
            </Paper>
          ) : (
            users.map((u) => (
              <Paper
                key={u.id}
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, bgcolor: "background.paper" }}
              >
                <Stack spacing={1.25}>
                  {/* Header: avatar + name + role chip */}
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "rgba(30,58,138,0.08)",
                        color: "primary.main",
                        fontWeight: 700,
                        fontSize: 16,
                      }}
                    >
                      {(u.fullName || u.username || "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                        {u.fullName || "—"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        @{u.username}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={roleLabel(u.role)}
                      color={roleChipColor(u.role)}
                      sx={{ fontWeight: 600, fontSize: 11, flexShrink: 0 }}
                    />
                  </Stack>

                  {/* Info rows */}
                  <Stack spacing={0.5} sx={{ pl: 0.25 }}>
                    <InfoRow label="อีเมล" value={u.email || "—"} mono />
                    <InfoRow label="โรงพยาบาล" value={u.hospitalName || "—"} />
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ alignItems: "center", flexWrap: "wrap" }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ minWidth: 80 }}
                      >
                        ประเภท
                      </Typography>
                      <Chip
                        size="small"
                        label={
                          u.memberType === "external"
                            ? "ภายนอก"
                            : u.memberType === "internal"
                            ? "ภายใน"
                            : "—"
                        }
                        variant="outlined"
                        sx={{ fontSize: 11, height: 22 }}
                      />
                    </Stack>
                  </Stack>

                  <Divider />

                  {/* Role change */}
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", justifyContent: "space-between" }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      เปลี่ยน Role
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Select
                        size="small"
                        value={u.role}
                        disabled={updatingRole === u.id}
                        onChange={(e) => onRoleChange(u.id, e.target.value as UserRole)}
                        sx={{ fontSize: 12, minWidth: 160 }}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13 }}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {updatingRole === u.id && <CircularProgress size={16} />}
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: 700 }}>ชื่อ-นามสกุล / Username</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>อีเมล</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>โรงพยาบาล</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ประเภท</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>วันที่สมัคร</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>Role</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      sx={{ textAlign: "center", py: 6, color: "text.disabled" }}
                    >
                      ไม่พบรายชื่อผู้ใช้
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {u.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{u.username}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{u.email || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{u.hospitalName || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={
                            u.memberType === "external"
                              ? "ภายนอก"
                              : u.memberType === "internal"
                              ? "ภายใน"
                              : "—"
                          }
                          variant="outlined"
                          sx={{ fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{u.createdAt}</Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                          <Chip
                            size="small"
                            label={roleLabel(u.role)}
                            color={roleChipColor(u.role)}
                            sx={{ fontWeight: 600, fontSize: 11 }}
                          />
                          <Select
                            size="small"
                            value={u.role}
                            disabled={updatingRole === u.id}
                            onChange={(e) => onRoleChange(u.id, e.target.value as UserRole)}
                            sx={{ fontSize: 12, minWidth: 130 }}
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: 13 }}>
                                {opt.label}
                              </MenuItem>
                            ))}
                          </Select>
                          {updatingRole === u.id && <CircularProgress size={16} />}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Stack sx={{ mt: 3, alignItems: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={onPageChange}
            color="primary"
            shape="rounded"
            size={isMobile ? "small" : "medium"}
          />
        </Stack>
      )}
    </Box>
  );
}

// ─── Audit Log Panel ─────────────────────────────────────────────────────────

function AuditLogPanel({
  logs,
  loading,
  err,
  totalPages,
  page,
  action,
  onActionChange,
  onPageChange,
  onRefresh,
}: {
  logs: AuditLogItem[];
  loading: boolean;
  err: string;
  totalPages: number;
  page: number;
  action: string;
  onActionChange: (v: string) => void;
  onPageChange: (e: unknown, page: number) => void;
  onRefresh: () => void;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box>
      <SectionHeading icon={<HistoryOutlinedIcon />} title="บันทึกการเปลี่ยนแปลง (Audit Log)" />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        บันทึกกิจกรรมสำคัญในระบบ เช่น การสมัครสมาชิกใหม่ และการเปลี่ยน role ของผู้ใช้
      </Typography>

      {/* Toolbar */}
      <Stack
        direction={{ xs: "row", sm: "row" }}
        spacing={1}
        sx={{ mb: 3, alignItems: "center" }}
      >
        <Select
          size="small"
          fullWidth
          value={action}
          onChange={(e) => onActionChange(String(e.target.value))}
          sx={{ minWidth: { sm: 200 }, fontSize: 13, maxWidth: { sm: 280 } }}
        >
          {AUDIT_ACTION_OPTIONS.map((opt) => (
            <MenuItem key={opt.value || "all"} value={opt.value} sx={{ fontSize: 13 }}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
        <Tooltip title="รีเฟรช">
          <IconButton size="small" onClick={onRefresh}>
            <RefreshOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      {/* Mobile: card list / Desktop: table */}
      {isMobile ? (
        <Stack spacing={1.5}>
          {loading ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <CircularProgress size={28} />
            </Box>
          ) : logs.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 4, textAlign: "center", borderRadius: 2, color: "text.disabled" }}
            >
              <Typography variant="body2">ยังไม่มีข้อมูล audit log</Typography>
            </Paper>
          ) : (
            logs.map((l) => (
              <Paper
                key={l.id}
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, bgcolor: "background.paper" }}
              >
                <Stack spacing={1.25}>
                  {/* Header: action chip + time */}
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Chip
                      size="small"
                      icon={auditActionIcon(l.action)}
                      label={auditActionLabel(l.action)}
                      color={auditActionColor(l.action)}
                      sx={{ fontWeight: 600, fontSize: 11 }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {formatAuditTime(l.createdAt)}
                    </Typography>
                  </Stack>

                  <Divider />

                  {/* Actor → Target */}
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        ผู้กระทำ
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                        {l.actorName || "—"}
                      </Typography>
                      {l.actorRole && (
                        <Typography variant="caption" color="text.secondary">
                          {roleLabel(l.actorRole as UserRole)}
                        </Typography>
                      )}
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        เป้าหมาย
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                        {l.targetName || "—"}
                      </Typography>
                      {l.metadata?.username && (
                        <Typography variant="caption" color="text.secondary">
                          @{String(l.metadata.username)}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>

                  {/* Details */}
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                      รายละเอียด
                    </Typography>
                    <AuditLogDetails action={l.action} metadata={l.metadata} />
                  </Box>

                  {/* IP */}
                  {l.ip && (
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
                        IP
                      </Typography>
                      <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                        {l.ip}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>เวลา</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>ประเภท</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ผู้กระทำ</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>เป้าหมาย</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>รายละเอียด</TableCell>
                  <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>IP</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: "center", py: 6 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      sx={{ textAlign: "center", py: 6, color: "text.disabled" }}
                    >
                      ยังไม่มีข้อมูล audit log
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((l) => (
                    <TableRow key={l.id} hover>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {formatAuditTime(l.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={auditActionIcon(l.action)}
                          label={auditActionLabel(l.action)}
                          color={auditActionColor(l.action)}
                          sx={{ fontWeight: 600, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {l.actorName || "—"}
                        </Typography>
                        {l.actorRole && (
                          <Typography variant="caption" color="text.secondary">
                            {roleLabel(l.actorRole as UserRole)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{l.targetName || "—"}</Typography>
                        {l.metadata?.username && (
                          <Typography variant="caption" color="text.secondary">
                            @{String(l.metadata.username)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <AuditLogDetails action={l.action} metadata={l.metadata} />
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="caption" sx={{ fontFamily: "monospace" }}>
                          {l.ip || "—"}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Stack sx={{ mt: 3, alignItems: "center" }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={onPageChange}
            color="primary"
            shape="rounded"
            size={isMobile ? "small" : "medium"}
          />
        </Stack>
      )}
    </Box>
  );
}

// ─── Small info row helper used in mobile user cards ─────────────────────────
function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", flexWrap: "wrap" }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontFamily: mono ? "monospace" : undefined,
          wordBreak: "break-word",
          flex: 1,
          minWidth: 0,
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

// AuditLogDetails renders an action-specific summary so super-admins can see
// the most important fact (e.g. "user → admin") without expanding metadata.
function AuditLogDetails({
  action,
  metadata,
}: {
  action: string;
  metadata?: Record<string, any>;
}) {
  if (!metadata) {
    return <Typography variant="body2" color="text.disabled">—</Typography>;
  }

  if (action === "user.role_change") {
    const oldRole = metadata.oldRole as UserRole | undefined;
    const newRole = metadata.newRole as UserRole | undefined;
    return (
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        {oldRole && (
          <Chip size="small" label={roleLabel(oldRole)} variant="outlined" sx={{ fontSize: 11 }} />
        )}
        <Typography variant="caption" color="text.secondary">→</Typography>
        {newRole && (
          <Chip
            size="small"
            label={roleLabel(newRole)}
            color={roleChipColor(newRole)}
            sx={{ fontWeight: 600, fontSize: 11 }}
          />
        )}
      </Stack>
    );
  }

  if (action === "user.register") {
    const memberType = metadata.memberType as string | undefined;
    const hospitalName = metadata.hospitalName as string | undefined;
    return (
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Chip
          size="small"
          label={memberType === "external" ? "ภายนอก" : "ภายใน"}
          variant="outlined"
          sx={{ fontSize: 11 }}
        />
        {hospitalName && (
          <Typography variant="caption" color="text.secondary">
            {hospitalName}
          </Typography>
        )}
      </Stack>
    );
  }

  return (
    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
      {JSON.stringify(metadata)}
    </Typography>
  );
}

// ─── Section Heading ──────────────────────────────────────────────────────────

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
      <Typography variant="h5" sx={{ fontWeight: 700 }}>{title}</Typography>
    </Stack>
  );
}
