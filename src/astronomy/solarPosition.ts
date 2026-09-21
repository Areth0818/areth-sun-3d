/**
 * Areth Design 3D太陽軌道シミュレーター - 太陽位置計算モジュール
 * 
 * 方位角の定義（本アプリ規格・仕様書4.2）:
 * - 真北 0° から時計回り（北=0°, 東=90°, 南=180°, 西=270°）
 * - 太陽高度角: 地平線=0°, 天頂=90°
 * 
 * SunCalcの出力仕様:
 * - altitude: ラジアン (0=地平線, PI/2=天頂)
 * - azimuth: ラジアン (南=0, 西=正, 東=負, -PI〜+PI)
 * 
 * 変換公式:
 * azimuthDeg = (azimuthRad * 180 / PI + 180) % 360
 */
import SunCalc from 'suncalc';
import { radToDeg } from './coordinateTransform';

export interface SolarCoordinates {
  altitudeDeg: number; // 太陽高度（度、地平線=0°, 天頂=90°）
  azimuthDeg: number;  // 方位角（度、真北=0°時計回り、東=90°, 南=180°, 西=270°）
  altitudeRad: number;
  azimuthRad: number;
}

/**
 * 指定日時（UTC Date）および緯度・経度における太陽位置を算出します。
 * 
 * @param date UTC基準のDateオブジェクト
 * @param latitude 北緯（度、正の値）
 * @param longitude 東経（度、正の値）
 */
export function getSolarPosition(
  date: Date,
  latitude: number,
  longitude: number
): SolarCoordinates {
  const sunPos = SunCalc.getPosition(date, latitude, longitude);

  // 高度角 (ラジアン -> 度)
  const altitudeDeg = radToDeg(sunPos.altitude);

  // 方位角変換:
  // SunCalc: 南=0, 西=+PI/2, 北=+PI/-PI, 東=-PI/2
  // 本アプリ: 北=0, 東=90, 南=180, 西=270 (真北0°時計回り)
  const sunCalcDeg = radToDeg(sunPos.azimuth);
  const azimuthDeg = ((sunCalcDeg + 180) % 360 + 360) % 360;

  return {
    altitudeDeg,
    azimuthDeg,
    altitudeRad: sunPos.altitude,
    azimuthRad: (azimuthDeg * Math.PI) / 180,
  };
}
