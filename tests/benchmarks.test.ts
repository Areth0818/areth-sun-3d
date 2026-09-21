import { describe, it, expect } from 'vitest';
import { BENCHMARK_CASES } from '../src/astronomy/benchmarks';
import { calculateSolarEvents } from '../src/astronomy/solarEvents';
import { getDatePartsJST } from '../src/utils/dateTime';

describe('10.2 代表地点・代表日の基準値検証 (benchmarks)', () => {
  BENCHMARK_CASES.forEach((bm) => {
    it(`【${bm.name}】(${bm.dateStr}) の天文計算値が基準許容範囲内であること`, () => {
      const events = calculateSolarEvents(bm.dateStr, bm.latitude, bm.longitude);

      expect(events.solarNoon).not.toBeNull();
      expect(events.sunrise).not.toBeNull();
      expect(events.sunset).not.toBeNull();

      const noonParts = getDatePartsJST(events.solarNoon!);
      const sunriseParts = getDatePartsJST(events.sunrise!);
      const sunsetParts = getDatePartsJST(events.sunset!);

      // 南中時刻: ±3分以内
      const diffNoonMinutes = Math.abs(noonParts.minutesOfDay - bm.expectedSolarNoonMinutes);
      expect(diffNoonMinutes).toBeLessThanOrEqual(3);

      // 南中高度: ±0.5°以内
      const diffAltitude = Math.abs(events.solarNoonAltitudeDeg! - bm.expectedMaxAltitudeDeg);
      expect(diffAltitude).toBeLessThanOrEqual(0.5);

      // 日の出時刻: ±3分以内
      const diffSunrise = Math.abs(sunriseParts.minutesOfDay - bm.expectedSunriseMinutes);
      expect(diffSunrise).toBeLessThanOrEqual(3);

      // 日の入り時刻: ±3分以内
      const diffSunset = Math.abs(sunsetParts.minutesOfDay - bm.expectedSunsetMinutes);
      expect(diffSunset).toBeLessThanOrEqual(3);

      // 日の出方位角: ±1.0°以内（大気差・視半径定義差を考慮）
      if (events.sunriseAzimuthDeg != null) {
        const diffSunriseAz = Math.abs(events.sunriseAzimuthDeg - bm.expectedSunriseAzimuthDeg);
        expect(diffSunriseAz).toBeLessThanOrEqual(1.0);
      }

      // 日の入り方位角: ±1.0°以内
      if (events.sunsetAzimuthDeg != null) {
        const diffSunsetAz = Math.abs(events.sunsetAzimuthDeg - bm.expectedSunsetAzimuthDeg);
        expect(diffSunsetAz).toBeLessThanOrEqual(1.0);
      }
    });
  });
});
