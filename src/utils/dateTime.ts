/**
 * Areth Design 3D太陽軌道シミュレーター - JST専用日時ユーティリティ
 * 
 * PC・ブラウザのローカルタイムゾーン（米国・欧州・夏時間など）に一切影響されず、
 * 常にJST（日本標準時: UTC+9）で厳密に計算・フォーマットを行います。
 */

const JST_OFFSET_HOURS = 9;
const JST_OFFSET_MS = JST_OFFSET_HOURS * 60 * 60 * 1000;

/**
 * JSTの年月日 (YYYY-MM-DD) とその日の経過分 (0〜1439) から、
 * 対応する正確なUTC Dateインスタンスを生成します。
 */
export function createDateFromJST(dateStr: string, minutesOfDay: number = 0): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // 0〜1439.999の範囲にクランプして日跨ぎ・範囲外を防ぐ
  const clampedMinutes = Math.max(0, Math.min(1439.999, isNaN(minutesOfDay) ? 0 : minutesOfDay));

  const hours = Math.floor(clampedMinutes / 60);
  const minutes = Math.floor(clampedMinutes % 60);
  const seconds = Math.floor((clampedMinutes * 60) % 60);

  // UTCミリ秒を直接計算 (JSTの時刻から9時間を引く)
  const utcMs = Date.UTC(year, month - 1, day, hours - JST_OFFSET_HOURS, minutes, seconds);
  return new Date(utcMs);
}

/**
 * 任意のDateオブジェクトから、JST基準での「その日の経過分 (0〜1439)」を取得します。
 * 日跨ぎ（UTC前日など）を完全に吸収します。
 */
export function getMinutesOfDayJST(date: Date): number {
  if (!date || isNaN(date.getTime())) {
    throw new RangeError('Invalid Date for getMinutesOfDayJST');
  }
  return Math.floor(getDatePartsJST(date).minutesOfDay);
}

/**
 * 現在（または指定日時）のJSTにおける年を取得します。
 * PCローカルタイムゾーンに依存しません。
 */
export function getCurrentYearJST(now: Date = new Date()): number {
  return getDatePartsJST(now).year;
}

/**
 * 任意のDateオブジェクトをJSTの年月日・時刻要素に分解します。
 */
export function getDatePartsJST(date: Date): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  minutesOfDay: number;
} {
  // UTC時刻に9時間を加算した擬似UTC時刻から、UTCメソッドで値を取得することで
  // ホスト環境のタイムゾーンに影響されずにJSTの値を取得できる。
  const jstDate = new Date(date.getTime() + JST_OFFSET_MS);
  
  const year = jstDate.getUTCFullYear();
  const month = jstDate.getUTCMonth() + 1;
  const day = jstDate.getUTCDate();
  const hours = jstDate.getUTCHours();
  const minutes = jstDate.getUTCMinutes();
  const seconds = jstDate.getUTCSeconds();
  const minutesOfDay = hours * 60 + minutes + seconds / 60;

  return { year, month, day, hours, minutes, seconds, minutesOfDay };
}

/**
 * DateオブジェクトをJST形式の "HH:mm" 文字列に変換します。
 */
export function formatTimeJST(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) return "--:--";
  const { hours, minutes } = getDatePartsJST(date);
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * DateオブジェクトをJST形式の "HH:mm:ss" 文字列に変換します。
 */
export function formatTimeSecondsJST(date: Date | null | undefined): string {
  if (!date || isNaN(date.getTime())) return "--:--:--";
  const { hours, minutes, seconds } = getDatePartsJST(date);
  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  const ss = seconds.toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * DateオブジェクトをJST形式の "YYYY-MM-DD" 文字列に変換します。
 */
export function formatDateJST(date: Date): string {
  const { year, month, day } = getDatePartsJST(date);
  const yyyy = year.toString();
  const mm = month.toString().padStart(2, '0');
  const dd = day.toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 分 (0〜1439) を "HH:mm" 表記にフォーマットします。
 */
export function formatMinutesOfDay(minutesOfDay: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.floor(minutesOfDay)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * 分数を「○時間○分」表記に変換します。
 */
export function formatDurationMinutes(minutes: number | null | undefined): string {
  if (minutes == null || isNaN(minutes) || minutes < 0) return "--時間--分";
  const rounded = Math.round(minutes);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return `${h}時間${m}分`;
}

/**
 * 指定された年の二十四節気代表日（夏至、春分、秋分、冬至）のYYYY-MM-DD文字列を返します。
 * 国立天文台暦計算室の天文計算に準拠した日本標準時での代表日。
 */
export function getSeasonalDates(year: number): {
  summer: string;
  spring: string;
  autumn: string;
  winter: string;
} {
  // 二十四節気の簡易計算式（1980年〜2099年日本標準時対応）
  // 春分日: floor(20.8431 + 0.242194 * (Y - 1980) - floor((Y - 1980)/4))
  // 秋分日: floor(23.2488 + 0.242194 * (Y - 1980) - floor((Y - 1980)/4))
  const yOffset = year - 1980;
  const leapCount = Math.floor(yOffset / 4);

  const vernalDay = Math.floor(20.8431 + 0.242194 * yOffset - leapCount);
  const autumnalDay = Math.floor(23.2488 + 0.242194 * yOffset - leapCount);

  // 夏至は通常 6/21 (稀に6/22)
  const solsticeSummerDay = Math.floor(21.8510 + 0.242194 * yOffset - leapCount) === 22 ? 22 : 21;
  // 冬至は通常 12/21 または 12/22
  const solsticeWinterDay = Math.floor(22.4471 + 0.242194 * yOffset - leapCount) === 21 ? 21 : 22;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return {
    spring: `${year}-03-${pad(vernalDay)}`,
    summer: `${year}-06-${pad(solsticeSummerDay)}`,
    autumn: `${year}-09-${pad(autumnalDay)}`,
    winter: `${year}-12-${pad(solsticeWinterDay)}`,
  };
}
