"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

import {
  classifyGesture,
  isFist,
  isPinching,
  isOpenPalm,
  isVictory,
  LM,
  pinchRatio,
  smooth,
  type GestureName,
  type Landmark,
} from "@/lib/handGestures";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Fab from "@mui/material/Fab";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import CloseIcon from "@mui/icons-material/Close";
import PanToolOutlinedIcon from "@mui/icons-material/PanToolOutlined";
import PanToolAltOutlinedIcon from "@mui/icons-material/PanToolAltOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// ─── Config ────────────────────────────────────────────────────────────────
const WASM_BASE_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const PINCH_ON = 0.4;         // หยิกลง
const PINCH_OFF = 0.55;       // ปล่อยหยิก
const SCROLL_GAIN = 6;        // ความเร็วสกรอล
const CURSOR_SMOOTH = 0.45;   // ความ smooth ของ cursor (0=ตามทัน 1=ไม่ขยับ)

// double-pinch: 2 pinch ภายใน X ms → dblclick
const DOUBLE_PINCH_MS = 450;

// swipe: ตรวจ velocity ของ x ปลายนิ้ว (normalized 0–1) ในหน้าต่าง N frames
const SWIPE_WINDOW = 14;      // จำนวน frame ที่เก็บ
const SWIPE_THRESHOLD = 0.18; // ระยะ normalized ที่ถือว่า swipe
const SWIPE_COOLDOWN_MS = 900;

// victory → right-click cooldown
const VICTORY_COOLDOWN_MS = 1200;

type Status = "off" | "requesting" | "loading" | "tracking" | "error";
type SwipeDir = "left" | "right" | null;

// ─── MediaPipe singleton ────────────────────────────────────────────────────
let cachedLandmarker: HandLandmarker | null = null;

async function getHandLandmarker(): Promise<HandLandmarker> {
  if (cachedLandmarker) return cachedLandmarker;
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_URL);
  cachedLandmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    numHands: 1,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  return cachedLandmarker;
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function HandTracker() {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<Status>("off");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [gesture, setGesture] = useState<GestureName>("none");
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [swipeFlash, setSwipeFlash] = useState<SwipeDir>(null);
  const [showGuide, setShowGuide] = useState(false);

  // refs — DOM / stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  // refs — gesture state (ไม่ re-render)
  const cursorRef = useRef<{ x: number; y: number } | null>(null);
  const pinchOnRef = useRef(false);
  const lastPinchTimeRef = useRef(0);
  const palmAnchorRef = useRef<number | null>(null);
  const lastDetectTsRef = useRef(0);
  const victoryCoolRef = useRef(0);
  const swipeCoolRef = useRef(0);
  const xHistRef = useRef<number[]>([]);

  // ─── cleanup ──────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;

    cursorRef.current = null;
    pinchOnRef.current = false;
    palmAnchorRef.current = null;
    xHistRef.current = [];
    setCursor(null);
    setGesture("none");
    setStatus("off");
  }, []);

  // ─── action helpers ───────────────────────────────────────────────────────
  const triggerClick = useCallback((x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return;
    const target =
      (el.closest(
        "a, button, [role='button'], input, select, textarea, [data-hand-clickable]",
      ) as HTMLElement | null) ?? el;
    target.focus?.();
    target.click?.();
  }, []);

  const triggerDblClick = useCallback((x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return;
    const target =
      (el.closest(
        "a, button, [role='button'], input, select, textarea, [data-hand-clickable]",
      ) as HTMLElement | null) ?? el;
    target.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
  }, []);

  const triggerRightClick = useCallback((x: number, y: number) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return;
    el.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
      }),
    );
  }, []);

  const triggerSwipe = useCallback(
    (dir: SwipeDir) => {
      if (!dir) return;
      setSwipeFlash(dir);
      setTimeout(() => setSwipeFlash(null), 700);
      if (dir === "left") history.back();
      if (dir === "right") history.forward();
    },
    [],
  );

  // ─── detect loop ──────────────────────────────────────────────────────────
  const detectLoop = useCallback(
    (landmarker: HandLandmarker) => {
      const tick = () => {
        if (!videoRef.current || !streamRef.current) return;
        const v = videoRef.current;

        if (v.readyState >= 2 && v.currentTime !== lastDetectTsRef.current) {
          lastDetectTsRef.current = v.currentTime;
          let res: HandLandmarkerResult | null = null;
          try {
            res = landmarker.detectForVideo(v, performance.now());
          } catch {
            res = null;
          }

          if (res?.landmarks?.length) {
            const lm = res.landmarks[0] as Landmark[];
            const tip = lm[LM.INDEX_TIP];

            // ── cursor position (mirror X) ──────────────────────────────
            const rawX = (1 - tip.x) * window.innerWidth;
            const rawY = tip.y * window.innerHeight;
            const prev = cursorRef.current;
            const next = prev
              ? { x: smooth(prev.x, rawX, CURSOR_SMOOTH), y: smooth(prev.y, rawY, CURSOR_SMOOTH) }
              : { x: rawX, y: rawY };
            cursorRef.current = next;

            // ── classify current gesture ────────────────────────────────
            const g = classifyGesture(lm);
            setGesture(g);

            // ── fist → hide cursor, skip all actions ────────────────────
            if (isFist(lm)) {
              setCursor(null);
              palmAnchorRef.current = null;
              rafRef.current = requestAnimationFrame(tick);
              return;
            }
            setCursor(next);

            // ── swipe detection (raw x, not mirrored) ──────────────────
            xHistRef.current.push(tip.x);
            if (xHistRef.current.length > SWIPE_WINDOW) xHistRef.current.shift();

            const now = performance.now();
            if (
              xHistRef.current.length === SWIPE_WINDOW &&
              now - swipeCoolRef.current > SWIPE_COOLDOWN_MS
            ) {
              const half = SWIPE_WINDOW / 2;
              const older = xHistRef.current.slice(0, half);
              const newer = xHistRef.current.slice(half);
              const avgOld = older.reduce((a, b) => a + b, 0) / half;
              const avgNew = newer.reduce((a, b) => a + b, 0) / half;
              const dx = avgNew - avgOld;

              // raw x ไม่ mirror: ขยับขวา = dx>0 = มือเลื่อนไปทางขวา
              // หลัง mirror: ขวาในกล้อง = ซ้ายในหน้าจอ = swipe left
              if (dx > SWIPE_THRESHOLD) {
                swipeCoolRef.current = now;
                xHistRef.current = [];
                triggerSwipe("left");
              } else if (dx < -SWIPE_THRESHOLD) {
                swipeCoolRef.current = now;
                xHistRef.current = [];
                triggerSwipe("right");
              }
            }

            // ── victory → right-click ───────────────────────────────────
            if (isVictory(lm) && now - victoryCoolRef.current > VICTORY_COOLDOWN_MS) {
              victoryCoolRef.current = now;
              triggerRightClick(next.x, next.y);
            }

            // ── pinch → click / double-click ────────────────────────────
            const ratio = pinchRatio(lm);
            if (!pinchOnRef.current && ratio < PINCH_ON) {
              pinchOnRef.current = true;
              const timeSinceLast = now - lastPinchTimeRef.current;
              if (timeSinceLast < DOUBLE_PINCH_MS && timeSinceLast > 80) {
                triggerDblClick(next.x, next.y);
                lastPinchTimeRef.current = 0;
              } else {
                triggerClick(next.x, next.y);
                lastPinchTimeRef.current = now;
              }
            } else if (pinchOnRef.current && ratio > PINCH_OFF) {
              pinchOnRef.current = false;
            }

            // ── palm → scroll ────────────────────────────────────────────
            if (isOpenPalm(lm)) {
              const wristY = lm[LM.WRIST].y;
              if (palmAnchorRef.current === null) {
                palmAnchorRef.current = wristY;
              } else {
                const delta = wristY - palmAnchorRef.current;
                const scrollPx = delta * window.innerHeight * SCROLL_GAIN;
                if (Math.abs(scrollPx) > 1) {
                  window.scrollBy({ top: scrollPx, behavior: "auto" });
                  palmAnchorRef.current = wristY;
                }
              }
            } else {
              palmAnchorRef.current = null;
            }
          } else {
            setGesture("none");
            setCursor(null);
            palmAnchorRef.current = null;
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [triggerClick, triggerDblClick, triggerRightClick, triggerSwipe],
  );

  // ─── start ────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    setErrorMsg(null);
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error("ไม่พบ video element");
      }
      video.srcObject = stream;
      await video.play();

      setStatus("loading");
      const landmarker = await getHandLandmarker();

      setStatus("tracking");
      detectLoop(landmarker);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "ไม่สามารถเปิดกล้อง/โหลดโมเดลได้";
      setErrorMsg(msg);
      setStatus("error");
      stop();
    }
  }, [detectLoop, stop]);

  useEffect(() => {
    if (active) start();
    else stop();
    return () => { stop(); };
  }, [active, start, stop]);

  // ─── Display maps ─────────────────────────────────────────────────────────
  const gestureLabel: Record<GestureName, string> = {
    none: "ไม่พบมือ",
    pointer: "ชี้นิ้ว",
    pinch: "หยิก",
    palm: "แบมือ",
    victory: "✌️ Victory",
    fist: "✊ พักมือ",
  };

  const gestureColor: Record<GestureName, string> = {
    none: "#94a3b8",
    pointer: "#3b82f6",
    pinch: "#ef4444",
    palm: "#10b981",
    victory: "#f59e0b",
    fist: "#64748b",
  };

  const guideRows: { icon: string; action: string; result: string }[] = [
    { icon: "👆", action: "ชี้นิ้ว", result: "เลื่อน cursor" },
    { icon: "🤏", action: "หยิก (โป้ง+ชี้)", result: "คลิก" },
    { icon: "🤏🤏", action: "หยิก 2 ครั้งเร็ว", result: "Double-click" },
    { icon: "✌️", action: "Victory (นิ้วชี้+กลาง)", result: "Right-click" },
    { icon: "🖐️", action: "แบมือ + เลื่อนขึ้น/ลง", result: "Scroll" },
    { icon: "👆➡️", action: "กวาดมือขวา→ซ้าย", result: "ย้อนกลับ (back)" },
    { icon: "👆⬅️", action: "กวาดมือซ้าย→ขวา", result: "ไปหน้า (forward)" },
    { icon: "✊", action: "กำมือ", result: "พัก (ซ่อน cursor)" },
  ];

  return (
    <>
      {/* ── FAB toggle ──────────────────────────────────────────────────── */}
      <Tooltip
        title={active ? "ปิดการควบคุมด้วยมือ" : "เปิดการควบคุมด้วยมือ"}
        placement="right"
      >
        <Fab
          size="medium"
          color={active ? "primary" : "default"}
          onClick={() => setActive((v) => !v)}
          sx={{ position: "fixed", left: 16, bottom: 16, zIndex: 2000, boxShadow: 3 }}
          aria-label="hand tracking toggle"
        >
          {active ? <PanToolAltOutlinedIcon /> : <PanToolOutlinedIcon />}
        </Fab>
      </Tooltip>

      {/* ── Panel ───────────────────────────────────────────────────────── */}
      <Box
        sx={{
          position: "fixed",
          left: 16,
          bottom: 80,
          zIndex: 2000,
          width: 250,
          display: active ? "block" : "none",
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: "rgba(15,23,42,0.93)",
          color: "#fff",
          boxShadow: 6,
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* camera preview */}
        <Box sx={{ position: "relative", width: "100%", aspectRatio: "4/3", bgcolor: "#000" }}>
          <Box
            component="video"
            ref={videoRef}
            muted
            playsInline
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scaleX(-1)",
              display: status === "tracking" ? "block" : "none",
            }}
          />
          {status !== "tracking" && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
              }}
            >
              {(status === "requesting" || status === "loading") && (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              )}
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
                {status === "requesting" && "กำลังขอใช้กล้อง..."}
                {status === "loading" && "กำลังโหลดโมเดล..."}
                {status === "error" && "เกิดข้อผิดพลาด"}
                {status === "off" && "ปิดอยู่"}
              </Typography>
            </Box>
          )}

          <IconButton
            size="small"
            onClick={() => setActive(false)}
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.4)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
            }}
            aria-label="close hand tracker"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* gesture status */}
        <Box sx={{ p: 1.25, pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                flexShrink: 0,
                bgcolor: gestureColor[gesture],
                boxShadow: `0 0 8px ${gestureColor[gesture]}`,
                transition: "background-color 120ms",
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>
              {gestureLabel[gesture]}
            </Typography>
            <Tooltip title="วิธีใช้ท่ามือ" placement="right">
              <IconButton
                size="small"
                onClick={() => setShowGuide((v) => !v)}
                sx={{ color: "rgba(255,255,255,0.55)", p: 0.25 }}
                aria-label="show gesture guide"
              >
                <Typography variant="caption" sx={{ fontSize: 14, lineHeight: 1 }}>?</Typography>
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* expandable gesture guide */}
        <Collapse in={showGuide}>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
          <Box sx={{ px: 1.5, py: 1, display: "flex", flexDirection: "column", gap: 0.6 }}>
            {guideRows.map((row) => (
              <Box key={row.action} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ fontSize: 16, lineHeight: 1, width: 24, flexShrink: 0 }}>
                  {row.icon}
                </Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: "#e2e8f0", display: "block", lineHeight: 1.3 }}>
                    {row.action}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", lineHeight: 1.2 }}>
                    → {row.result}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>

      {/* ── virtual cursor ──────────────────────────────────────────────── */}
      {active && cursor && gesture !== "fist" && (
        <Box
          aria-hidden
          sx={{
            position: "fixed",
            left: cursor.x,
            top: cursor.y,
            width: gesture === "pinch" ? 22 : 28,
            height: gesture === "pinch" ? 22 : 28,
            marginLeft: gesture === "pinch" ? "-11px" : "-14px",
            marginTop: gesture === "pinch" ? "-11px" : "-14px",
            borderRadius: "50%",
            border: `3px solid ${gestureColor[gesture]}`,
            backgroundColor:
              gesture === "pinch"
                ? `${gestureColor.pinch}66`
                : gesture === "victory"
                  ? `${gestureColor.victory}33`
                  : "rgba(255,255,255,0.12)",
            boxShadow: `0 0 ${gesture === "pinch" ? "20px" : "12px"} ${gestureColor[gesture]}`,
            pointerEvents: "none",
            zIndex: 2147483647,
            transition:
              "width 80ms, height 80ms, margin 80ms, background-color 80ms linear, border-color 80ms linear, box-shadow 80ms",
          }}
        />
      )}

      {/* ── swipe flash overlay ─────────────────────────────────────────── */}
      {swipeFlash && (
        <Box
          aria-hidden
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483646,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: swipeFlash === "left" ? "flex-start" : "flex-end",
            px: 4,
          }}
        >
          <Chip
            icon={
              swipeFlash === "left" ? (
                <ArrowBackIcon sx={{ color: "#fff !important" }} />
              ) : (
                <ArrowForwardIcon sx={{ color: "#fff !important" }} />
              )
            }
            label={swipeFlash === "left" ? "ย้อนกลับ" : "ไปหน้าถัดไป"}
            sx={{
              bgcolor: "rgba(15,23,42,0.85)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              height: 44,
              px: 1,
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255,255,255,0.15)",
              "& .MuiChip-icon": { ml: 0.5 },
            }}
          />
        </Box>
      )}

      {/* ── error snackbar ──────────────────────────────────────────────── */}
      <Snackbar
        open={Boolean(errorMsg)}
        autoHideDuration={5000}
        onClose={() => setErrorMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ width: "100%" }}>
          เปิด Hand Tracking ไม่สำเร็จ: {errorMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
