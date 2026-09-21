import { describe, it, expect } from 'vitest';
import {
  createDateFromJST,
  getDatePartsJST,
  formatTimeJST,
  formatDateJST,
  formatMinutesOfDay,
  formatDurationMinutes,
  getSeasonalDates,
} from '../src/utils/dateTime';

describe('UT-03 時刻・タイムゾーン・JST固定 (dateTime)', () => {
  it('JST 12:00 は UTC 03:00 に対応すること', () => {
    // 2026-06-21 12:00 JST -> 2026-06-21 03:00:00 UTC
    const date = createDateFromJST('2026-06-21', 720); // 720分 = 12:00
    expect(date.getUTCHours()).toBe(3);
    expect(date.getUTCMinutes()).toBe(0);
    expect(date.getUTCDate()).toBe(21);
  });

  it('JST 05:00 は 前日UTC 20:00 に対応すること（日跨ぎの検証）', () => {
    // 2026-06-21 05:00 JST -> 2026-06-20 20:00:00 UTC
    const date = createDateFromJST('2026-06-21', 300); // 300分 = 05:00
    expect(date.getUTCHours()).toBe(20);
    expect(date.getUTCDate()).toBe(20);

    // 逆にJSTに戻したときは 2026-06-21 05:00 となること
    const parts = getDatePartsJST(date);
    expect(parts.year).toBe(2026);
    expect(parts.month).toBe(6);
    expect(parts.day).toBe(21);
    expect(parts.hours).toBe(5);
    expect(parts.minutes).toBe(0);
    expect(formatTimeJST(date)).toBe('05:00');
    expect(formatDateJST(date)).toBe('2026-06-21');
  });

  it('閏年の2月29日を正しく処理できること (2024年)', () => {
    const leapDate = createDateFromJST('2024-02-29', 600); // 10:00
    const parts = getDatePartsJST(leapDate);
    expect(parts.year).toBe(2024);
    expect(parts.month).toBe(2);
    expect(parts.day).toBe(29);
    expect(formatDateJST(leapDate)).toBe('2024-02-29');
  });

  it('formatMinutesOfDay が正確にフォーマットすること', () => {
    expect(formatMinutesOfDay(0)).toBe('00:00');
    expect(formatMinutesOfDay(720)).toBe('12:00');
    expect(formatMinutesOfDay(285)).toBe('04:45');
    expect(formatMinutesOfDay(1439)).toBe('23:59');
  });

  it('formatDurationMinutes が正しく計算されること', () => {
    expect(formatDurationMinutes(60)).toBe('1時間0分');
    expect(formatDurationMinutes(869)).toBe('14時間29分');
    expect(formatDurationMinutes(0)).toBe('0時間0分');
  });

  it('2026年の季節代表日が妥当であること', () => {
    const seasons = getSeasonalDates(2026);
    expect(seasons.spring).toBe('2026-03-20');
    expect(seasons.summer).toBe('2026-06-21');
    expect(seasons.autumn).toBe('2026-09-23');
    expect(seasons.winter).toBe('2026-12-22');
  });
});
