/**
 * Areth Design 3D太陽軌道シミュレーター - 天空ドーム & 地平面
 */
import * as THREE from 'three';

export interface SkyDomeObjects {
  group: THREE.Group;
  groundMesh: THREE.Mesh;
  horizonRing: THREE.Line;
  gridGroup: THREE.Group;
  setGridVisible: (visible: boolean) => void;
}

export function createSkyDome(radius: number): SkyDomeObjects {
  const group = new THREE.Group();
  group.name = "SkyDomeGroup";

  // 1. 地平面（観測者を中心とする円盤）
  // 建築プレゼンテーションに適した落ち着いた淡いグレー
  const groundGeo = new THREE.CircleGeometry(radius * 1.05, 64);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, // slate-100
    roughness: 0.9,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2; // 水平面 (XZ平面)
  groundMesh.position.y = -0.05; // ちらつき防止
  groundMesh.receiveShadow = true;
  group.add(groundMesh);

  // 2. 地平線リング（太めの濃い境界サークル）
  const horizonGeo = new THREE.RingGeometry(radius * 0.995, radius * 1.005, 128);
  const horizonMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8, // slate-400
    side: THREE.DoubleSide,
  });
  const horizonRingMesh = new THREE.Mesh(horizonGeo, horizonMat);
  horizonRingMesh.rotation.x = -Math.PI / 2;
  horizonRingMesh.position.y = 0.01;
  group.add(horizonRingMesh);

  // 3. 天空半球ドーム（淡い水色〜天空の透明感あるワイヤーフレーム/メッシュ）
  const domeGeo = new THREE.SphereGeometry(
    radius,
    48,
    24,
    0,
    Math.PI * 2,
    0,
    Math.PI / 2 // 上半球のみ
  );
  const domeMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd, // sky-200
    wireframe: false,
    transparent: true,
    opacity: 0.08,
    side: THREE.BackSide,
  });
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  group.add(domeMesh);

  // 4. 天空グリッド（高度線・方位角線）
  const gridGroup = new THREE.Group();
  gridGroup.name = "SkyGridGroup";

  const gridLineMat = new THREE.LineBasicMaterial({
    color: 0xcfd8dc,
    transparent: true,
    opacity: 0.45,
  });

  // 高度角の同心円リング (15°, 30°, 45°, 60°, 75°)
  const altitudeSteps = [15, 30, 45, 60, 75];
  altitudeSteps.forEach((alt) => {
    const r = radius * Math.cos((alt * Math.PI) / 180);
    const y = radius * Math.sin((alt * Math.PI) / 180);
    const ringGeo = new THREE.BufferGeometry();
    const pts: THREE.Vector3[] = [];
    const segments = 64;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(r * Math.sin(theta), y, r * Math.cos(theta)));
    }
    ringGeo.setFromPoints(pts);
    const ringLine = new THREE.Line(ringGeo, gridLineMat);
    gridGroup.add(ringLine);
  });

  // 方位角の子午線アーチ (30°刻み: 0°, 30°, 60°...)
  for (let az = 0; az < 360; az += 30) {
    const archGeo = new THREE.BufferGeometry();
    const pts: THREE.Vector3[] = [];
    const azRad = (az * Math.PI) / 180;
    const segments = 32;
    for (let i = 0; i <= segments; i++) {
      const alt = (i / segments) * (Math.PI / 2);
      const x = radius * Math.cos(alt) * Math.sin(azRad);
      const y = radius * Math.sin(alt);
      const z = radius * Math.cos(alt) * Math.cos(azRad);
      pts.push(new THREE.Vector3(x, y, z));
    }
    archGeo.setFromPoints(pts);
    const archLine = new THREE.Line(archGeo, gridLineMat);
    gridGroup.add(archLine);
  }

  // 天頂軸（原点から上方向への微細な補助ポール）
  const zenithGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, radius, 0),
  ]);
  const zenithLine = new THREE.Line(
    zenithGeo,
    new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      dashSize: 1,
      gapSize: 1,
      transparent: true,
      opacity: 0.5,
    })
  );
  zenithLine.computeLineDistances();
  gridGroup.add(zenithLine);

  group.add(gridGroup);

  return {
    group,
    groundMesh,
    horizonRing: horizonRingMesh as unknown as THREE.Line,
    gridGroup,
    setGridVisible: (visible: boolean) => {
      gridGroup.visible = visible;
    },
  };
}
