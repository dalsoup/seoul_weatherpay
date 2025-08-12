// SeoulMap.tsx — echarts-for-react 사용 MWE
import { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

export default function SeoulMap() {
  const [option, setOption] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;

    // 캐시 우회 + 서브경로 대응
    const base = (import.meta as any).env?.BASE_URL ?? '/';
    const url = base.replace(/\/$/, '/') + `seoul_districts.geojson?v=${Date.now()}`;

    (async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`GeoJSON HTTP ${res.status}`);
        const geojson = await res.json();
        if (cancelled) return;

        // 1) 먼저 등록
        echarts.registerMap('seoul', geojson);

        // 2) 등록 성공 후에만 option 세팅 → 이때 렌더됨
        // 동 레벨 데이터라면 구 이름 필드는 보통 'sggnm'
        setOption({
          series: [
            {
              type: 'map',
              map: 'seoul',
              nameProperty: 'sggnm', // 필요 시 'SIG_KOR_NM' 등으로 교체
              data: [
                { name: '종로구', value: 20 },
                { name: '중구', value: 15 },
              ],
              emphasis: { label: { show: true } },
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

  // 맵 등록 전에는 렌더하지 않음 → "Map not exists" 방지
  if (!option) return <div style={{ height: 520, display: 'grid', placeItems: 'center' }}>Loading map…</div>;

  return (
    <ReactECharts
      echarts={echarts}
      option={option}
      notMerge
      lazyUpdate
      style={{ height: 520 }}
    />
  );
}
