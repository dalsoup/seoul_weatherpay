// SeoulMap.tsx
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

    chart.showLoading('default', { text: 'Loading map…' });

    const url = `/seoul_districts.geojson?v=${Date.now()}`; // 🔥 캐시 무시

    (async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`GeoJSON ${res.status}`);
        const geojson = await res.json();

        // ✅ 진단 로그
        const featLen = geojson?.features?.length ?? 0;
        const keys = Object.keys(geojson?.features?.[0]?.properties ?? {});
        console.log('[SeoulMap] features:', featLen, 'properties keys:', keys);

        // 🔑 구 이름 필드(동 레벨 파일이면 보통 'sggnm'이 구 이름)
        const NAME_FIELD = keys.includes('sggnm')
          ? 'sggnm'
          : keys.includes('SIG_KOR_NM')
          ? 'SIG_KOR_NM'
          : keys.includes('adm_nm')
          ? 'adm_nm'
          : 'name';

        echarts.registerMap('seoul', geojson as any);

        chart.setOption(
          {
            geo: { map: 'seoul', roam: true },
            series: [
              {
                type: 'map',
                geoIndex: 0,
                nameProperty: NAME_FIELD, // ← 여기!
                data: [
                  // 테스트로 값 2개만
                  { name: '종로구', value: 20 },
                  { name: '중구', value: 15 },
                ],
              },
            ],
            tooltip: { trigger: 'item' },
            visualMap: { min: 0, max: 100, calculable: true },
          },
          { notMerge: true }
        );
      } catch (e) {
        console.error('[SeoulMap] failed:', e);
      } finally {
        chart.hideLoading();
      }
    })();

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (!chart.isDisposed()) chart.dispose();
    };
  }, []);

  return <div ref={divRef} style={{ width: '100%', height: 520 }} />;
}
