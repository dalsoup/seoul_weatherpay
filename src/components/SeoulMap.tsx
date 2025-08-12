// SeoulMap.tsx  ← 이 파일로 통째 교체
import { useEffect, useState } from 'react';

// ★ 핵심: 'echarts/core' + 필요한 컴포넌트만 등록 → 단일 인스턴스 보장
import * as echarts from 'echarts/core';
import { MapChart } from 'echarts/charts';
import { GeoComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([MapChart, GeoComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

// 래퍼도 core 버전 사용
import ReactEChartsCore from 'echarts-for-react/lib/core';

export default function SeoulMap() {
  const [option, setOption] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    // public/ 에 파일이 있다면 이 경로면 충분
    const url = `/seoul_districts.geojson?v=${Date.now()}`; // 캐시 무시

    (async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`GeoJSON HTTP ${res.status}`);
        const geojson = await res.json();
        if (cancelled) return;

        // 1) 먼저 동일 인스턴스에 등록
        echarts.registerMap('seoul', geojson);

        // (디버그) 등록 확인 — 여기서 false면 파일/경로 문제
        // console.log('getMap?', !!(echarts as any).getMap?.('seoul'));

        // 2) 등록 이후에만 옵션 제공
        setOption({
          series: [
            {
              type: 'map',
              map: 'seoul',
              nameProperty: 'sggnm', // 필요 시 'SIG_KOR_NM' 등으로 교체
              emphasis: { label: { show: true } },
              data: [
                { name: '종로구', value: 20 },
                { name: '중구', value: 15 },
              ],
            },
          ],
          tooltip: { trigger: 'item' },
          visualMap: { min: 0, max: 100, calculable: true },
        });
      } catch (e) {
        console.error('[SeoulMap] failed to load map:', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!option) {
    return (
      <div style={{ height: 520, display: 'grid', placeItems: 'center' }}>
        Loading map…
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}   // ★ 같은 인스턴스 주입 (중요!)
      option={option}
      notMerge
      lazyUpdate
      style={{ height: 520 }}
    />
  );
}
