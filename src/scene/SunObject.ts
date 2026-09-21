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
  const rayPositions = new Float32Array(6);
  const rayAttribute = new THREE.BufferAttribute(rayPositions, 3);
  rayAttribute.setUsage(THREE.DynamicDrawUsage);
  const rayGeo = new THREE.BufferGeometry();
  rayGeo.setAttribute('position', rayAttribute);
  const rayMat = new THREE.LineBasicMaterial({
    color: 0xfbbf24, // amber-400
    transparent: true,
    opacity: 0.6,
  });
  const rayLine = new THREE.Line(rayGeo, rayMat);
  group.add(rayLine);

  // 4. 地面への垂直投影ドロップライン（高度角を視覚化）
  const dropPositions = new Float32Array(6);
  const dropAttribute = new THREE.BufferAttribute(dropPositions, 3);
  dropAttribute.setUsage(THREE.DynamicDrawUsage);
  const dropGeo = new THREE.BufferGeometry();
  dropGeo.setAttribute('position', dropAttribute);
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

  let previousLabelKey = '';
  function updateLabel(point: SolarPoint): void {
    const nextKey = `${Math.floor(point.minutesOfDay)}|${point.altitudeDeg.toFixed(1)}|${point.isAboveHorizon}`;
    if (nextKey === previousLabelKey) return;
    previousLabelKey = nextKey;

    const ctx = labelCanvas.getContext('2d')!;
    ctx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);

    // 背景角丸矩形
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(4, 4, labelCanvas.width - 8, labelCanvas.height - 8, 12);
    ctx.fill();
    ctx.stroke();

    // 時刻
    ctx.font = 'bold 22px "Noto Sans JP", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(formatMinutesOfDay(point.minutesOfDay), 16, 28);

    // 高度
    if (point.isAboveHorizon) {
      ctx.font = '600 18px "Noto Sans JP", sans-serif';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`高度: ${formatDegrees(point.altitudeDeg)}`, 16, 54);
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
        rayPositions[0] = point.x;
        rayPositions[1] = point.y;
        rayPositions[2] = point.z;
        rayPositions[3] = 0;
        rayPositions[4] = 0;
        rayPositions[5] = 0;
        rayAttribute.needsUpdate = true;
      } else {
        rayLine.visible = false;
      }

      if (isAbove) {
        dropLine.visible = true;
        footprintMesh.visible = true;
        dropPositions[0] = point.x;
        dropPositions[1] = point.y;
        dropPositions[2] = point.z;
        dropPositions[3] = point.x;
        dropPositions[4] = 0.05;
        dropPositions[5] = point.z;
        dropAttribute.needsUpdate = true;
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
