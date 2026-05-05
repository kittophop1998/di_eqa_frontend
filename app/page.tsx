"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LoginOutlinedIcon from "@mui/icons-material/LoginOutlined";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (auth.isAuthed()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <Box
      component="main"
      sx={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        bgcolor: "#0F172A",
      }}
    >
      <Image
        src="/images/Bandner.png"
        alt="DI EQA Banner"
        fill
        priority
        style={{ objectFit: "cover", objectPosition: "center", opacity: 0.85 }}
      />

      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.35) 50%, rgba(15,23,42,0.85) 100%)",
        }}
      />

      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
          textAlign: "center",
          pb: { xs: 10, md: 14 },
          color: "common.white",
          px: 3,
        }}
      >
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <Typography
            variant="overline"
            sx={{ color: "#93C5FD", letterSpacing: "0.32em", fontWeight: 700 }}
          >
            DI EQA · External Quality Assessment
          </Typography>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              fontSize: { xs: "2.25rem", md: "3.25rem" },
              textShadow: "0 2px 20px rgba(0,0,0,0.4)",
            }}
          >
            ระบบประเมินคุณภาพห้องปฏิบัติการ
          </Typography>
          <Typography
            variant="body1"
            sx={{
              maxWidth: 640,
              color: "rgba(255,255,255,0.86)",
              fontSize: { xs: "1rem", md: "1.125rem" },
              textShadow: "0 1px 10px rgba(0,0,0,0.4)",
            }}
          >
            แพลตฟอร์มกลางสำหรับการอบรมและประเมินความรู้ของบุคลากรห้องปฏิบัติการทางการแพทย์
            ทำข้อสอบออนไลน์ ได้ผลทันที พร้อมใบประกาศนียบัตรอย่างเป็นทางการ
          </Typography>

          <Button
            onClick={() => router.push("/login")}
            variant="contained"
            color="primary"
            size="large"
            endIcon={<LoginOutlinedIcon />}
            sx={{
              mt: 4,
              px: 5,
              py: 1.6,
              fontSize: "1.05rem",
              borderRadius: 2,
              boxShadow: "0 18px 40px rgba(30,64,175,0.45)",
            }}
          >
            เข้าสู่ระบบ
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
