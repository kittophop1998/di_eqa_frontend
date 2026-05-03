"use client";

import Link from "next/link";
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

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

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
        ? "ผู้ดูแล"
        : "ผู้เข้าอบรม";

  return (
    <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: "white" }}>

      <Toolbar sx={{ maxWidth: "72rem", width: "100%", mx: "auto", px: 2 }}>
        {/* Logo */}
        <Box
          component={Link}
          href={user ? "/dashboard" : "/"}
          sx={{ display: "flex", alignItems: "center", gap: 1.5, textDecoration: "none", color: "inherit", flexGrow: 1 }}
        >
          <Avatar sx={{ bgcolor: "primary.main", borderRadius: 2, width: 36, height: 36, fontSize: 14, fontWeight: 700 }}>
            DI
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              DI EQA
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
              ระบบประเมินความรู้
            </Typography>
          </Box>
        </Box>

        {/* User section */}
        {user && (
          <Stack direction="row" sx={{ alignItems: "center" }} spacing={1.5}>
            {/* User info */}
            <Box sx={{ textAlign: "right", display: { xs: "none", sm: "block" } }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {user.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.hospital?.name || ""} · {roleLabel}
              </Typography>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {(user.role === "instructor" || user.role === "admin") && (
              <Button
                component={Link}
                href="/admin"
                variant="outlined"
                size="small"
                color="secondary"
              >
                Admin
              </Button>
            )}
            {(user.role !== "instructor" && user.role !== "admin") && (
              <Button
                component={Link}
                href="/dashboard"
                variant="outlined"
                size="small"
                color="secondary"
              >
                Dashboard
              </Button>
            )}
            <Button
              onClick={onLogout}
              variant="contained"
              size="small"
              color="primary"
            >
              ออกจากระบบ
            </Button>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
}
