"use client";

import NextLink from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, type User } from "@/lib/auth";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
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
    user?.role === "instructor"
      ? "วิทยากร"
      : user?.role === "admin"
        ? "ผู้ดูแลระบบ"
        : "ผู้เข้าอบรม";
  const isStaff = user?.role === "instructor" || user?.role === "admin";

  return (
    <AppBar position="sticky" color="inherit" elevation={0}>
      <Toolbar
        sx={{
          maxWidth: "75rem",
          width: "100%",
          mx: "auto",
          px: { xs: 2, sm: 3 },
          minHeight: { xs: 60, sm: 68 },
        }}
      >
        <Box
          component={NextLink}
          href={user ? "/dashboard" : "/"}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "inherit",
            flexGrow: 1,
            minWidth: 0,
          }}
        >
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: "primary.main",
              width: 38,
              height: 38,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: "0.04em",
            }}
          >
            DI
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              DI EQA
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ lineHeight: 1.2, display: { xs: "none", sm: "block" } }}
            >
              ระบบประเมินคุณภาพห้องปฏิบัติการ
            </Typography>
          </Box>
        </Box>

        {user && (
          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            <Box sx={{ textAlign: "right", display: { xs: "none", md: "block" }, mr: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.hospital?.name || ""}
              </Typography>
            </Box>
            <Chip
              label={roleLabel}
              size="small"
              variant="outlined"
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                fontWeight: 600,
                color: isStaff ? "primary.main" : "text.secondary",
                borderColor: isStaff ? "primary.light" : "divider",
                bgcolor: isStaff ? "rgba(30,58,138,0.06)" : "transparent",
              }}
            />

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1 }} />

            {isStaff ? (
              <Button
                component={NextLink}
                href="/admin"
                variant="outlined"
                size="small"
                startIcon={<AdminPanelSettingsOutlinedIcon fontSize="small" />}
                sx={{ display: { xs: "none", sm: "inline-flex" } }}
              >
                แผงควบคุม
              </Button>
            ) : (
              <Button
                component={NextLink}
                href="/dashboard"
                variant="outlined"
                size="small"
                startIcon={<DashboardOutlinedIcon fontSize="small" />}
                sx={{ display: { xs: "none", sm: "inline-flex" } }}
              >
                แดชบอร์ด
              </Button>
            )}

            <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)} aria-label="user menu">
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
                    minWidth: 200,
                    mt: 1,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.25 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {user.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  @{user.username} · {roleLabel}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={onLogout}>
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
