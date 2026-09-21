import { describe, it, expect } from 'vitest';
import {
  horizontalToCartesian,
  cartesianToHorizontal,
  degToRad,
  radToDeg,
} from '../src/astronomy/coordinateTransform';

describe('UT-01 座標変換 (coordinateTransform)', () => {
  const r = 50;

  it('度とラジアンの変換が正確であること', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 6);
    expect(radToDeg(Math.PI)).toBeCloseTo(180, 6);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 6);
    expect(degToRad(0)).toBe(0);
  });

  it('高度0°・方位0° (北の地平線) は (x=0, y=0, z=r) となること', () => {
    const p = horizontalToCartesian(0, 0, r);
    expect(p.x).toBeCloseTo(0, 4);
    expect(p.y).toBeCloseTo(0, 4);
    expect(p.z).toBeCloseTo(r, 4);
  });

  it('高度0°・方位90° (東の地平線) は (x=r, y=0, z=0) となること', () => {
    const p = horizontalToCartesian(0, 90, r);
    expect(p.x).toBeCloseTo(r, 4);
    expect(p.y).toBeCloseTo(0, 4);
    expect(p.z).toBeCloseTo(0, 4);
  });

  it('高度0°・方位180° (南の地平線) は (x=0, y=0, z=-r) となること', () => {
    const p = horizontalToCartesian(0, 180, r);
    expect(p.x).toBeCloseTo(0, 4);
    expect(p.y).toBeCloseTo(0, 4);
    expect(p.z).toBeCloseTo(-r, 4);
  });

  it('高度0°・方位270° (西の地平線) は (x=-r, y=0, z=0) となること', () => {
    const p = horizontalToCartesian(0, 270, r);
    expect(p.x).toBeCloseTo(-r, 4);
    expect(p.y).toBeCloseTo(0, 4);
    expect(p.z).toBeCloseTo(0, 4);
  });

  it('高度90° (天頂) は (x=0, y=r, z=0) となること', () => {
    const p = horizontalToCartesian(90, 180, r);
    expect(p.x).toBeCloseTo(0, 4);
    expect(p.y).toBeCloseTo(r, 4);
    expect(p.z).toBeCloseTo(0, 4);
  });

  it('順変換と逆変換の往復で高度角と方位角が一致すること', () => {
    const testCases = [
      { alt: 35.5, az: 145.2 },
      { alt: 78.0, az: 180.0 },
      { alt: 12.3, az: 260.5 },
      { alt: 45.0, az: 45.0 },
    ];

    for (const tc of testCases) {
      const p = horizontalToCartesian(tc.alt, tc.az, r);
      const inv = cartesianToHorizontal(p);
      expect(inv.altitudeDeg).toBeCloseTo(tc.alt, 3);
      expect(inv.azimuthDeg).toBeCloseTo(tc.az, 3);
      expect(inv.radius).toBeCloseTo(r, 3);
    }
  });
});
