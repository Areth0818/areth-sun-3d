import { describe, it, expect } from 'vitest';
import {
  validateLatitude,
  validateLongitude,
  validateDateStr,
} from '../src/utils/validation';

describe('UT-02 入力検証 (validation)', () => {
  it('緯度の正常値・境界値・異常値を判定できること', () => {
    expect(validateLatitude(0).isValid).toBe(true);
    expect(validateLatitude(34.8164).isValid).toBe(true);
    expect(validateLatitude(90).isValid).toBe(true);
    expect(validateLatitude(-90).isValid).toBe(true);

    expect(validateLatitude(90.1).isValid).toBe(false);
    expect(validateLatitude(-90.1).isValid).toBe(false);
    expect(validateLatitude(NaN).isValid).toBe(false);
  });

  it('経度の正常値・境界値・異常値を判定できること', () => {
    expect(validateLongitude(0).isValid).toBe(true);
    expect(validateLongitude(135.5684).isValid).toBe(true);
    expect(validateLongitude(180).isValid).toBe(true);
    expect(validateLongitude(-180).isValid).toBe(true);

    expect(validateLongitude(180.1).isValid).toBe(false);
    expect(validateLongitude(-180.1).isValid).toBe(false);
    expect(validateLongitude(NaN).isValid).toBe(false);
  });

  it('日付文字列の検証が正確であること', () => {
    expect(validateDateStr('2026-06-21').isValid).toBe(true);
    expect(validateDateStr('2024-02-29').isValid).toBe(true);

    expect(validateDateStr('').isValid).toBe(false);
    expect(validateDateStr('invalid-date').isValid).toBe(false);
    expect(validateDateStr('2026/06/21').isValid).toBe(false);
    expect(validateDateStr('2026-13-01').isValid).toBe(false);
    expect(validateDateStr('2026-06-32').isValid).toBe(false);
  });
});
