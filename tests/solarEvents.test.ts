import { describe, it, expect } from 'vitest';
import {
  calculateSolarEvents,
  calculateSolarPoint,
  generateDayPathPoints,
  findSolarNoon,
} from '../src/astronomy/solarEvents';

describe('UT-04 太陽イベント計算 (solarEvents)', () => {
  const lat = 34.6937; // 大阪市
  const lng = 135.5023;

  it('日の出 < 南中 < 日の入り の順序が常に成り立つこと', () => {
    const events = calculateSolarEvents('2026-06-21', lat, lng);
    expect(events.sunrise).not.toBeNull();
    expect(events.solarNoon).not.toBeNull();
    expect(events.sunset).not.toBeNull();

    const riseTime = events.sunrise!.getTime();
    const noonTime = events.solarNoon!.getTime();
    const setTime = events.sunset!.getTime();

    expect(riseTime).toBeLessThan(noonTime);
    expect(noonTime).toBeLessThan(setTime);
  });

  it('昼の長さが 日の入り - 日の出 の差分と一致すること', () => {
    const events = calculateSolarEvents('2026-06-21', lat, lng);
    const expectedMinutes = (events.sunset!.getTime() - events.sunrise!.getTime()) / (60 * 1000);
    expect(events.daylightMinutes).toBeCloseTo(expectedMinutes, 4);
    expect(events.daylightDurationStr).toContain('時間');
  });

  it('南中高度がその日の最高高度であること', () => {
    const noon = findSolarNoon('2026-06-21', lat, lng);
    
    const morningPt = calculateSolarPoint('2026-06-21', 540, lat, lng, 50); // 09:00
    const noonPt = calculateSolarPoint('2026-06-21', noon.solarNoonMinute, lat, lng, 50);
    const eveningPt = calculateSolarPoint('2026-06-21', 960, lat, lng, 50); // 16:00

    expect(noonPt.altitudeDeg).toBeGreaterThan(morningPt.altitudeDeg);
    expect(noonPt.altitudeDeg).toBeGreaterThan(eveningPt.altitudeDeg);
    expect(noonPt.altitudeDeg).toBeCloseTo(noon.maxAltitudeDeg, 2);
  });

  it('夏至・春分・冬至の南中高度の順序が 夏至 > 春分 > 冬至 であること', () => {
    const summer = calculateSolarEvents('2026-06-21', lat, lng);
    const spring = calculateSolarEvents('2026-03-20', lat, lng);
    const winter = calculateSolarEvents('2026-12-22', lat, lng);

    expect(summer.solarNoonAltitudeDeg!).toBeGreaterThan(spring.solarNoonAltitudeDeg!);
    expect(spring.solarNoonAltitudeDeg!).toBeGreaterThan(winter.solarNoonAltitudeDeg!);

    // 夏至は約78.7°、春分は約54.9°、冬至は約31.9°
    expect(summer.solarNoonAltitudeDeg!).toBeCloseTo(78.7, 1);
    expect(spring.solarNoonAltitudeDeg!).toBeCloseTo(54.9, 1);
    expect(winter.solarNoonAltitudeDeg!).toBeCloseTo(31.9, 1);
  });

  it('日の出方位角が 季節によって北寄り（夏至）と南寄り（冬至）にシフトすること', () => {
    const summer = calculateSolarEvents('2026-06-21', lat, lng);
    const spring = calculateSolarEvents('2026-03-20', lat, lng);
    const winter = calculateSolarEvents('2026-12-22', lat, lng);

    // 春分は概ね真東 (約90°)
    expect(spring.sunriseAzimuthDeg!).toBeGreaterThan(85);
    expect(spring.sunriseAzimuthDeg!).toBeLessThan(95);

    // 夏至は北寄り (< 90°)
    expect(summer.sunriseAzimuthDeg!).toBeLessThan(75);
    expect(summer.sunriseAzimuthDeg!).toBeGreaterThan(50);

    // 冬至は南寄り (> 90°)
    expect(winter.sunriseAzimuthDeg!).toBeGreaterThan(105);
    expect(winter.sunriseAzimuthDeg!).toBeLessThan(130);
  });

  it('太陽軌道上の点と、calculateSolarPoint の計算結果が厳密に一致すること', () => {
    const points = generateDayPathPoints('2026-06-21', lat, lng, 50, 60, false);
    for (const pt of points) {
      const single = calculateSolarPoint('2026-06-21', pt.minutesOfDay, lat, lng, 50);
      expect(pt.x).toBeCloseTo(single.x, 5);
      expect(pt.y).toBeCloseTo(single.y, 5);
      expect(pt.z).toBeCloseTo(single.z, 5);
      expect(pt.altitudeDeg).toBeCloseTo(single.altitudeDeg, 5);
      expect(pt.azimuthDeg).toBeCloseTo(single.azimuthDeg, 5);
    }
  });
});
