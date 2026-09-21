/**
 * Areth Design 3D太陽軌道シミュレーター - 太陽イベント & 軌道サンプリングモジュール
 */
import SunCalc from 'suncalc';
import { getSolarPosition } from './solarPosition';
import { horizontalToCartesian } from './coordinateTransform';
import { createDateFromJST, formatTimeJST, formatDurationMinutes } from '../utils/dateTime';
import { getDirectionName16 } from '../utils/formatting';
import { SolarPoint, SolarEvents } from '../app/types';

/**
 * 1日の中の特定時刻（分: 0〜1439）の太陽位置と3D座標を計算
 */
export function calculateSolarPoint(
  dateStr: string,
  minuteOfDay: number,
  latitude: number,
  longitude: number,
  radius: number
): SolarPoint {
  const date = createDateFromJST(dateStr, minuteOfDay);
  const pos = getSolarPosition(date, latitude, longitude);
  const coords = horizontalToCartesian(pos.altitudeDeg, pos.azimuthDeg, radius);
  const dirName = getDirectionName16(pos.azimuthDeg);

  return {
    date,
    dateTimeIso: date.toISOString(),
    minutesOfDay: minuteOfDay,
    altitudeDeg: pos.altitudeDeg,
    azimuthDeg: pos.azimuthDeg,
    directionName: dirName,
    x: coords.x,
    y: coords.y,
    z: coords.z,
    isAboveHorizon: pos.altitudeDeg >= 0,
  };
}

/**
 * 指定日の太陽高度が極大となる南中時刻と南中高度を探索します。
 * 1日全体（0〜1439分）を粗探索したのち、極大付近を分・秒単位で精細探索することで、
 * 日本全国および任意の経度において正確な南中を特定します。
 */
export function findSolarNoon(
  dateStr: string,
  latitude: number,
  longitude: number
): { solarNoonDate: Date; solarNoonMinute: number; maxAltitudeDeg: number; azimuthDeg: number } {
  let bestMinute = 720;
  let maxAlt = Number.NEGATIVE_INFINITY;
  let bestAzimuth = 180;

  // 1. 1日全体（0〜1440分）を5分刻みでサンプリング
  for (let m = 0; m < 1440; m += 5) {
    const d = createDateFromJST(dateStr, m);
    const pos = getSolarPosition(d, latitude, longitude);
    if (pos.altitudeDeg > maxAlt) {
      maxAlt = pos.altitudeDeg;
      bestMinute = m;
      bestAzimuth = pos.azimuthDeg;
    }
  }

  // 2. 最良候補の前後5分を1分刻みで探索
  const coarseBest = bestMinute;
  for (let m = Math.max(0, coarseBest - 5); m <= Math.min(1439, coarseBest + 5); m += 1) {
    const d = createDateFromJST(dateStr, m);
    const pos = getSolarPosition(d, latitude, longitude);
    if (pos.altitudeDeg > maxAlt) {
      maxAlt = pos.altitudeDeg;
      bestMinute = m;
      bestAzimuth = pos.azimuthDeg;
    }
  }

  // 3. 最良候補の前後60秒を5秒刻みで精密探索
  let refinedMinute = bestMinute;
  for (let secOffset = -60; secOffset <= 60; secOffset += 5) {
    const m = Math.max(0, Math.min(1439.999, bestMinute + secOffset / 60));
    const d = createDateFromJST(dateStr, m);
    const pos = getSolarPosition(d, latitude, longitude);
    if (pos.altitudeDeg > maxAlt) {
      maxAlt = pos.altitudeDeg;
      refinedMinute = m;
      bestAzimuth = pos.azimuthDeg;
    }
  }

  const solarNoonDate = createDateFromJST(dateStr, refinedMinute);
  return {
    solarNoonDate,
    solarNoonMinute: refinedMinute,
    maxAltitudeDeg: maxAlt,
    azimuthDeg: bestAzimuth,
  };
}

/**
 * 指定日・地点の太陽イベント（日の出、南中、日の入り、方位角、昼の長さ）を計算
 */
export function calculateSolarEvents(
  dateStr: string,
  latitude: number,
  longitude: number
): SolarEvents {
  const noonDate = createDateFromJST(dateStr, 720);
  const times = SunCalc.getTimes(noonDate, latitude, longitude);

  const noonCalc = findSolarNoon(dateStr, latitude, longitude);

  let sunrise: Date | null = times.sunrise;
  let sunset: Date | null = times.sunset;

  if (sunrise && isNaN(sunrise.getTime())) sunrise = null;
  if (sunset && isNaN(sunset.getTime())) sunset = null;

  let sunriseAzimuthDeg: number | null = null;
  let sunsetAzimuthDeg: number | null = null;
  let daylightMinutes: number | null = null;

  if (sunrise) {
    const pos = getSolarPosition(sunrise, latitude, longitude);
    sunriseAzimuthDeg = pos.azimuthDeg;
  }

  if (sunset) {
    const pos = getSolarPosition(sunset, latitude, longitude);
    sunsetAzimuthDeg = pos.azimuthDeg;
  }

  if (sunrise && sunset) {
    daylightMinutes = (sunset.getTime() - sunrise.getTime()) / (60 * 1000);
    if (daylightMinutes < 0) daylightMinutes = 0;
  }

  return {
    sunrise,
    solarNoon: noonCalc.solarNoonDate,
    sunset,
    sunriseTimeStr: formatTimeJST(sunrise),
    solarNoonTimeStr: formatTimeJST(noonCalc.solarNoonDate),
    sunsetTimeStr: formatTimeJST(sunset),
    sunriseAzimuthDeg,
    sunsetAzimuthDeg,
    solarNoonAltitudeDeg: noonCalc.maxAltitudeDeg,
    daylightMinutes,
    daylightDurationStr: formatDurationMinutes(daylightMinutes),
  };
}

/**
 * 1日の太陽軌道の3Dサンプリング点列を生成します。
 */
export function generateDayPathPoints(
  dateStr: string,
  latitude: number,
  longitude: number,
  radius: number,
  stepMinutes: number = 5,
  onlyAboveHorizon: boolean = true
): SolarPoint[] {
  const points: SolarPoint[] = [];

  for (let m = 0; m <= 1440; m += stepMinutes) {
    const pt = calculateSolarPoint(dateStr, Math.min(m, 1439), latitude, longitude, radius);
    if (!onlyAboveHorizon || pt.isAboveHorizon) {
      points.push(pt);
    }
  }

  return points;
}
