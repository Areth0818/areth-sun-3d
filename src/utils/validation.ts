/**
 * Areth Design 3D太陽軌道シミュレーター - バリデーションユーティリティ
 */

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export function validateLatitude(lat: number): ValidationResult {
  if (isNaN(lat)) {
    return { isValid: false, errorMessage: "緯度には数値を入力してください。" };
  }
  if (lat < -90 || lat > 90) {
    return { isValid: false, errorMessage: "緯度は -90° 〜 +90° の範囲で入力してください。" };
  }
  return { isValid: true };
}

export function validateLongitude(lng: number): ValidationResult {
  if (isNaN(lng)) {
    return { isValid: false, errorMessage: "経度には数値を入力してください。" };
  }
  if (lng < -180 || lng > 180) {
    return { isValid: false, errorMessage: "経度は -180° 〜 +180° の範囲で入力してください。" };
  }
  return { isValid: true };
}

export function validateDateStr(dateStr: string): ValidationResult {
  if (!dateStr || typeof dateStr !== 'string') {
    return { isValid: false, errorMessage: "日付が指定されていません。" };
  }
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return { isValid: false, errorMessage: "日付は YYYY-MM-DD 形式で入力してください。" };
  }
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const d = parseInt(match[3], 10);
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
    return { isValid: false, errorMessage: "有効な年月日を入力してください。" };
  }
  // 実在する日付かどうかを検証（2月29日のうるう年判定や小の月の月末判定）
  const candidate = new Date(Date.UTC(y, m - 1, d));
  if (candidate.getUTCFullYear() !== y || candidate.getUTCMonth() !== m - 1 || candidate.getUTCDate() !== d) {
    return { isValid: false, errorMessage: "カレンダー上に存在しない日付です。" };
  }
  return { isValid: true };
}
