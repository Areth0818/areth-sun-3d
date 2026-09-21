/**
 * Areth Design 3D太陽軌道シミュレーター - 方位盤 & ラベルモジュール
 * 
 * 座標系定義:
 * - +Z: 北 (North / N)
 * - +X: 東 (East / E)
 * - -Z: 南 (South / S)
 * - -X: 西 (West / W)
 */
import * as THREE from 'three';

export interface CompassObjects {
  group: THREE.Group;
  setLabelsVisible: (visible: boolean) => void;
}

/**
 * 2D Canvasからテキストテクスチャのスプライトを生成
 * カメラの向きによらず常に読める正面表示を実現
 */
export function createTextSprite(
  text: string,
  subText: string = "",
  textColor: string = "#1e293b",
  bgColor: string = "rgba(255, 255, 255, 0.85)",
  fontSize: number = 26
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 70;
  const ctx = canvas.getContext('2d')!;

  // 角丸背景
  ctx.fillStyle = bgColor;
  const r = 12;
  ctx.beginPath();
  ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, r);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  // メインテキスト (日本語)
  ctx.font = `bold ${fontSize}px "Noto Sans JP", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  
  if (subText) {
    ctx.fillText(text, canvas.width / 2, 28);
    // サブテキスト (英語)
    ctx.font = `500 16px "Inter", sans-serif`;
    ctx.fillStyle = '#64748b';
    ctx.fillText(subText, canvas.width / 2, 50);
  } else {
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false, // 常に手前に視認可能
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(6, 2.6, 1);
  return sprite;
}

export function createCompass(radius: number): CompassObjects {
  const group = new THREE.Group();
  group.name = "CompassGroup";

  const labelGroup = new THREE.Group();
  labelGroup.name = "CompassLabels";

  // 1. 方位盤の同心リングと十字線
  const ringGeo = new THREE.RingGeometry(radius * 0.96, radius * 0.98, 96);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x94a3b8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.rotation.x = -Math.PI / 2;
  ringMesh.position.y = 0.02;
  group.add(ringMesh);

  // 東西線 (+X 〜 -X) と 南北線 (+Z 〜 -Z)
  const crossGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-radius, 0.02, 0),
    new THREE.Vector3(radius, 0.02, 0),
    new THREE.Vector3(0, 0.02, -radius),
    new THREE.Vector3(0, 0.02, radius),
  ]);
  const crossMat = new THREE.LineBasicMaterial({
    color: 0xcfd8dc,
    transparent: true,
    opacity: 0.7,
  });
  const crossLine = new THREE.LineSegments(crossGeo, crossMat);
  group.add(crossLine);

  // 2. 4主方位ラベル
  // +Z = 北 (N), +X = 東 (E), -Z = 南 (S), -X = 西 (W)
  const mainPoints = [
    { label: "北", sub: "N", x: 0, z: radius * 1.08, color: "#ef4444" },  // 北は赤アクセント
    { label: "東", sub: "E", x: radius * 1.08, z: 0, color: "#1e293b" },
    { label: "南", sub: "S", x: 0, z: -radius * 1.08, color: "#f97316" }, // 南は営業の主役（オレンジアクセント）
    { label: "西", sub: "W", x: -radius * 1.08, z: 0, color: "#1e293b" },
  ];

  mainPoints.forEach((p) => {
    const sprite = createTextSprite(p.label, p.sub, p.color, "rgba(255, 255, 255, 0.95)", 28);
    sprite.position.set(p.x, 1.2, p.z);
    sprite.scale.set(7, 3, 1);
    labelGroup.add(sprite);
  });

  // 3. 4副方位（北東、南東、南西、北西）
  const subRadius = radius * 1.06;
  const subPoints = [
    { label: "北東", sub: "NE", deg: 45 },
    { label: "南東", sub: "SE", deg: 135 },
    { label: "南西", sub: "SW", deg: 225 },
    { label: "北西", sub: "NW", deg: 315 },
  ];

  subPoints.forEach((p) => {
    const rad = (p.deg * Math.PI) / 180;
    const x = subRadius * Math.sin(rad);
    const z = subRadius * Math.cos(rad);
    const sprite = createTextSprite(p.label, p.sub, "#64748b", "rgba(248, 250, 252, 0.8)", 20);
    sprite.position.set(x, 0.8, z);
    sprite.scale.set(5.5, 2.4, 1);
    labelGroup.add(sprite);
  });

  group.add(labelGroup);

  return {
    group,
    setLabelsVisible: (visible: boolean) => {
      labelGroup.visible = visible;
    },
  };
}
