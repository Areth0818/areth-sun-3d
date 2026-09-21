/**
 * Areth Design 3D太陽軌道シミュレーター - 参考住宅モデル（2階建て）
 * 
 * 住宅営業・パッシブデザイン説明用:
 * - 南面（-Z方向）に大きな開口部（リビング掃き出し窓、バルコニー）
 * - 南面に張り出した軒（庇・出幅約0.9m〜1.0m）
 * - 太陽高度の違い（夏至の遮蔽、冬至の差し込み）を日影として明瞭に可視化
 */
import * as THREE from 'three';

export interface HouseModelObjects {
  group: THREE.Group;
  setVisible: (visible: boolean) => void;
}

export function createHouseModel(): HouseModelObjects {
  const group = new THREE.Group();
  group.name = "HouseModelGroup";

  // マテリアル定義
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc, // 外壁: オフホワイト (slate-50)
    roughness: 0.8,
    metalness: 0.05,
  });

  const accentWallMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // アクセント外壁 (slate-200)
    roughness: 0.7,
    metalness: 0.1,
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x334155, // 屋根・パラペット: スレートダークグレー
    roughness: 0.6,
    metalness: 0.2,
  });

  const eaveMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // 軒・庇: チャコールグレー
    roughness: 0.6,
    metalness: 0.2,
  });

  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x93c5fd, // 窓ガラス: 澄んだライトブルー
    roughness: 0.1,
    metalness: 0.85,
    transparent: true,
    opacity: 0.75,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, // サッシ枠: ブラック/ダークスレート
    roughness: 0.5,
    metalness: 0.3,
  });

  const woodDeckMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // ウッドデッキ: 暖かみのある木調
    roughness: 0.8,
    metalness: 0.05,
  });

  // 1. 建物本体（1階・2階）
  // 寸法: 東西間口(X) 8m, 南北奥行(Z) 6m, 高さ(Y) 6m
  // 座標系: 南面は -Z 方向、北面は +Z 方向
  const mainBodyGeo = new THREE.BoxGeometry(8, 6, 6);
  const mainBody = new THREE.Mesh(mainBodyGeo, wallMat);
  mainBody.position.set(0, 3, 0); // Y: 0〜6m
  mainBody.castShadow = true;
  mainBody.receiveShadow = true;
  group.add(mainBody);

  // 2. 屋根パラペット（スタイリッシュなフラットルーフ・笠木）
  const parapetGeo = new THREE.BoxGeometry(8.3, 0.4, 6.3);
  const parapet = new THREE.Mesh(parapetGeo, roofMat);
  parapet.position.set(0, 6.2, 0);
  parapet.castShadow = true;
  parapet.receiveShadow = true;
  group.add(parapet);

  // 3. 2階 屋根の軒（南面に1.0m張り出し）
  // 夏至の真上からの直射日光を南面窓から遮蔽するキーパーツ
  const roofEaveGeo = new THREE.BoxGeometry(8.4, 0.25, 1.2);
  const roofEave = new THREE.Mesh(roofEaveGeo, eaveMat);
  // 南面(Z=-3)から手前(-Z方向)に張り出す
  roofEave.position.set(0, 6.1, -3.5);
  roofEave.castShadow = true;
  roofEave.receiveShadow = true;
  group.add(roofEave);

  // 4. 1階 南面リビング掃き出し窓 (Z = -3.01)
  // 幅 4.0m, 高さ 2.2m
  const window1FFrameGeo = new THREE.BoxGeometry(4.2, 2.3, 0.08);
  const window1FFrame = new THREE.Mesh(window1FFrameGeo, frameMat);
  window1FFrame.position.set(0, 1.15, -3.02);
  group.add(window1FFrame);

  const window1FGlassGeo = new THREE.BoxGeometry(4.0, 2.1, 0.04);
  const window1FGlass = new THREE.Mesh(window1FGlassGeo, glassMat);
  window1FGlass.position.set(0, 1.15, -3.04);
  group.add(window1FGlass);

  // 1階南面のウッドデッキ (Z: -3.0 〜 -4.8, 幅 5m)
  const deckGeo = new THREE.BoxGeometry(5.2, 0.15, 1.8);
  const deck = new THREE.Mesh(deckGeo, woodDeckMat);
  deck.position.set(0, 0.08, -3.9);
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  // 5. 1階窓上の軒・庇（バルコニー下、または中間庇: 出幅0.9m）
  // パッシブデザインの象徴: 夏至の高度78°を完璧にカットし、冬至の31°を窓内に取り込む
  const eave1FGeo = new THREE.BoxGeometry(4.6, 0.15, 1.0);
  const eave1F = new THREE.Mesh(eave1FGeo, eaveMat);
  eave1F.position.set(0, 2.85, -3.5);
  eave1F.castShadow = true;
  eave1F.receiveShadow = true;
  group.add(eave1F);

  // 6. 2階 南面バルコニー & 居室窓
  // バルコニー床 (幅 4.2m, 出幅 1.1m, Y=3.0)
  const balconyFloorGeo = new THREE.BoxGeometry(4.4, 0.2, 1.1);
  const balconyFloor = new THREE.Mesh(balconyFloorGeo, accentWallMat);
  balconyFloor.position.set(0, 3.0, -3.55);
  balconyFloor.castShadow = true;
  balconyFloor.receiveShadow = true;
  group.add(balconyFloor);

  // バルコニー手すり壁 (高さ 1.05m)
  const handrailGeo = new THREE.BoxGeometry(4.4, 1.05, 0.1);
  const handrail = new THREE.Mesh(handrailGeo, frameMat);
  handrail.position.set(0, 3.6, -4.05);
  handrail.castShadow = true;
  handrail.receiveShadow = true;
  group.add(handrail);

  // 2階窓 (幅 3.2m, 高さ 1.6m, Y=4.2)
  const window2FFrameGeo = new THREE.BoxGeometry(3.4, 1.8, 0.08);
  const window2FFrame = new THREE.Mesh(window2FFrameGeo, frameMat);
  window2FFrame.position.set(0, 4.3, -3.02);
  group.add(window2FFrame);

  const window2FGlassGeo = new THREE.BoxGeometry(3.2, 1.6, 0.04);
  const window2FGlass = new THREE.Mesh(window2FGlassGeo, glassMat);
  window2FGlass.position.set(0, 4.3, -3.04);
  group.add(window2FGlass);

  // 7. 北面（+Z方向）玄関ドア & ポーチ庇
  // 玄関ドア (幅 1.2m, 高さ 2.3m, Z = +3.02)
  const doorGeo = new THREE.BoxGeometry(1.2, 2.3, 0.06);
  const door = new THREE.Mesh(doorGeo, frameMat);
  door.position.set(-1.5, 1.15, 3.02);
  group.add(door);

  // 玄関ポーチ庇 (出幅 0.8m)
  const porchEaveGeo = new THREE.BoxGeometry(1.8, 0.12, 0.9);
  const porchEave = new THREE.Mesh(porchEaveGeo, eaveMat);
  porchEave.position.set(-1.5, 2.5, 3.45);
  porchEave.castShadow = true;
  porchEave.receiveShadow = true;
  group.add(porchEave);

  // 8. 東面・西面の小窓（採光スリット）
  // 東面 (+X = 4.02)
  const slitEastGeo = new THREE.BoxGeometry(0.06, 1.4, 0.6);
  const slitEast = new THREE.Mesh(slitEastGeo, glassMat);
  slitEast.position.set(4.02, 4.2, 0);
  group.add(slitEast);

  // 西面 (-X = -4.02)
  const slitWestGeo = new THREE.BoxGeometry(0.06, 1.4, 0.6);
  const slitWest = new THREE.Mesh(slitWestGeo, glassMat);
  slitWest.position.set(-4.02, 4.2, 0);
  group.add(slitWest);

  return {
    group,
    setVisible: (visible: boolean) => {
      group.visible = visible;
    },
  };
}
