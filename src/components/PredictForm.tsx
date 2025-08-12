// src/components/PredictForm.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { computeHeatIndexKMA2022 } from '../utils/thermal'
import { predict, type PredictRow } from '../lib/api'

type Props = {
  onResult: (v: number, meta: { district?: string; date?: string }) => void
  /** 대시보드/지도에서 선택된 구를 외부에서 주입 */
  district?: string
  /** 값 변동 시 자동으로 예측 호출 (디바운스 내장) */
  autoPredictOnChange?: boolean
  /** 자동 예측 디바운스(ms) */
  debounceMs?: number
}

export default function PredictForm({
  onResult,
  district,
  autoPredictOnChange = false,
  debounceMs = 350,
}: Props) {
  const [form, setForm] = useState<PredictRow>({
    district: '종로구',
    date: new Date().toISOString().slice(0, 10),
    TMX: 31,
    TMN: 25,
    REH: 74,
    S: 0.55,
    E: 0.45,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)

  // 외부 district 변경 시 동기화 (타입 안전)
  useEffect(() => {
    if (typeof district === 'string' && district.length > 0 && district !== form.district) {
      setForm((p) => ({ ...p, district }))
    }
  }, [district])

  // 입력 핸들러
  const onChange = (k: keyof PredictRow, v: string) =>
    setForm((p) => ({
      ...p,
      [k]: k === 'district' || k === 'date' ? v : Number(v),
    }))

  // 체감온도 계산 (KMA 2022) — 없으면 undefined
  const thi = useMemo(() => {
    const val = computeHeatIndexKMA2022(form.TMX, form.REH)
    return val ?? undefined
  }, [form.TMX, form.REH])

  // 예측 호출
  const callPredict = async () => {
    setLoading(true)
    setError(null)
    try {
      // 안전값: thi가 없으면 TMX 사용, 소수1자리
      const thiSafe = Number(((thi ?? form.TMX) as number).toFixed(1))

      // 🔑 서버 호환 위해 두 키 모두 포함
      const row = {
        ...form,
        '최고체감온도(°C)': thiSafe,
        '최고체감온도(℃)': thiSafe,
      } as PredictRow & Record<'최고체감온도(°C)' | '최고체감온도(℃)', number>

      const res = await predict([row]) // 백엔드: rows 배열
      const item = (res as any)?.items?.[0] ?? (res as any)
      onResult(item?.P_pred ?? 0, { district: item?.district, date: item?.date })
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || '예측 실패'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  // 제출(수동)
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await callPredict()
  }

  // 자동 예측 (디바운스)
  useEffect(() => {
    if (!autoPredictOnChange) return
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return
      void callPredict()
    }, debounceMs)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [autoPredictOnChange, debounceMs, form])

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {(['district','date','TMX','TMN','REH','S','E'] as (keyof PredictRow)[]).map((k) => (
        <label key={k} className="text-sm text-neutral-300 flex flex-col gap-1">
          <span className="capitalize">{k}</span>
          <input
            className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand"
            type={k === 'district' ? 'text' : k === 'date' ? 'date' : 'number'}
            step={k === 'S' || k === 'E' ? '0.01' : '0.1'}
            value={String((form as any)[k])}
            onChange={(e) => onChange(k, e.target.value)}
          />
        </label>
      ))}

      {/* 표시용(읽기전용): 계산된 체감온도 */}
      <div className="col-span-2 md:col-span-1">
        <div className="text-sm text-neutral-300 mb-1">최고체감온도(℃)</div>
        <div className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200">
          {thi !== undefined ? thi.toFixed(1) : '—'}
        </div>
      </div>

      <button
        disabled={loading}
        className="col-span-full mt-1 px-4 py-2 rounded-2xl bg-brand hover:bg-brand-soft transition text-white font-semibold"
        type="submit"
      >
        {loading ? '예측 중…' : '예측하기'}
      </button>

      {error && <div className="col-span-full text-red-400 text-sm">{error}</div>}
    </form>
  )
}