import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function SeoulMap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);

    // public 폴더에서 GeoJSON 불러오기
    fetch('/seoul_districts.geojson')
      .then((res) => res.json())
      .then((geojson) => {
        echarts.registerMap('seoul', geojson);

        chart.setOption({
          series: [
            {
              type: 'map',
              map: 'seoul',
              data: [] // [{ name: '종로구', value: 12 }, ...]
            }
          ],
          tooltip: { trigger: 'item' },
          visualMap: { min: 0, max: 100, calculable: true }
        });
      });

    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chart.dispose();
    };
  }, []);

  return <div ref={ref} style={{ width: '100%', height: '500px' }} />;
}
