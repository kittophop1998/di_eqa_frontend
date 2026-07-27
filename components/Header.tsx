"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, type User } from "@/lib/auth";
import { Wordmark } from "@/components/ui";
import { accent, paper, chevronCut, hexToRgba, foldShadow } from "@/lib/design";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setUser(auth.getUser());
  }, []);

  const onLogout = () => {
    auth.logout();
    router.push("/");
  };

  const roleLabel =
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "admin"
        ? "ผู้ดูแลระบบ"
        : user?.role === "instructor"
          ? "วิทยากร"
          : "ผู้เข้าอบรม";
  const isStaff =
    user?.role === "super_admin" ||
    user?.role === "admin" ||
    user?.role === "instructor";

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={{ zIndex: 100 }}>
      <Toolbar
        sx={{
          maxWidth: "80rem",
          width: "100%",
          mx: "auto",
          px: { xs: 2, sm: 3 },
          minHeight: { xs: 64, sm: 72 },
          gap: 1,
        }}
      >
        <Box
          component={NextLink}
          href={user ? "/dashboard" : "/"}
          sx={{ display: "flex", alignItems: "center", flexGrow: 1, minWidth: 0 }}
        >
          <Wordmark size={38} />
        </Box>

        {user && (
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Box sx={{ textAlign: "right", display: { xs: "none", md: "block" }, mr: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {user.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.hospital?.name || ""}
              </Typography>
            </Box>

            {/* Role marker — a chevron-cut tag, not a pill. */}
            <Box
              sx={{
                display: { xs: "none", sm: "block" },
                px: 1.5,
                py: 0.5,
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                clipPath: chevronCut(8),
                color: isStaff ? accent.coralInk : paper.steel,
                bgcolor: isStaff ? hexToRgba(accent.coral, 0.14) : hexToRgba(paper.fold, 0.22),
              }}
            >
              {roleLabel}
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1.5 }} />

            <Button
              component={NextLink}
              href={isStaff ? "/admin" : "/dashboard"}
              variant="outlined"
              size="small"
              startIcon={
                isStaff ? (
                  <AdminPanelSettingsOutlinedIcon fontSize="small" />
                ) : (
                  <DashboardOutlinedIcon fontSize="small" />
                )
              }
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              {isStaff ? "แผงควบคุม" : "แดชบอร์ด"}
            </Button>

            <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label="เมนูผู้ใช้">
              <AccountCircleOutlinedIcon />
            </IconButton>
            <Menu
              anchorEl={anchor}
              open={Boolean(anchor)}
              onClose={() => setAnchor(null)}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              slotProps={{
                paper: {
                  sx: {
                    minWidth: 224,
                    mt: 1,
                    border: `1px solid ${paper.crease}`,
                    boxShadow: foldShadow.overlay,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${paper.crease}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {user.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{user.username} · {roleLabel}
                </Typography>
              </Box>
              <MenuItem onClick={onLogout} sx={{ py: 1.25 }}>
                <ListItemIcon>
                  <LogoutOutlinedIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="ออกจากระบบ"
                  slotProps={{ primary: { sx: { color: "error.main", fontWeight: 600 } } }}
                />
              </MenuItem>
            </Menu>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
}
