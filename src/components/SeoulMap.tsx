// SeoulMap.tsx (전체 교체)
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function SeoulMap() {
  const divRef = useRef<HTMLDivElement>(null);
  const inited = useRef(false);

  useEffect(() => {
    if (!divRef.current || inited.current) return;
    inited.current = true;

    const chart = echarts.getInstanceByDom(divRef.current) || echarts.init(divRef.current);
    chart.showLoading({ text: 'Loading map…' });

    const MAP_NAME = 'seoul';
    const url = `/seoul_districts.geojson?v=${Date.now()}`; // 캐시 무시

    (async () => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`GeoJSON HTTP ${res.status}`);
        const geojson = await res.json();

        const featLen = geojson?.features?.length ?? 0;
        const propKeys = Object.keys(geojson?.features?.[0]?.properties ?? {});
        console.log('[SeoulMap] features:', featLen, 'propKeys:', propKeys);

        // 구 이름 필드 자동 선택
        const NAME_FIELD =
          propKeys.includes('sggnm') ? 'sggnm' :
          propKeys.includes('SIG_KOR_NM') ? 'SIG_KOR_NM' :
          propKeys.includes('adm_nm') ? 'adm_nm' : 'name';

        echarts.registerMap(MAP_NAME, geojson as any);

        // 등록 확인 (이게 undefined면 regions 에러 원인)
        const m = (echarts as any).getMap?.(MAP_NAME);
        console.log('[SeoulMap] map registered?', !!m, m?.geoJSON && 'ok');

        if (!m) throw new Error('ECharts map not registered');

        // ✅ geo 없이 "series만" 사용 (가장 단순)
        chart.setOption({
          series: [{
            type: 'map',
            map: MAP_NAME,
            nameProperty: NAME_FIELD,
            data: [
              { name: '종로구', value: 20 },
              { name: '중구', value: 15 },
            ],
            emphasis: { label: { show: true } },
          }],
          tooltip: { trigger: 'item' },
          visualMap: { min: 0, max: 100, calculable: true },
        }, { notMerge: true });

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
      // 중복 dispose 방지
      if (!chart.isDisposed?.()) chart.dispose();
    };
  }, []);

  return <div ref={divRef} style={{ width: '100%', height: 520 }} />;
}
