import * as echarts from 'echarts/core';
import { MapChart } from 'echarts/charts';
import { TooltipComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useEffect, useRef } from 'react';

echarts.use([MapChart, TooltipComponent, VisualMapComponent, CanvasRenderer]);

export default function SeoulMap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart: echarts.ECharts | null = null;
    let ro: ResizeObserver | null = null;

    const init = async () => {
      if (!ref.current) return;
      chart = echarts.init(ref.current);

      // ✅ 배포에서도 동작하는 경로 (public 밑은 루트로 서빙됨)
      const res = await fetch('/seoul_districts.geojson');
      const geojson = await res.json();

      echarts.registerMap('seoul', geojson);

      chart.setOption({
        // geo 또는 series(map) 중 하나만 써도 됨
        series: [{
          type: 'map',
          map: 'seoul',
          roam: true,
          emphasis: { label: { show: false } },
          data: [] // 자치구 데이터 들어갈 자리
        }]
      });

      ro = new ResizeObserver(() => chart?.resize());
      ro.observe(ref.current);
    };

    init().catch(console.error);

    return () => {
      if (ro) { ro.disconnect(); ro = null; }   // ✅ disconnect 가드
      if (chart) { chart.dispose(); chart = null; } // ✅ dispose 가드
    };
  }, []);

  return <div ref={ref} style={{ width: '100%', height: 520 }} />;
}
