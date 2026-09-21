import React, { useEffect, useRef, useState } from 'react';
import { SunScene } from '../scene/SunScene';
import { SolarPoint, SeasonKey } from '../app/types';
import { AlertTriangle } from 'lucide-react';
import { SEASON_CONFIG, PATH_STYLES } from '../app/constants';

interface Viewport3DProps {
  solarPoint: SolarPoint;
  selectedDateStr: string;
  seasonalDates: Record<SeasonKey, string>;
  latitude: number;
  longitude: number;
  visiblePaths: {
    selected: boolean;
    spring: boolean;
    summer: boolean;
    autumn: boolean;
    winter: boolean;
  };
  showHourTicks: boolean;
  showSkyGrid: boolean;
  showLabels: boolean;
  showSunRays: boolean;
  showHouseModel: boolean;
  cameraResetTrigger: number;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  solarPoint,
  selectedDateStr,
  seasonalDates,
  latitude,
  longitude,
  visiblePaths,
  showHourTicks,
  showSkyGrid,
  showLabels,
  showSunRays,
  showHouseModel,
  cameraResetTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SunScene | null>(null);
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setWebGlSupported(false);
      }
    } catch {
      setWebGlSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!webGlSupported || !containerRef.current) return;

    const scene = new SunScene(containerRef.current);
    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [webGlSupported]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.updatePaths(
      selectedDateStr,
      seasonalDates,
      latitude,
      longitude,
      visiblePaths,
      showHourTicks
    );
  }, [selectedDateStr, seasonalDates, latitude, longitude, visiblePaths, showHourTicks]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setDisplayOptions({
      showSkyGrid,
      showLabels,
      showHourTicks,
      showHouseModel,
    });
  }, [showSkyGrid, showLabels, showHourTicks, showHouseModel]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.updateSun(solarPoint, showSunRays, showLabels);
  }, [solarPoint, showSunRays, showLabels]);

  useEffect(() => {
    if (!sceneRef.current || cameraResetTrigger === 0) return;
    sceneRef.current.resetCamera();
  }, [cameraResetTrigger]);

  const handleViewPreset = (preset: 'south' | 'top' | 'sky' | 'east' | 'west') => {
    if (sceneRef.current) {
      sceneRef.current.setViewPreset(preset);
    }
  };

  if (!webGlSupported) {
    return (
      <div className="webgl-error-container">
        <AlertTriangle size={48} className="text-rose mb-4" />
        <h3 className="error-title">3D表示（WebGL）をご利用いただけません</h3>
        <p className="error-desc">
          お使いのブラウザまたはグラフィックドライバでWebGLが無効になっている可能性があります。
          最新のGoogle Chrome、Microsoft Edge、またはSafariをご利用いただくか、
          ブラウザ設定の「ハードウェアアクセラレーション」を有効にしてください。
        </p>
      </div>
    );
  }

  return (
    <div className="viewport-container" ref={containerRef}>
      <div className="view-presets-overlay">
        <button
          type="button"
          className="btn-view-preset"
          onClick={() => handleViewPreset('south')}
          title="建物の南面（窓・軒・日影）を正面から見る（商談おすすめ）"
        >
          南面(建物正面)
        </button>
        <button
          type="button"
          className="btn-view-preset"
          onClick={() => handleViewPreset('top')}
          title="真上から見下ろす（上が北・下が南・右が東の標準配置図ビュー）"
        >
          真上(北が上)
        </button>
        <button
          type="button"
          className="btn-view-preset"
          onClick={() => handleViewPreset('sky')}
          title="南の空を見上げ、太陽軌道全体を見渡す視点"
        >
          南空(太陽全景)
        </button>
        <button
          type="button"
          className="btn-view-preset"
          onClick={() => handleViewPreset('east')}
          title="東側からの視点"
        >
          東から
        </button>
        <button
          type="button"
          className="btn-view-preset"
          onClick={() => handleViewPreset('west')}
          title="西側からの視点"
        >
          西から
        </button>
      </div>

      <div className="legend-overlay">
        <div className="legend-item">
          <span className="legend-bar" style={{ backgroundColor: PATH_STYLES.selected.color }} />
          <span>選択日</span>
        </div>
        {visiblePaths.summer && (
          <div className="legend-item">
            <span className="legend-bar" style={{ backgroundColor: SEASON_CONFIG.summer.color }} />
            <span>夏至</span>
          </div>
        )}
        {visiblePaths.spring && (
          <div className="legend-item">
            <span className="legend-bar" style={{ backgroundColor: SEASON_CONFIG.spring.color }} />
            <span>春分</span>
          </div>
        )}
        {visiblePaths.autumn && (
          <div className="legend-item">
            <span className="legend-bar" style={{ backgroundColor: SEASON_CONFIG.autumn.color }} />
            <span>秋分</span>
          </div>
        )}
        {visiblePaths.winter && (
          <div className="legend-item">
            <span className="legend-bar" style={{ backgroundColor: SEASON_CONFIG.winter.color }} />
            <span>冬至</span>
          </div>
        )}
      </div>

      <div className="viewport-hint">
        ドラッグで360°回転 / ホイールでズーム
      </div>
    </div>
  );
};
