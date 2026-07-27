"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { Eyebrow, Tessellation, Wordmark } from "@/components/ui";
import { accent, paper, fadeUp, hexToRgba } from "@/lib/design";

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
        minHeight: "100dvh",
        bgcolor: paper.ink,
        color: paper.white,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
      }}
    >
      {/* ─── Left: the folded sheet ─── */}
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 6,
          px: { xs: 3, sm: 6, lg: 9 },
          py: { xs: 5, md: 7 },
          minHeight: { xs: "auto", md: "100dvh" },
          order: { xs: 2, md: 1 },
          overflow: "hidden",
        }}
      >
        <Tessellation color={paper.white} alpha={0.03} size={88} />

        {/* A plane of the same sheet, folded back to catch more light. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: { xs: 200, md: 340 },
            height: { xs: 200, md: 340 },
            bgcolor: hexToRgba(paper.white, 0.05),
            clipPath: "polygon(0 100%, 0 0, 100% 100%)",
          }}
        />

        <Box sx={{ position: "relative", ...fadeUp(0) }}>
          <Wordmark size={42} onDark caption="External Quality Assessment" />
        </Box>

        <Stack spacing={3} sx={{ position: "relative", maxWidth: 620, py: { xs: 4, md: 0 } }}>
          <Box sx={fadeUp(1)}>
            <Eyebrow onDark>DI EQA · External Quality Assessment</Eyebrow>
          </Box>

          <Typography variant="h1" sx={{ ...fadeUp(2) }}>
            ระบบประเมิน
            <Box component="br" />
            คุณภาพ
            <Box component="span" sx={{ color: accent.coral }}>
              ห้องปฏิบัติการ
            </Box>
          </Typography>

          <Typography
            variant="body1"
            sx={{
              maxWidth: "62ch",
              color: hexToRgba(paper.white, 0.72),
              fontSize: { xs: "1rem", md: "1.0625rem" },
              lineHeight: 1.7,
              ...fadeUp(3),
            }}
          >
            แพลตฟอร์มกลางสำหรับการอบรมและประเมินความรู้ของบุคลากรห้องปฏิบัติการทางการแพทย์
            ทำข้อสอบออนไลน์ ได้ผลทันที พร้อมใบประกาศนียบัตรอย่างเป็นทางการ
          </Typography>

          <Box sx={{ pt: 1, ...fadeUp(4) }}>
            <Button
              onClick={() => router.push("/login")}
              variant="contained"
              color="primary"
              size="large"
              endIcon={<LoginOutlinedIcon />}
              sx={{ px: 5, py: 1.75, fontSize: "1.0625rem" }}
            >
              เข้าสู่ระบบ
            </Button>
          </Box>
        </Stack>

        <Typography
          variant="caption"
          sx={{ position: "relative", color: hexToRgba(paper.white, 0.42), letterSpacing: "0.04em" }}
        >
          © {new Date().getFullYear()} DI EQA · All rights reserved.
        </Typography>
      </Box>

      {/* ─── Right: the visual plane, sliced at the crease ─── */}
      <Box
        sx={{
          position: "relative",
          order: { xs: 1, md: 2 },
          minHeight: { xs: 280, sm: 340, md: "100dvh" },
          overflow: "hidden",
          // The fold where the two planes meet.
          clipPath: {
            xs: "polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 48px))",
            md: "polygon(72px 0, 100% 0, 100% 100%, 0 100%)",
          },
        }}
      >
        <Image
          src="/images/Bandner.png"
          alt="ห้องปฏิบัติการทางการแพทย์"
          fill
          priority
          sizes="(max-width: 900px) 100vw, 50vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        {/* Ink wash so the plane reads as the same sheet, not a photo drop-in. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(200deg, ${hexToRgba(paper.ink, 0.15)} 0%, ${hexToRgba(
              paper.ink,
              0.55,
            )} 100%)`,
          }}
        />
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: { xs: 90, md: 150 },
            height: { xs: 90, md: 150 },
            bgcolor: hexToRgba(accent.sky, 0.22),
            clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
          }}
        />
      </Box>
    </Box>
  );
}
