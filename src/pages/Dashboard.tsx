
import React, { useEffect, useState } from 'react'
import { health, version } from '../lib/api'
import PredictForm from '../components/PredictForm'
import ResultCard from '../components/ResultCard'
import MapChoroplethECharts from '../components/MapChoroplethECharts'

const demoData: Record<string, number> = {
  "종로구": 3.2, "중구": 1.5, "용산구": 2.1, "성동구": 0.9, "광진구": 1.7, "동대문구": 2.4,
  "중랑구": 1.1, "성북구": 2.8, "강북구": 0.6, "도봉구": 1.0, "노원구": 2.2, "은평구": 1.9,
  "서대문구": 1.6, "마포구": 2.9, "양천구": 0.7, "강서구": 1.4, "구로구": 1.0, "금천구": 0.8,
  "영등포구": 2.6, "동작구": 1.3, "관악구": 2.0, "서초구": 1.2, "강남구": 3.1, "송파구": 2.7, "강동구": 1.8
}

export default function Dashboard() {
  const [ok, setOk] = useState(false)
  const [modelVersion, setModelVersion] = useState('')
  const [pred, setPred] = useState<number | null>(null)
  const [meta, setMeta] = useState<{district?: string, date?: string}>({})

  useEffect(() => {
    health().then(r => setOk(r.status === 'ok')).catch(()=>setOk(false))
    version().then(v => setModelVersion(v.model_version)).catch(()=>setModelVersion(''))
  }, [])

  return (
    <div className="min-h-screen max-w-[1200px] mx-auto px-6 py-8 font-sans">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand flex items-center justify-center">🌤️</div>
          <div>
            <h1 className="text-xl font-semibold">Seoul Weather Pay</h1>
            <p className="text-xs text-neutral-400">Model: {modelVersion || 'loading…'} · API {ok ? '🟢' : '🔴'}</p>
          </div>
        </div>
        <div className="text-neutral-300 text-sm">
          서울, 대한민국
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <MapChoroplethECharts data={demoData} />
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h2 className="text-lg font-semibold mb-4">예측 입력</h2>
            <PredictForm onResult={(v, m)=>{ setPred(v); setMeta(m) }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ResultCard title="예측 환자 수" value={pred !== null ? `${pred.toFixed(2)} 명` : '—'} hint="HeatX 모델 예측 결과" />
            <ResultCard title="대상" value={meta.district || '—'} hint={meta.date || ''} />
          </div>
        </div>
      </section>
    </div>
  )
}
