/**
 * Areth Design 3D太陽軌道シミュレーター - 定数定義
 */
import { LocationPreset, SeasonKey } from './types';

// 初期都市: 大阪府大阪市
export const DEFAULT_LOCATION: LocationPreset = {
  id: "osaka",
  name: "大阪市",
  prefecture: "大阪府",
  latitude: 34.6937,
  longitude: 135.5023,
  timezone: "Asia/Tokyo",
  description: "近畿地方の中心都市。標準的な日照シミュレーション地点。"
};

// 主要都市プリセット（FR-01）
export const LOCATION_PRESETS: LocationPreset[] = [
  DEFAULT_LOCATION,
  {
    id: "tokyo",
    name: "東京都心",
    prefecture: "東京都",
    latitude: 35.6895,
    longitude: 139.6917,
    timezone: "Asia/Tokyo",
  },
  {
    id: "nagoya",
    name: "名古屋市",
    prefecture: "愛知県",
    latitude: 35.1815,
    longitude: 136.9066,
    timezone: "Asia/Tokyo",
  },
  {
    id: "fukuoka",
    name: "福岡市",
    prefecture: "福岡県",
    latitude: 33.5904,
    longitude: 130.4017,
    timezone: "Asia/Tokyo",
  },
  {
    id: "sapporo",
    name: "札幌市",
    prefecture: "北海道",
    latitude: 43.0642,
    longitude: 141.3469,
    timezone: "Asia/Tokyo",
  },
  {
    id: "sendai",
    name: "仙台市",
    prefecture: "宮城県",
    latitude: 38.2682,
    longitude: 140.8694,
    timezone: "Asia/Tokyo",
  },
  {
    id: "hiroshima",
    name: "広島市",
    prefecture: "広島県",
    latitude: 34.3853,
    longitude: 132.4553,
    timezone: "Asia/Tokyo",
  },
  {
    id: "naha",
    name: "那覇市",
    prefecture: "沖縄県",
    latitude: 26.2124,
    longitude: 127.6809,
    timezone: "Asia/Tokyo",
  },
];

// 3D天空ドーム・軌道の描画半径
export const SKY_DOME_RADIUS = 50;

// 季節ごとの色とラベル（FR-06）
export const SEASON_CONFIG: Record<SeasonKey, { name: string; shortName: string; defaultMonthDay: string; color: string; description: string }> = {
  summer: {
    name: "夏至",
    shortName: "夏至",
    defaultMonthDay: "06-21",
    color: "#f97316",
    description: "1年で最も太陽が高く昇り、昼の時間が最も長い日。日の出・日の入りは北寄りになります。"
  },
  spring: {
    name: "春分",
    shortName: "春分",
    defaultMonthDay: "03-20",
    color: "#84cc16",
    description: "昼と夜の長さがほぼ等しくなる日。太陽は概ね真東から昇り、真西へ沈みます。"
  },
  autumn: {
    name: "秋分",
    shortName: "秋分",
    defaultMonthDay: "09-23",
    color: "#10b981",
    description: "春分と同様に昼夜がほぼ等しく、太陽は概ね真東から真西へと進みます。"
  },
  winter: {
    name: "冬至",
    shortName: "冬至",
    defaultMonthDay: "12-21",
    color: "#3b82f6",
    description: "1年で最も太陽の高度が低く、昼の時間が最も短い日。日の出・日の入りは南寄りになります。"
  },
};

export const PATH_STYLES: Record<string, { color: string; width: number }> = {
  selected: { color: "#f59e0b", width: 4 },
  summer: { color: "#f97316", width: 2 },
  spring: { color: "#84cc16", width: 2 },
  autumn: { color: "#10b981", width: 2 },
  winter: { color: "#3b82f6", width: 2 },
};

// 16方位の名前（北0°時計回り）
export const COMPASS_16_POINTS = [
  { name: "北", angle: 0 },
  { name: "北北東", angle: 22.5 },
  { name: "北東", angle: 45 },
  { name: "東北東", angle: 67.5 },
  { name: "東", angle: 90 },
  { name: "東南東", angle: 112.5 },
  { name: "南東", angle: 135 },
  { name: "南南東", angle: 157.5 },
  { name: "南", angle: 180 },
  { name: "南南西", angle: 202.5 },
  { name: "南西", angle: 225 },
  { name: "西南西", angle: 247.5 },
  { name: "西", angle: 270 },
  { name: "西北西", angle: 292.5 },
  { name: "北西", angle: 315 },
  { name: "北北西", angle: 337.5 },
];
