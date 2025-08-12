// SeoulMap.tsx
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function SeoulMap() {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!divRef.current) return;
    const chart = echarts.init(divRef.current);

    fetch('/seoul_districts.geojson') // 여기에 방금 받은 GeoJSON 저장
      .then((r) => r.json())
      .then((geojson) => {
        echarts.registerMap('seoul', geojson as any);

        chart.setOption({
          geo: {
            map: 'seoul',
            roam: true,
          },
          series: [
            {
              type: 'map',
              geoIndex: 0,
              // ⬇️ 동 파일이지만 '구' 이름 필드로 묶어서 칠함
              nameProperty: 'sggnm',
              data: [
                { name: '종로구', value: 20 },
                { name: '중구', value: 15 },
                // ... 나머지 구들
              ],
            },
          ],
          tooltip: { trigger: 'item' },
          visualMap: { min: 0, max: 100, calculable: true },
        });
      });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, []);

  return <div ref={divRef} style={{ width: '100%', height: 520 }} />;
}
