// MapChoroplethECharts.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { TooltipComponent, VisualMapComponent } from 'echarts/components'
import { MapChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
echarts.use([TooltipComponent, VisualMapComponent, MapChart, CanvasRenderer])

type Props = { data: Record<string, number>; height?: number }

export default function MapChoroplethECharts({ data, height = 380 }: Props) {
  const [ready, setReady] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await fetch('/seoul_districts.geojson', { cache: 'no-store', signal: ac.signal })
        if (!res.ok) throw new Error(`GeoJSON HTTP ${res.status}`)
        const gj = await res.json()
        if (!mounted.current) return
        if (!gj?.features?.length) throw new Error('Empty GeoJSON')
        echarts.registerMap('seoul', gj as any)
        setReady(true)
      } catch (e: any) {
        if (e?.name !== 'AbortError') console.error('[MapChoropleth] load error:', e)
      }
    })()
    return () => { mounted.current = false; ac.abort() }
  }, [])

  const seriesData = useMemo(() => {
    if (!ready) return []
    // data의 키는 반드시 '종로구' 같은 구 이름이어야 함 (GeoJSON properties.sggnm와 동일 문자열)
    return Object.keys(data).map(k => ({ name: k, value: data[k] ?? 0 }))
  }, [ready, data])

  const values = seriesData.map(d => d.value)
  const rawMin = values.length ? Math.min(...values) : 0
  const rawMax = values.length ? Math.max(...values) : 0
  const min = rawMin
  const max = rawMin === rawMax ? rawMin + 1 : rawMax

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (p: any) => `${p.name}: ${Number(p.value ?? 0).toFixed(2)}`
    },
    visualMap: {
      min, max, calculable: true,
      inRange: { color: ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef'] },
      textStyle: { color: '#d4d4d8' }
    },
    series: [{
      type: 'map',
      map: 'seoul',
      nameProperty: 'sggnm', // ✅ GeoJSON의 구 이름 키
      emphasis: { label: { show: true } },
      data: seriesData
    }]
  }), [min, max, seriesData])

  if (!ready) {
    return <div className="card" style={{ height, display:'grid', placeItems:'center' }}>Loading map…</div>
  }

  return (
    <div className="card" style={{ height }}>
      <ReactEChartsCore
        echarts={echarts}
        option={option as any}
        notMerge
        lazyUpdate
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  )
}
