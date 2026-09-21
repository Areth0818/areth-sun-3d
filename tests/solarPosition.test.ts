import { describe, it, expect } from 'vitest';
import { getSolarPosition } from '../src/astronomy/solarPosition';
import { createDateFromJST } from '../src/utils/dateTime';

describe('太陽位置計算・方位角定義 (solarPosition)', () => {
  const osakaLat = 34.6937;
  const osakaLng = 135.5023;

  it('正午付近で太陽方位角は概ね真南 (約180°) に位置すること', () => {
    // 2026-06-21 12:00 (南中時刻付近)
    const noonDate = createDateFromJST('2026-06-21', 720);
    const pos = getSolarPosition(noonDate, osakaLat, osakaLng);

    // 南は180°。南中付近では170°〜190°の範囲内
    expect(pos.azimuthDeg).toBeGreaterThan(170);
    expect(pos.azimuthDeg).toBeLessThan(190);
    // 夏至の南中高度は約78.7°
    expect(pos.altitudeDeg).toBeGreaterThan(75);
    expect(pos.altitudeDeg).toBeLessThan(82);
  });

  it('午前（東寄り方位: 0°〜180°）と午後（西寄り方位: 180°〜360°）を正しく区別すること', () => {
    // 午前 09:00 (540分)
    const morningDate = createDateFromJST('2026-06-21', 540);
    const morningPos = getSolarPosition(morningDate, osakaLat, osakaLng);
    expect(morningPos.azimuthDeg).toBeGreaterThan(60);
    expect(morningPos.azimuthDeg).toBeLessThan(140); // 東〜南東

    // 午後 15:00 (900分)
    const afternoonDate = createDateFromJST('2026-06-21', 900);
    const afternoonPos = getSolarPosition(afternoonDate, osakaLat, osakaLng);
    expect(afternoonPos.azimuthDeg).toBeGreaterThan(220);
    expect(afternoonPos.azimuthDeg).toBeLessThan(290); // 南西〜西
  });

  it('夜間は太陽高度が地平線下 (altitude < 0) になること', () => {
    // 深夜 00:00 (0分)
    const midnightDate = createDateFromJST('2026-06-21', 0);
    const pos = getSolarPosition(midnightDate, osakaLat, osakaLng);
    expect(pos.altitudeDeg).toBeLessThan(0);
  });
});
