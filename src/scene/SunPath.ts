/**
 * Areth Design 3D太阳軌道シミュレーター - 太陽軌道 3D描画モジュール
 * 
 * - 選択日の軌道（太い立体チューブメッシュで強調）
 * - 季節比較軌道（夏至、春分、秋分、冬至）
 * - 2時間ごとの時刻目盛りラベル（ON/OFF可能）
 * - 日の出・南中・日の入りの特殊マーカー
 */
import * as THREE from 'three';
import { generateDayPathPoints, calculateSolarEvents, calculateSolarPoint, findSolarNoon } from '../astronomy/solarEvents';
import { getMinutesOfDayJST } from '../utils/dateTime';
import { createTextSprite } from './Compass';
import { PATH_STYLES, SEASON_CONFIG } from '../app/constants';
import { SeasonKey } from '../app/types';
import { disposeObject3D } from './disposeHelper';

export interface PathMeshObjects {
  group: THREE.Group;
  ticksGroup: THREE.Group;
  updatePaths: (
    selectedDateStr: string,
    seasonalDates: Record<SeasonKey, string>,
    latitude: number,
    longitude: number,
    visiblePaths: { selected: boolean; spring: boolean; summer: boolean; autumn: boolean; winter: boolean },
    showHourTicks: boolean
  ) => void;
  setHourTicksVisible: (visible: boolean) => void;
}

export function createSunPathRenderer(radius: number): PathMeshObjects {
  const group = new THREE.Group();
  group.name = "SunPathGroup";

  const ticksGroup = new THREE.Group();
  ticksGroup.name = "HourTicksGroup";
  group.add(ticksGroup);

  // 各軌道オブジェクトの保持マップ
  const pathGroups: Record<string, THREE.Group> = {};

  /**
   * 単一の太陽軌道（地上実線＋地下破線＋マーカー）を構築
   */
  function buildSinglePath(
    dateStr: string,
    latitude: number,
    longitude: number,
    colorHex: string,
    isPrimary: boolean,
    seasonLabel: string
  ): THREE.Group {
    const pathGroup = new THREE.Group();
    pathGroup.name = `Path_${seasonLabel}_${dateStr}`;

    // 1日全体（24時間）のサンプリング点列（2分刻みで極めて滑らか）
    const allPoints = generateDayPathPoints(dateStr, latitude, longitude, radius, 2, false);

    // 地平線上の点列と地平線下の点列に分割
    const abovePts: THREE.Vector3[] = [];
    const belowPts: THREE.Vector3[] = [];

    allPoints.forEach((p) => {
      const v = new THREE.Vector3(p.x, p.y, p.z);
      if (p.isAboveHorizon) {
        abovePts.push(v);
      } else {
        belowPts.push(v);
      }
    });

    // 1. 地平線上の軌道（実線・立体チューブ）
    if (abovePts.length > 2) {
      const curve = new THREE.CatmullRomCurve3(abovePts);
      const tubeRadius = isPrimary ? 0.35 : 0.18; // 選択日は太く強調
      const tubeSegments = Math.max(64, abovePts.length * 2);
      const tubeGeo = new THREE.TubeGeometry(curve, tubeSegments, tubeRadius, 8, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: isPrimary ? 1.0 : 0.75,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      pathGroup.add(tubeMesh);
    }

    // 2. 地平線下の軌道（薄い点線/半透明ライン）
    if (belowPts.length > 2) {
      const belowGeo = new THREE.BufferGeometry().setFromPoints(belowPts);
      const belowMat = new THREE.LineDashedMaterial({
        color: new THREE.Color(colorHex),
        dashSize: 0.8,
        gapSize: 0.8,
        transparent: true,
        opacity: 0.25,
      });
      const belowLine = new THREE.Line(belowGeo, belowMat);
      belowLine.computeLineDistances();
      pathGroup.add(belowLine);
    }

    // 3. 南中マーカー（太陽最高到達点）
    const noon = findSolarNoon(dateStr, latitude, longitude);
    const noonPt = calculateSolarPoint(dateStr, noon.solarNoonMinute, latitude, longitude, radius);
    
    // 南中球体マーカー
    const noonGeo = new THREE.SphereGeometry(isPrimary ? 0.8 : 0.5, 16, 16);
    const noonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex) });
    const noonMesh = new THREE.Mesh(noonGeo, noonMat);
    noonMesh.position.set(noonPt.x, noonPt.y, noonPt.z);
    pathGroup.add(noonMesh);

    // 南中ラベル
    const noonLabelSprite = createTextSprite(
      `${seasonLabel} 南中 ${noon.maxAltitudeDeg.toFixed(1)}°`,
      "",
      colorHex,
      "rgba(255, 255, 255, 0.9)",
      18
    );
    noonLabelSprite.position.set(noonPt.x, noonPt.y + (isPrimary ? 2.5 : 1.8), noonPt.z);
    noonLabelSprite.scale.set(6.5, 2.2, 1);
    pathGroup.add(noonLabelSprite);

    // 4. 日の出・日の入りマーカー
    const events = calculateSolarEvents(dateStr, latitude, longitude);
    if (events.sunrise) {
      const sunrisePt = calculateSolarPoint(dateStr, getMinutesOfDayJST(events.sunrise), latitude, longitude, radius);
      const riseGeo = new THREE.SphereGeometry(0.5, 12, 12);
      const riseMat = new THREE.MeshBasicMaterial({ color: 0x10b981 }); // 緑
      const riseMesh = new THREE.Mesh(riseGeo, riseMat);
      riseMesh.position.set(sunrisePt.x, 0.2, sunrisePt.z);
      pathGroup.add(riseMesh);
    }

    if (events.sunset) {
      const sunsetPt = calculateSolarPoint(dateStr, getMinutesOfDayJST(events.sunset), latitude, longitude, radius);
      const setGeo = new THREE.SphereGeometry(0.5, 12, 12);
      const setMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e }); // 赤
      const setMesh = new THREE.Mesh(setGeo, setMat);
      setMesh.position.set(sunsetPt.x, 0.2, sunsetPt.z);
      pathGroup.add(setMesh);
    }

    return pathGroup;
  }

  /**
   * 選択日の軌道上に2時間ごとの時刻目盛り（06:00, 08:00...）を生成
   */
  function buildHourTicks(dateStr: string, latitude: number, longitude: number): void {
    // 既存の目盛りを確実に解放
    while (ticksGroup.children.length > 0) {
      disposeObject3D(ticksGroup.children[0]);
    }

    // 6:00 から 18:00 まで 2時間おき (360, 480, 600, 720, 840, 960, 1080分)
    const tickMinutes = [360, 480, 600, 720, 840, 960, 1080];

    tickMinutes.forEach((m) => {
      const pt = calculateSolarPoint(dateStr, m, latitude, longitude, radius);
      if (pt.isAboveHorizon) {
        // 小さなマーカー球
        const tickGeo = new THREE.SphereGeometry(0.35, 12, 12);
        const tickMat = new THREE.MeshBasicMaterial({ color: 0x475569 });
        const tickMesh = new THREE.Mesh(tickGeo, tickMat);
        tickMesh.position.set(pt.x, pt.y, pt.z);
        ticksGroup.add(tickMesh);

        // 時刻文字列
        const hh = Math.floor(m / 60).toString().padStart(2, '0');
        const timeStr = `${hh}:00`;
        const sprite = createTextSprite(timeStr, "", "#334155", "rgba(255, 255, 255, 0.8)", 20);
        sprite.position.set(pt.x * 1.04, pt.y * 1.04, pt.z * 1.04);
        sprite.scale.set(3.8, 1.6, 1);
        ticksGroup.add(sprite);
      }
    });
  }

  return {
    group,
    ticksGroup,
    updatePaths: (
      selectedDateStr,
      seasonalDates,
      latitude,
      longitude,
      visiblePaths,
      showHourTicks
    ) => {
      // 既存のPathグループをすべてGPUメモリから完全に破棄
      Object.keys(pathGroups).forEach((key) => {
        disposeObject3D(pathGroups[key]);
        delete pathGroups[key];
      });

      // 1. 選択日の軌道
      if (visiblePaths.selected) {
        const selectedGroup = buildSinglePath(
          selectedDateStr,
          latitude,
          longitude,
          PATH_STYLES.selected.color,
          true,
          "選択日"
        );
        pathGroups["selected"] = selectedGroup;
        group.add(selectedGroup);
      }

      // 2. 4季節比較軌道
      const seasonKeys: SeasonKey[] = ["summer", "spring", "autumn", "winter"];
      seasonKeys.forEach((key) => {
        if (visiblePaths[key]) {
          const dateStr = seasonalDates[key];
          const cfg = SEASON_CONFIG[key];
          const sGroup = buildSinglePath(
            dateStr,
            latitude,
            longitude,
            cfg.color,
            false,
            cfg.name
          );
          pathGroups[key] = sGroup;
          group.add(sGroup);
        }
      });

      // 3. 時刻目盛りの更新
      buildHourTicks(selectedDateStr, latitude, longitude);
      ticksGroup.visible = showHourTicks;
    },
    setHourTicksVisible: (visible: boolean) => {
      ticksGroup.visible = visible;
    },
  };
}
