// SeoulMap.tsx — final
import { useEffect, useRef, useState } from 'react'

// ✅ echarts는 core만 사용 (단일 인스턴스)
import * as echarts from 'echarts/core'
import { MapChart } from 'echarts/charts'
import { TooltipComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
echarts.use([MapChart, TooltipComponent, VisualMapComponent, CanvasRenderer])

// ✅ 래퍼도 core 버전 사용
import ReactEChartsCore from 'echarts-for-react/lib/core'

export default function SeoulMap() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const optionRef = useRef<any>(null) // 옵션을 ref에 보관 (리렌더 최소화)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch(`/seoul_districts.geojson?v=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) throw new Error(`GeoJSON HTTP ${res.status}`)
        const geojson = await res.json()
        if (cancelled) return

        // 1) 지도 등록 (한 번만)
        echarts.registerMap('seoul', geojson)

        // 2) 옵션 구성 — nameProperty: 'sggnm' (구 이름 키)
        optionRef.current = {
          tooltip: { trigger: 'item' },
          visualMap: { min: 0, max: 100, calculable: true },
          series: [
            {
              type: 'map',
              map: 'seoul',
              nameProperty: 'sggnm', // GeoJSON의 구 이름 키
              emphasis: { label: { show: true } },
              data: [
                { name: '종로구', value: 20 },
                { name: '중구', value: 15 },
                // 필요 시 실제 데이터로 교체
              ],
            },
          ],
        }

        setReady(true)
      } catch (e: any) {
        console.error('[SeoulMap] failed to load map:', e)
        setError(e?.message ?? 'Map load failed')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <div style={{ height: 520, display: 'grid', placeItems: 'center', color: '#f87171' }}>
        지도 로딩 실패 — {error}
      </div>
    )
  }

  if (!ready) {
    return (
      <div style={{ height: 520, display: 'grid', placeItems: 'center' }}>
        Loading map…
      </div>
    )
  }

  return (
    <ReactEChartsCore
      echarts={echarts}     // ✅ 같은 인스턴스 주입
      option={optionRef.current}
      notMerge
      lazyUpdate
      style={{ height: 520 }}
    />
  )
}
