
export const API_URL = import.meta.env.VITE_HEATX_API_URL ?? 'http://localhost:8000';

export type PredictRow = {
  district?: string; date?: string;
  TMX: number; TMN: number; REH: number; S: number; E: number;
}
export type PredictResponse = {
  model_version: string;
  items: { index: number; district?: string; date?: string; P_pred: number }[]
}

export async function predict(rows: PredictRow[]): Promise<PredictResponse> {
  const res = await fetch(`${API_URL}/predict`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows })
  })
  if(!res.ok){ throw new Error(await res.text()) }
  return res.json()
}
export async function health(){ return (await fetch(`${API_URL}/health`)).json() }
export async function version(){ return (await fetch(`${API_URL}/version`)).json() }
