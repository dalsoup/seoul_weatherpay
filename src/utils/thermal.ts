// src/utils/thermal.ts
export function computeTwStull(ta: number, rh: number): number | null {
  try {
    const RH = Math.max(0, Math.min(100, rh)); // 0~100 보정
    const tw =
      ta * Math.atan(0.151977 * Math.sqrt(RH + 8.313659)) +
      Math.atan(ta + RH) -
      Math.atan(RH - 1.67633) +
      0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
      4.686035;
    return Math.round(tw * 1000) / 1000; // 소수 3자리
  } catch {
    return null;
  }
}

export function computeHeatIndexKMA2022(ta: number, rh: number): number | null {
  const tw = computeTwStull(ta, rh);
  if (tw == null || Number.isNaN(tw)) return null;

  const heatIndex =
    -0.2442 +
    0.55399 * tw +
    0.45535 * ta -
    0.0022 * (tw ** 2) +
    0.00278 * tw * ta +
    3.0;

  return Math.round(heatIndex * 10) / 10; // 소수 1자리
}
