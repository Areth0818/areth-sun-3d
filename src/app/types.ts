/**
 * Areth Design 3D太陽軌道シミュレーター - 型定義
 */

export interface LocationPreset {
  id: string;
  name: string;
  prefecture: string;
  latitude: number;
  longitude: number;
  timezone: "Asia/Tokyo";
  description?: string;
}

export interface SolarPoint {
  date: Date;
  dateTimeIso: string;
  minutesOfDay: number;
  altitudeDeg: number;
  azimuthDeg: number;
  directionName: string;
  x: number;
  y: number;
  z: number;
  isAboveHorizon: boolean;
}

export interface SolarEvents {
  sunrise: Date | null;
  solarNoon: Date | null;
  sunset: Date | null;
  sunriseTimeStr: string;
  solarNoonTimeStr: string;
  sunsetTimeStr: string;
  sunriseAzimuthDeg: number | null;
  sunsetAzimuthDeg: number | null;
  solarNoonAltitudeDeg: number | null;
  daylightMinutes: number | null;
  daylightDurationStr: string;
}

export type SeasonKey = "spring" | "summer" | "autumn" | "winter";

export interface PathStyle {
  id: "selected" | SeasonKey;
  label: string;
  shortLabel: string;
  dateStr: string;
  color: string;
  lineStyle: "solid" | "dash" | "dot";
  visible: boolean;
}

export interface SeasonComparisonRow {
  seasonKey: SeasonKey;
  seasonName: string;
  dateStr: string;
  dateLabel: string;
  sunriseTimeStr: string;
  sunriseAzimuthDeg: number | null;
  sunriseDirectionName: string;
  solarNoonTimeStr: string;
  solarNoonAltitudeDeg: number | null;
  sunsetTimeStr: string;
  sunsetAzimuthDeg: number | null;
  sunsetDirectionName: string;
  daylightDurationStr: string;
  color: string;
}

export interface AppState {
  location: LocationPreset;
  selectedDateStr: string; // YYYY-MM-DD (JST)
  minuteOfDay: number;     // 0 - 1439
  isPlaying: boolean;
  playbackSpeed: number;   // 1, 4, 16
  presentationMode: boolean;
  visiblePaths: {
    selected: boolean;
    spring: boolean;
    summer: boolean;
    autumn: boolean;
    winter: boolean;
  };
  showHourTicks: boolean;
  showSkyGrid: boolean;
  showLabels: boolean;
  showSunRays: boolean;
  cameraResetTrigger: number;
}
