import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function SeoulMap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);

    (async () => {
      try {
        const url = '/seoul_districts.geojson'; // public/ 밑에 있어야 함
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`GeoJSON fetch failed: ${res.status}`);
        const geojson = await res.json();

        // 최소한의 유효성 체크
        if (!geojson || !geojson.type) {
          throw new Error('Invalid GeoJSON payload');
        }

        echarts.registerMap('seoul', geojson as any);

        // registerMap 후에 setOption!
        chart.setOption({
          series: [
            {
              type: 'map',
              map: 'seoul',
              // 필요시 regions 사용 가능
              data: [] // [{ name: '종로구', value: 12 }, ...]
            }
          ],
          tooltip: { trigger: 'item' },
          visualMap: { min: 0, max: 100, calculable: true }
        });
      } catch (err) {
        console.error('[SeoulMap] failed to load/register map:', err);
      }
    })();

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, []);

  return <div ref={ref} style={{ width: '100%', height: 520 }} />;
}
