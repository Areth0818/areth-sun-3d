/**
 * Areth Design 3D太陽軌道シミュレーター - 太陽オブジェクト & 光線モジュール
 */
import * as THREE from 'three';
import { SolarPoint } from '../app/types';
import { formatMinutesOfDay } from '../utils/dateTime';
import { formatDegrees } from '../utils/formatting';

export interface SunObjects {
  group: THREE.Group;
  updatePosition: (point: SolarPoint, showRay: boolean, showLabels: boolean) => void;
}

export function createSunObject(): SunObjects {
  const group = new THREE.Group();
  group.name = "SunObjectGroup";

  // 1. 太陽球体（ゴールドイエロー）
  const sunGeo = new THREE.SphereGeometry(1.6, 32, 32);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b, // amber-500
  });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  group.add(sunMesh);

  // 2. 太陽グロー（外側の発光オーラ球）
  const glowGeo = new THREE.SphereGeometry(2.4, 24, 24);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xfde047, // yellow-300
    transparent: true,
    opacity: 0.35,
    side: THREE.BackSide,
  });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  group.add(glowMesh);

  // 3. 太陽光線（太陽から観測点(0,0,0)へ向かう光のビーム線）
  const rayGeo = new THREE.BufferGeometry();
  const rayMat = new THREE.LineBasicMaterial({
    color: 0xfbbf24, // amber-400
    transparent: true,
    opacity: 0.6,
  });
  const rayLine = new THREE.Line(rayGeo, rayMat);
  group.add(rayLine);

  // 4. 地面への垂直投影ドロップライン（高度角を視覚化）
  const dropGeo = new THREE.BufferGeometry();
  const dropMat = new THREE.LineDashedMaterial({
    color: 0x94a3b8,
    dashSize: 0.6,
    gapSize: 0.6,
    transparent: true,
    opacity: 0.5,
  });
  const dropLine = new THREE.Line(dropGeo, dropMat);
  group.add(dropLine);

  // 5. 地平面上の投影点（垂直の足）
  const footprintGeo = new THREE.CircleGeometry(0.8, 24);
  const footprintMat = new THREE.MeshBasicMaterial({
    color: 0x64748b,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  const footprintMesh = new THREE.Mesh(footprintGeo, footprintMat);
  footprintMesh.rotation.x = -Math.PI / 2;
  footprintMesh.position.y = 0.05;
  group.add(footprintMesh);

  // 6. 太陽の横の追従ラベル（時刻・高度）
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 240;
  labelCanvas.height = 80;
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  const labelSpriteMat = new THREE.SpriteMaterial({
    map: labelTexture,
    transparent: true,
    depthTest: false,
  });
  const labelSprite = new THREE.Sprite(labelSpriteMat);
  labelSprite.scale.set(7.5, 2.5, 1);
  group.add(labelSprite);

  function updateLabel(point: SolarPoint): void {
    const ctx = labelCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);

    const isAbove = point.isAboveHorizon;
    ctx.fillStyle = isAbove ? 'rgba(30, 41, 59, 0.88)' : 'rgba(71, 85, 105, 0.85)';
    ctx.beginPath();
    ctx.roundRect(4, 4, labelCanvas.width - 8, labelCanvas.height - 8, 12);
    ctx.fill();
    ctx.strokeStyle = isAbove ? '#f59e0b' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    const timeStr = formatMinutesOfDay(point.minutesOfDay);
    ctx.fillText(timeStr, 16, 28);

    if (isAbove) {
      ctx.font = '600 20px "Noto Sans JP", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`高度 ${formatDegrees(point.altitudeDeg)}`, 16, 54);
    } else {
      ctx.font = '500 16px "Noto Sans JP", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`地平線の下 (${formatDegrees(point.altitudeDeg)})`, 16, 54);
    }

    labelTexture.needsUpdate = true;
  }

  return {
    group,
    updatePosition: (point: SolarPoint, showRay: boolean, showLabels: boolean) => {
      const isAbove = point.isAboveHorizon;

      sunMesh.position.set(point.x, point.y, point.z);
      glowMesh.position.set(point.x, point.y, point.z);

      if (isAbove) {
        sunMat.opacity = 1.0;
        sunMat.color.setHex(0xf59e0b);
        glowMesh.visible = true;
      } else {
        sunMat.opacity = 0.25;
        sunMat.color.setHex(0x94a3b8);
        glowMesh.visible = false;
      }

      if (showRay && isAbove) {
        rayLine.visible = true;
        rayGeo.setFromPoints([
          new THREE.Vector3(point.x, point.y, point.z),
          new THREE.Vector3(0, 0, 0),
        ]);
      } else {
        rayLine.visible = false;
      }

      if (isAbove) {
        dropLine.visible = true;
        footprintMesh.visible = true;
        dropGeo.setFromPoints([
          new THREE.Vector3(point.x, point.y, point.z),
          new THREE.Vector3(point.x, 0.05, point.z),
        ]);
        dropLine.computeLineDistances();
        footprintMesh.position.set(point.x, 0.05, point.z);
      } else {
        dropLine.visible = false;
        footprintMesh.visible = false;
      }

      if (showLabels) {
        labelSprite.visible = true;
        labelSprite.position.set(point.x * 1.08, point.y + 2.5, point.z * 1.08);
        updateLabel(point);
      } else {
        labelSprite.visible = false;
      }
    },
  };
}
