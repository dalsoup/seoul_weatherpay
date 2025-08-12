import { computeHeatIndexKMA2022 } from '../utils/thermal';
import React, { useState } from 'react'
import { predict, type PredictRow } from '../lib/api'

type Props = { onResult: (v: number, meta: {district?: string, date?: string}) => void }

export default function PredictForm({ onResult }: Props) {
  const [form, setForm] = useState<PredictRow>({
    district:'종로구', date: new Date().toISOString().slice(0,10),
    TMX:31, TMN:25, REH:74, S:0.55, E:0.45
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const onChange = (k: keyof PredictRow, v: string) => setForm(p => ({...p, [k]: (k==='district'||k==='date') ? v : Number(v)}))
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null)
    try{
      const res = await predict([form]); const item = res.items[0]
      onResult(item?.P_pred ?? 0, { district: item?.district, date: item?.date })
    }catch(err:any){ setError(err.message || '예측 실패') } finally{ setLoading(false) }
  }
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {(['district','date','TMX','TMN','REH','S','E'] as (keyof PredictRow)[]).map((k)=>(
        <label key={k} className="text-sm text-neutral-300 flex flex-col gap-1">
          <span className="capitalize">{k}</span>
          <input
            className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand"
            type={(k==='district'||k==='date') ? (k==='date'?'date':'text') : 'number'}
            step={(k==='S'||k==='E')?'0.01':'0.1'}
            value={String((form as any)[k])}
            onChange={(e)=>onChange(k, e.target.value)}
          />
        </label>
      ))}
      <button disabled={loading} className="col-span-full mt-1 px-4 py-2 rounded-2xl bg-brand hover:bg-brand-soft transition text-white font-semibold">
        {loading ? '예측 중…' : '예측하기'}
      </button>
      {error && <div className="col-span-full text-red-400 text-sm">{error}</div>}
    </form>
  )
}
