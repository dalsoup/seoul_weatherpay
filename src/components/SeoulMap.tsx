// src/components/SeoulMap.tsx
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function SeoulMap() {
  const divRef = useRef<HTMLDivElement>(null);
  const inited = useRef(false);

  useEffect(() => {
    if (!divRef.current || inited.current) return;
    inited.current = true;

    const chart =
      echarts.getInstanceByDom(divRef.current) || echarts.init(divRef.current);
    let aborted = false;

    (async () => {
      try {
        // BASE_URL이 타입 에러였으면 그냥 아래 한 줄로 쓰세요.
        // const url = '/seoul_districts.geojson';
        const base =
          (import.meta as any).env?.BASE_URL ?? '/'; // 타입 안전 우회
        const url = base.replace(/\/$/, '/') + 'seoul_districts.geojson';

        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`GeoJSON ${res.status}`);
        const geojson = await res.json();

        if (aborted) return;

        // 최소 유효성 체크 & 디버그
        console.log('[SeoulMap] geojson:', {
          type: geojson?.type,
          features: geojson?.features?.length,
        });

        echarts.registerMap('seoul', geojson as any);

        // ✅ geo를 명시하고, series는 geoIndex로 붙이기
        chart.clear();
        chart.setOption(
          {
            geo: {
              map: 'seoul',
              roam: true,
              // label: { show: false },  // 필요 시
              // itemStyle: { borderColor: '#999' },
            },
            series: [
              {
                type: 'map',
                geoIndex: 0, // ← geo 위에 얹기
                // nameProperty: 'name', // feature 속성명이 다르면 지정 (예: 'SIG_KOR_NM')
                data: [], // [{ name: '종로구', value: 12 }, ...]
              },
            ],
            tooltip: { trigger: 'item' },
            visualMap: { min: 0, max: 100, calculable: true },
          },
          { notMerge: true }
        );
      } catch (e) {
        console.error('[SeoulMap] load/register failed:', e);
      }
    })();

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);

    return () => {
      aborted = true;
      window.removeEventListener('resize', onResize);
      if (!chart.isDisposed()) chart.dispose();
    };
  }, []);

  return <div ref={divRef} style={{ width: '100%', height: 520 }} />;
}
