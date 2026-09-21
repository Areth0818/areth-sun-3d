/**
 * Areth Design 3D太陽軌道シミュレーター - 3D座標変換モジュール
 * 
 * 座標系定義（仕様書4.3準拠）:
 * - +X軸: 東 (East)
 * - +Y軸: 天頂・上 (Zenith / Up)
 * - +Z軸: 北 (North)
 * - -Z軸: 南 (South)
 * - -X軸: 西 (West)
 * - 地平面: Y = 0
 * 
 * 方位角 azimuthDeg: 真北0°から時計回り（北0°, 東90°, 南180°, 西270°）
 * 高度角 altitudeDeg: 地平線0°, 天頂90°
 * 
 * 変換式:
 * alt = radians(altitudeDeg)
 * az = radians(azimuthDeg)
 * x = r * cos(alt) * sin(az)
 * y = r * sin(alt)
 * z = r * cos(alt) * cos(az)
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

/**
 * 度をラジアンに変換
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * ラジアンを度に変換
 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * 太陽の高度角・方位角および描画半径から 3D座標 (X, Y, Z) を算出
 * 
 * @param altitudeDeg 太陽高度（度、地平線=0, 天頂=90）
 * @param azimuthDeg 方位角（度、北=0, 東=90, 南=180, 西=270）
 * @param radius 描画球の半径
 */
export function horizontalToCartesian(
  altitudeDeg: number,
  azimuthDeg: number,
  radius: number
): Vector3D {
  const alt = degToRad(altitudeDeg);
  const az = degToRad(azimuthDeg);

  const cosAlt = Math.cos(alt);
  const sinAlt = Math.sin(alt);
  const cosAz = Math.cos(az);
  const sinAz = Math.sin(az);

  const x = radius * cosAlt * sinAz;
  const y = radius * sinAlt;
  const z = radius * cosAlt * cosAz;

  return { x, y, z };
}

/**
 * 3D座標から高度角と方位角を逆算（検証用）
 */
export function cartesianToHorizontal(
  pos: Vector3D
): { altitudeDeg: number; azimuthDeg: number; radius: number } {
  const radius = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
  if (radius < 1e-6) {
    return { altitudeDeg: 90, azimuthDeg: 0, radius: 0 };
  }

  const sinAlt = Math.max(-1, Math.min(1, pos.y / radius));
  const altitudeDeg = radToDeg(Math.asin(sinAlt));

  // 水平面上の長さ
  const horizDist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
  let azimuthDeg = 0;
  if (horizDist > 1e-6) {
    // x = horizDist * sin(az), z = horizDist * cos(az)
    // atan2(x, z) で北0°時計回りの方位角が得られる
    const azRad = Math.atan2(pos.x, pos.z);
    azimuthDeg = (radToDeg(azRad) + 360) % 360;
  }

  return { altitudeDeg, azimuthDeg, radius };
}
