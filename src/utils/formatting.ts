/**
 * Areth Design 3D太陽軌道シミュレーター - フォーマットユーティリティ
 */
import { COMPASS_16_POINTS } from '../app/constants';

/**
 * 角度（度）を小数1桁でフォーマット（例: "35.4°"）
 */
export function formatDegrees(deg: number | null | undefined, precision: number = 1): string {
  if (deg == null || isNaN(deg)) return "--.-°";
  return `${deg.toFixed(precision)}°`;
}

/**
 * 方位角（真北0°〜360°時計回り）から直近の16方位名称を取得
 */
export function getDirectionName16(azimuthDeg: number | null | undefined): string {
  if (azimuthDeg == null || isNaN(azimuthDeg)) return "--";
  // 0〜360に正規化
  const normalized = ((azimuthDeg % 360) + 360) % 360;
  // 1方位の区間は 360 / 16 = 22.5度。北を中心にするため 11.25度オフセット
  const index = Math.floor((normalized + 11.25) / 22.5) % 16;
  return COMPASS_16_POINTS[index].name;
}

/**
 * YYYY-MM-DD 文字列を「YYYY年M月D日」形式に変換
 */
export function formatJapaneseDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(y, 10)}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
}
