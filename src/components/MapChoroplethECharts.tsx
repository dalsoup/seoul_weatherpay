// MapChoroplethECharts.tsx — click 선택 + 하이라이트 대응 버전
import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { TooltipComponent, VisualMapComponent } from 'echarts/components'
import { MapChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'
echarts.use([TooltipComponent, VisualMapComponent, MapChart, CanvasRenderer])

type Props = {
  data: Record<string, number>
  height?: number
  /** 지도에서 구를 클릭했을 때 호출 (구 이름) */
  onSelectDistrict?: (name: string) => void
  /** 외부에서 현재 선택된 구를 내려보내면 지도에서 하이라이트됨 */
  selectedName?: string
}

export default function MapChoroplethECharts({
  data,
  height = 380,
  onSelectDistrict,
  selectedName,
}: Props) {
  const [ready, setReady] = useState(false)
  const mounted = useRef(true)

  // GeoJSON 로드 + 지도 등록
  useEffect(() => {
    mounted.current = true
    const ac = new AbortController()

    ;(async () => {
      try {
        const res = await fetch('/seoul_districts.geojson', {
          cache: 'no-store',
          signal: ac.signal,
        })
        if (!res.ok) throw new Error(`GeoJSON HTTP ${res.status}`)
        const gj = await res.json()
        if (!mounted.current) return
        if (!gj?.features?.length) throw new Error('Empty GeoJSON')
        echarts.registerMap('seoul', gj as any)
        setReady(true)
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.error('[MapChoropleth] load error:', e)
        }
      }
    })()

    return () => {
      mounted.current = false
      ac.abort()
    }
  }, [])

  // 시리즈 데이터 구성 (+선택 상태 반영)
  const seriesData = useMemo(() => {
    if (!ready) return []
    // data의 키는 반드시 GeoJSON properties.sggnm와 동일한 구 이름이어야 함
    return Object.keys(data).map((k) => ({
      name: k,
      value: data[k] ?? 0,
      // 외부에서 내려온 선택 구를 시각적으로 표시
      selected: selectedName ? k === selectedName : false,
    }))
  }, [ready, data, selectedName])

  const values = seriesData.map((d: any) => d.value as number)
  const rawMin = values.length ? Math.min(...values) : 0
  const rawMax = values.length ? Math.max(...values) : 0
  const min = rawMin
  const max = rawMin === rawMax ? rawMin + 1 : rawMax

  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (p: any) => `${p.name}: ${Number(p.value ?? 0).toFixed(2)}`,
      },
      visualMap: {
        min,
        max,
        calculable: true,
        inRange: {
          color: ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'],
        },
        textStyle: { color: '#d4d4d8' },
      },
      series: [
        {
          type: 'map',
          map: 'seoul',
          nameProperty: 'sggnm', // ✅ GeoJSON의 구 이름 키
          selectedMode: 'single', // 클릭으로 단일 선택
          emphasis: {
            label: { show: true },
            itemStyle: { borderColor: '#fff', borderWidth: 1.2 },
          },
          select: {
            label: { show: true },
            itemStyle: { borderColor: '#ffffff', borderWidth: 1.6 },
          },
          data: seriesData,
        },
      ],
    }),
    [min, max, seriesData]
  )

  // ECharts 클릭 이벤트 연결
  const onEvents = useMemo(
    () => ({
      click: (p: any) => {
        // 맵 시리즈에서만 처리
        if (p?.componentType === 'series' && p?.seriesType === 'map' && p?.name) {
          onSelectDistrict?.(p.name)
        }
      },
    }),
    [onSelectDistrict]
  )

  if (!ready) {
    return (
      <div
        className="card"
        style={{ height, display: 'grid', placeItems: 'center' }}
      >
        Loading map…
      </div>
    )
  }

  return (
    <div className="card" style={{ height, cursor: onSelectDistrict ? 'pointer' : 'default' }}>
      <ReactEChartsCore
        echarts={echarts}
        option={option as any}
        onEvents={onEvents}
        notMerge
        lazyUpdate
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  )
}
