/**
 * Areth Design 3D太陽軌道シミュレーター - 基準検証ベンチマークデータ
 * 
 * 出典: 国立天文台（NAOJ）暦計算室の計算値に基づく基準目安
 * 許容誤差目標（仕様書4.7）:
 * - 太陽高度 / 南中高度: ±0.5°以内
 * - 方位角: ±1.0°以内（大気差モデル差異を許容）
 * - 日の出 / 南中 / 日の入り: ±3〜5分以内
 */

export interface BenchmarkTarget {
  locationId: string;
  name: string;
  latitude: number;
  longitude: number;
  dateStr: string;
  seasonName: string;
  expectedSolarNoonMinutes: number; // 0〜1439
  expectedMaxAltitudeDeg: number;
  expectedSunriseMinutes: number;
  expectedSunsetMinutes: number;
  expectedSunriseAzimuthDeg: number;
  expectedSunsetAzimuthDeg: number;
}

export const BENCHMARK_CASES: BenchmarkTarget[] = [
  // 大阪市 (北緯34.6937°, 東経135.5023°)
  {
    locationId: "osaka",
    name: "大阪市（夏至）",
    latitude: 34.6937,
    longitude: 135.5023,
    dateStr: "2026-06-21",
    seasonName: "夏至",
    expectedSolarNoonMinutes: 720, // 11:59 (実測: 11:59)
    expectedMaxAltitudeDeg: 78.7,
    expectedSunriseMinutes: 286,   // 04:46
    expectedSunsetMinutes: 1155,   // 19:15
    expectedSunriseAzimuthDeg: 60.6,
    expectedSunsetAzimuthDeg: 299.7,
  },
  {
    locationId: "osaka",
    name: "大阪市（冬至）",
    latitude: 34.6937,
    longitude: 135.5023,
    dateStr: "2026-12-22",
    seasonName: "冬至",
    expectedSolarNoonMinutes: 716, // 11:56
    expectedMaxAltitudeDeg: 31.9,
    expectedSunriseMinutes: 423,   // 07:02
    expectedSunsetMinutes: 1012,   // 16:52
    expectedSunriseAzimuthDeg: 118.4,
    expectedSunsetAzimuthDeg: 241.9,
  },
  {
    locationId: "osaka",
    name: "大阪市（春分）",
    latitude: 34.6937,
    longitude: 135.5023,
    dateStr: "2026-03-20",
    seasonName: "春分",
    expectedSolarNoonMinutes: 726, // 12:06
    expectedMaxAltitudeDeg: 54.9,
    expectedSunriseMinutes: 364,   // 06:03
    expectedSunsetMinutes: 1090,   // 18:09
    expectedSunriseAzimuthDeg: 90.1,
    expectedSunsetAzimuthDeg: 270.4,
  },
  // 東京 (北緯35.6895°, 東経139.6917°)
  {
    locationId: "tokyo",
    name: "東京都心（夏至）",
    latitude: 35.6895,
    longitude: 139.6917,
    dateStr: "2026-06-21",
    seasonName: "夏至",
    expectedSolarNoonMinutes: 703, // 11:43
    expectedMaxAltitudeDeg: 77.7,
    expectedSunriseMinutes: 267,   // 04:27
    expectedSunsetMinutes: 1141,   // 19:01
    expectedSunriseAzimuthDeg: 60.1,
    expectedSunsetAzimuthDeg: 300.2,
  },
  {
    locationId: "tokyo",
    name: "東京都心（冬至）",
    latitude: 35.6895,
    longitude: 139.6917,
    dateStr: "2026-12-22",
    seasonName: "冬至",
    expectedSolarNoonMinutes: 700, // 11:40
    expectedMaxAltitudeDeg: 30.9,
    expectedSunriseMinutes: 409,   // 06:49
    expectedSunsetMinutes: 993,    // 16:33
    expectedSunriseAzimuthDeg: 118.8,
    expectedSunsetAzimuthDeg: 241.5,
  },
  // 那覇 (北緯26.2124°, 東経127.6809°)
  {
    locationId: "naha",
    name: "那覇市（夏至）",
    latitude: 26.2124,
    longitude: 127.6809,
    dateStr: "2026-06-21",
    seasonName: "夏至",
    expectedSolarNoonMinutes: 751, // 12:31
    expectedMaxAltitudeDeg: 87.2,
    expectedSunriseMinutes: 339,   // 05:39
    expectedSunsetMinutes: 1166,   // 19:26
    expectedSunriseAzimuthDeg: 63.3,
    expectedSunsetAzimuthDeg: 296.9,
  },
  // 札幌 (北緯43.0642°, 東経141.3469°)
  {
    locationId: "sapporo",
    name: "札幌市（冬至）",
    latitude: 43.0642,
    longitude: 141.3469,
    dateStr: "2026-12-22",
    seasonName: "冬至",
    expectedSolarNoonMinutes: 693, // 11:33
    expectedMaxAltitudeDeg: 23.5,
    expectedSunriseMinutes: 424,   // 07:04
    expectedSunsetMinutes: 964,    // 16:04
    expectedSunriseAzimuthDeg: 122.3,
    expectedSunsetAzimuthDeg: 238.1,
  },
];
