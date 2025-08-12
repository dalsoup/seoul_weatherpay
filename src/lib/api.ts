// src/lib/api.ts
export const API_URL =
  import.meta.env.VITE_HEATX_API_URL ?? 'http://localhost:8000';

const API_KEY = import.meta.env.VITE_HEATX_API_KEY as string | undefined;

export type PredictRow = {
  district?: string;
  date?: string;           // YYYY-MM-DD
  TMX: number;
  TMN: number;
  REH: number;
  S: number;
  E: number;
  // 🔑 백엔드 호환: 둘 중 어떤 키를 요구하든 보낼 수 있게 optional로 추가
  '최고체감온도(°C)'?: number;
  '최고체감온도(℃)'?: number;
};

export type PredictResponse = {
  model_version: string;
  items: { index: number; district?: string; date?: string; P_pred: number }[];
};

// 공통 에러 처리
async function handleError(res: Response): Promise<never> {
  const text = await res.text();
  try {
    const j = JSON.parse(text);
    throw new Error(j.detail ? String(j.detail) : text);
  } catch {
    throw new Error(text);
  }
}

export async function predict(rows: PredictRow[]): Promise<PredictResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY) headers['x-api-key'] = API_KEY;

  const res = await fetch(`${API_URL}/predict`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ rows }), // ✅ 받은 rows를 그대로 전송 (추가 키 유지)
  });
  if (!res.ok) return handleError(res);
  return res.json();
}

export async function health() {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) return handleError(res);
  return res.json();
}

export async function version() {
  const res = await fetch(`${API_URL}/version`);
  if (!res.ok) return handleError(res);
  return res.json();
}
