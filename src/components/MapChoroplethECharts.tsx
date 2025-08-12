
import React, { useEffect, useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import * as echarts from 'echarts/core'
import { TooltipComponent, VisualMapComponent, TitleComponent, GeoComponent } from 'echarts/components'
import { MapChart } from 'echarts/charts'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([TooltipComponent, VisualMapComponent, TitleComponent, GeoComponent, MapChart, CanvasRenderer])

type Props = { data: Record<string, number>; height?: number }

export default function MapChoroplethECharts({ data, height = 380 }: Props) {
  const [geojson, setGeojson] = useState<any>(null)
  useEffect(() => {
    fetch('/seoul_districts.geojson').then(r=>r.json()).then(gj => {
      setGeojson(gj); echarts.registerMap('seoul', gj as any)
    })
  }, [])

  const seriesData = useMemo(() => {
    if (!geojson) return []
    return geojson.features.map((f: any) => {
      const name = f?.properties?.name || f?.properties?.SIG_KOR_NM
      return { name, value: data[name] ?? 0 }
    })
  }, [geojson, data])

  const values = seriesData.map((d: any) => d.value)
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1

  const option = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: ${Number(p.value).toFixed(2)}` },
    visualMap: {
      min, max, calculable: true,
      inRange: { color: ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#d946ef'] },
      textStyle: { color: '#d4d4d8' }
    },
    geo: {
      map: 'seoul', roam: false,
      itemStyle: { areaColor: '#0b0f19', borderColor: '#262626' },
      emphasis: { itemStyle: { areaColor: '#1f2937' } }
    },
    series: [{ type: 'map', map: 'seoul', geoIndex: 0, data: seriesData }]
  }
  return <div className="card" style={{height}}><ReactECharts option={option as any} style={{ height: '100%', width: '100%' }} /></div>
}
