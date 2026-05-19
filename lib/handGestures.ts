export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type GestureName =
  | "none"
  | "pointer"
  | "pinch"
  | "palm"
  | "victory"
  | "fist";

/**
 * MediaPipe HandLandmarker คืน 21 จุดต่อมือหนึ่งข้าง
 * 0 = wrist, 1-4 = thumb, 5-8 = index, 9-12 = middle,
 * 13-16 = ring, 17-20 = pinky
 * ดู: https://developers.google.com/mediapipe/solutions/vision/hand_landmarker
 */
export const LM = {
  WRIST: 0,
  THUMB_TIP: 4,
  THUMB_IP: 3,
  THUMB_MCP: 2,
  INDEX_TIP: 8,
  INDEX_PIP: 6,
  INDEX_MCP: 5,
  MIDDLE_TIP: 12,
  MIDDLE_PIP: 10,
  MIDDLE_MCP: 9,
  RING_TIP: 16,
  RING_PIP: 14,
  RING_MCP: 13,
  PINKY_TIP: 20,
  PINKY_PIP: 18,
  PINKY_MCP: 17,
} as const;

function dist2D(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/** ระยะอ้างอิงของมือ ใช้ normalize ทุกระยะเทียบขนาดมือ */
export function handScale(lm: Landmark[]): number {
  return dist2D(lm[LM.WRIST], lm[LM.MIDDLE_MCP]) || 1;
}

/** หยิกนิ้ว (โป้งแตะชี้) — ใช้สำหรับ "คลิก" */
export function pinchRatio(lm: Landmark[]): number {
  return dist2D(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]) / handScale(lm);
}

export function isPinching(lm: Landmark[], threshold = 0.45): boolean {
  return pinchRatio(lm) < threshold;
}

/** ตรวจว่านิ้วนั้นเหยียดขึ้นหรือไม่ (เทียบ tip vs pip ตามแกน Y) */
function fingerUp(tip: Landmark, pip: Landmark): boolean {
  return tip.y < pip.y;
}

/** นับจำนวนนิ้วที่เหยียดขึ้น (ไม่รวมโป้ง) */
export function extendedFingerCount(lm: Landmark[]): number {
  let count = 0;
  if (fingerUp(lm[LM.INDEX_TIP], lm[LM.INDEX_PIP])) count++;
  if (fingerUp(lm[LM.MIDDLE_TIP], lm[LM.MIDDLE_PIP])) count++;
  if (fingerUp(lm[LM.RING_TIP], lm[LM.RING_PIP])) count++;
  if (fingerUp(lm[LM.PINKY_TIP], lm[LM.PINKY_PIP])) count++;
  return count;
}

/** ตรวจว่าโป้งเหยียดออกด้านข้าง */
function thumbExtended(lm: Landmark[]): boolean {
  return (
    dist2D(lm[LM.THUMB_TIP], lm[LM.THUMB_MCP]) >
    dist2D(lm[LM.THUMB_IP], lm[LM.THUMB_MCP]) * 1.2
  );
}

/** แบมือ (≥4 นิ้วเหยียด) — ใช้สำหรับ "เลื่อนหน้าจอ" */
export function isOpenPalm(lm: Landmark[]): boolean {
  return extendedFingerCount(lm) >= 4;
}

/**
 * Victory / V sign (✌️)
 * นิ้วชี้ + กลางเหยียด, นิ้วนาง + ก้อยพับ, โป้งพับ
 * ใช้สำหรับ right-click
 */
export function isVictory(lm: Landmark[]): boolean {
  const indexUp = fingerUp(lm[LM.INDEX_TIP], lm[LM.INDEX_PIP]);
  const middleUp = fingerUp(lm[LM.MIDDLE_TIP], lm[LM.MIDDLE_PIP]);
  const ringDown = !fingerUp(lm[LM.RING_TIP], lm[LM.RING_PIP]);
  const pinkyDown = !fingerUp(lm[LM.PINKY_TIP], lm[LM.PINKY_PIP]);
  const thumbDown = !thumbExtended(lm);
  return indexUp && middleUp && ringDown && pinkyDown && thumbDown;
}

/**
 * Fist (✊) — กำมือ
 * นิ้วทั้งสี่พับ (extendedFingerCount ≤ 1) และโป้งพับ
 * ใช้สำหรับพัก — ซ่อน cursor
 */
export function isFist(lm: Landmark[]): boolean {
  return extendedFingerCount(lm) <= 1 && !thumbExtended(lm);
}

/** สรุปท่ามือออกเป็น gesture หลักเพื่อใช้งาน */
export function classifyGesture(lm: Landmark[]): GestureName {
  if (isFist(lm)) return "fist";
  if (isPinching(lm)) return "pinch";
  if (isVictory(lm)) return "victory";
  if (isOpenPalm(lm)) return "palm";
  return "pointer";
}

/** Exponential smoothing สำหรับลด jitter ของ cursor */
export function smooth(prev: number, next: number, alpha = 0.4): number {
  return prev + (next - prev) * alpha;
}
