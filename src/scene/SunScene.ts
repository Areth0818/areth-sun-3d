/**
 * Areth Design 3D太陽軌道シミュレーター - 3Dメインシーン管理
 * 
 * - Three.js WebGLRenderer（ソフトシャドウマップ対応）
 * - 太陽追従シャドウライト（DirectionalLight）によるリアルタイム日影描画
 * - 参考住宅モデル（2階建て・南面大開口・軒）の配置・表示制御
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SKY_DOME_RADIUS } from '../app/constants';
import { createSkyDome, SkyDomeObjects } from './SkyDome';
import { createCompass, CompassObjects } from './Compass';
import { createSunPathRenderer, PathMeshObjects } from './SunPath';
import { createSunObject, SunObjects } from './SunObject';
import { createHouseModel, HouseModelObjects } from './HouseModel';
import { SolarPoint, SeasonKey } from '../app/types';

export class SunScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  private skyDome: SkyDomeObjects;
  private compass: CompassObjects;
  private sunPath: PathMeshObjects;
  private sunObject: SunObjects;
  private houseModel: HouseModelObjects;

  private ambientLight: THREE.AmbientLight;
  private sunLight: THREE.DirectionalLight;

  private animationFrameId: number | null = null;
  private isDisposed: boolean = false;

  // 初期カメラ位置（北のやや上から南の空と太陽軌道全体を見渡す構図）
  // 北が+Z、南が-Zなので、Z>0から-Z方向を見る
  private defaultCameraPos = new THREE.Vector3(0, 36, 75);
  private defaultTarget = new THREE.Vector3(0, 5, -4);

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. シーン作成
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf8fafc); // slate-50

    // 2. カメラ作成
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    this.camera.position.copy(this.defaultCameraPos);

    // 3. レンダラー作成（シャドウマップ有効化）
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 滑らかなソフトシャドウ
    container.appendChild(this.renderer.domElement);

    // 4. OrbitControls（カメラ操作）
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.copy(this.defaultTarget);
    // 地面下に潜り込ませない制約（FR-04）
    this.controls.maxPolarAngle = Math.PI / 2 * 0.96;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 180;
    this.controls.update();

    // 5. ライト設定
    // 環境光（影の部分も暗くなりすぎず自然に見える設定）
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(this.ambientLight);

    // 太陽直射ライト（シャドウキャスター）
    this.sunLight = new THREE.DirectionalLight(0xfffbeb, 1.2);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 160;
    // シャドウカメラの投影範囲を住宅周辺（±18m）に最適化
    const d = 18;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.position.set(0, 40, -40);
    this.scene.add(this.sunLight);

    // 6. 各サブオブジェクトの生成
    this.skyDome = createSkyDome(SKY_DOME_RADIUS);
    this.scene.add(this.skyDome.group);

    this.compass = createCompass(SKY_DOME_RADIUS);
    this.scene.add(this.compass.group);

    this.sunPath = createSunPathRenderer(SKY_DOME_RADIUS);
    this.scene.add(this.sunPath.group);

    this.sunObject = createSunObject();
    this.scene.add(this.sunObject.group);

    // 参考住宅モデル（2階建て）
    this.houseModel = createHouseModel();
    this.scene.add(this.houseModel.group);

    // 7. リサイズ監視
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // 8. レンダリングループ開始
    this.animate = this.animate.bind(this);
    this.animate();
  }

  private animate(): void {
    if (this.isDisposed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize(): void {
    if (this.isDisposed || !this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * カメラを初期構図へリセット
   */
  public resetCamera(): void {
    this.camera.position.copy(this.defaultCameraPos);
    this.controls.target.copy(this.defaultTarget);
    this.controls.update();
  }

  /**
   * クイック視点プリセット
   */
  public setViewPreset(preset: 'south' | 'top' | 'east' | 'west'): void {
    if (preset === 'south') {
      // 南の空正面
      this.camera.position.set(0, 36, 75);
      this.controls.target.set(0, 5, -4);
    } else if (preset === 'top') {
      // 天頂・真上から見下ろす（日の出・日の入り・影の伸びの確認に最適）
      this.camera.position.set(0, 110, 0.1);
      this.controls.target.set(0, 0, 0);
    } else if (preset === 'east') {
      // 東から西を見る
      this.camera.position.set(75, 30, 0);
      this.controls.target.set(-5, 4, 0);
    } else if (preset === 'west') {
      // 西から東を見る
      this.camera.position.set(-75, 30, 0);
      this.controls.target.set(5, 4, 0);
    }
    this.controls.update();
  }

  /**
   * 太陽位置および日影のリアルタイム更新
   */
  public updateSun(point: SolarPoint, showRay: boolean, showLabels: boolean): void {
    this.sunObject.updatePosition(point, showRay, showLabels);

    // 太陽ライトの位置を太陽オブジェクトと同期
    this.sunLight.position.set(point.x, point.y, point.z);

    if (point.isAboveHorizon) {
      // 地平線上: 高度に応じた光量とシャドウ
      const altRad = (Math.max(0, point.altitudeDeg) * Math.PI) / 180;
      const intensity = Math.max(0.3, Math.sin(altRad)) * 1.5;
      this.sunLight.intensity = intensity;
      this.sunLight.castShadow = true;
      this.ambientLight.intensity = 0.65;
    } else {
      // 夜間（地平線下）: 影を消去し、薄暗い夜間環境
      this.sunLight.intensity = 0;
      this.sunLight.castShadow = false;
      this.ambientLight.intensity = 0.4;
    }
  }

  /**
   * 軌道線の更新
   */
  public updatePaths(
    selectedDateStr: string,
    seasonalDates: Record<SeasonKey, string>,
    latitude: number,
    longitude: number,
    visiblePaths: { selected: boolean; spring: boolean; summer: boolean; autumn: boolean; winter: boolean },
    showHourTicks: boolean
  ): void {
    this.sunPath.updatePaths(
      selectedDateStr,
      seasonalDates,
      latitude,
      longitude,
      visiblePaths,
      showHourTicks
    );
  }

  /**
   * 表示設定の更新
   */
  public setDisplayOptions(options: {
    showSkyGrid: boolean;
    showLabels: boolean;
    showHourTicks: boolean;
    showHouseModel: boolean;
  }): void {
    this.skyDome.setGridVisible(options.showSkyGrid);
    this.compass.setLabelsVisible(options.showLabels);
    this.sunPath.setHourTicksVisible(options.showHourTicks);
    this.houseModel.setVisible(options.showHouseModel);
  }

  /**
   * リソース解放・破棄
   */
  public dispose(): void {
    this.isDisposed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);

    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement && this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
