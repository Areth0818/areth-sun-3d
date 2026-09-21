/**
 * Areth Design 3D太陽軌道シミュレーター - Three.js リソース破棄ヘルパー
 * 
 * シーングラフからObject3Dを削除する際、GPU上のGeometry, Material, Textureを
 * 確実に走査して解放（dispose）し、メモリリークを完全に防止します。
 */

import * as THREE from 'three';

type RenderableObject = THREE.Object3D & {
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
};

export function disposeObject3D(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((object) => {
    const renderable = object as RenderableObject;

    if (renderable.geometry) {
      geometries.add(renderable.geometry);
    }

    const materialValue = renderable.material;
    if (!materialValue) return;

    const materialList = Array.isArray(materialValue)
      ? materialValue
      : [materialValue];

    for (const material of materialList) {
      materials.add(material);

      // マテリアルのプロパティ（map, alphaMap, envMap 等）に割り当てられたTextureを収集
      for (const key of Object.keys(material)) {
        const val = (material as unknown as Record<string, unknown>)[key];
        if (val instanceof THREE.Texture) {
          textures.add(val);
        }
      }
    }
  });

  for (const texture of textures) {
    texture.dispose();
  }

  for (const material of materials) {
    material.dispose();
  }

  for (const geometry of geometries) {
    geometry.dispose();
  }

  root.removeFromParent();
  root.clear();
}
