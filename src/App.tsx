import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { Viewport3D } from './components/Viewport3D';
import { TimeControls } from './components/TimeControls';
import { MetricsPanel } from './components/MetricsPanel';
import { ComparisonTable } from './components/ComparisonTable';
import { HelpModal } from './components/HelpModal';

import { LocationPreset, SeasonKey, SeasonComparisonRow, SolarPoint } from './app/types';
import { DEFAULT_LOCATION, SKY_DOME_RADIUS, SEASON_CONFIG } from './app/constants';
import { getSeasonalDates, getCurrentYearJST, getMinutesOfDayJST } from './utils/dateTime';
import { calculateSolarPoint, calculateSolarEvents } from './astronomy/solarEvents';
import { getDirectionName16 } from './utils/formatting';

export const App: React.FC = () => {
  // 1. 地点状態
  const [location, setLocation] = useState<LocationPreset>(DEFAULT_LOCATION);

  // 2. 日付状態 (YYYY-MM-DD: 初期値は本年の夏至または現在日)
  const currentYear = useMemo(() => getCurrentYearJST(), []);
  const initialSeasonal = useMemo(() => getSeasonalDates(currentYear), [currentYear]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(initialSeasonal.summer);

  // 3. 時刻状態 (0〜1439分: 初期値は南中付近 12:00 = 720分)
  const [minuteOfDay, setMinuteOfDay] = useState<number>(720);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(4); // 初期は4倍速

  // 4. UI表示状態
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [cameraResetTrigger, setCameraResetTrigger] = useState<number>(0);

  // 5. 軌道表示フラグ
  const [visiblePaths, setVisiblePaths] = useState<{
    selected: boolean;
    spring: boolean;
    summer: boolean;
    autumn: boolean;
    winter: boolean;
  }>({
    selected: true,
    summer: true,
    spring: true,
    autumn: false,
    winter: true,
  });

  const [showHourTicks, setShowHourTicks] = useState<boolean>(true);
  const [showSkyGrid, setShowSkyGrid] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showSunRays, setShowSunRays] = useState<boolean>(true);
  const [showHouseModel, setShowHouseModel] = useState<boolean>(true);

  // 選択日の年における季節代表日
  const seasonalDates = useMemo(() => {
    const year = parseInt(selectedDateStr.slice(0, 4), 10) || currentYear;
    return getSeasonalDates(year);
  }, [selectedDateStr, currentYear]);

  // 現在の選択時刻における太陽位置
  const currentSolarPoint: SolarPoint = useMemo(() => {
    return calculateSolarPoint(
      selectedDateStr,
      minuteOfDay,
      location.latitude,
      location.longitude,
      SKY_DOME_RADIUS
    );
  }, [selectedDateStr, minuteOfDay, location]);

  // 選択日の日照イベント
  const currentEvents = useMemo(() => {
    return calculateSolarEvents(selectedDateStr, location.latitude, location.longitude);
  }, [selectedDateStr, location]);

  // 4季節比較表データ
  const comparisonRows: SeasonComparisonRow[] = useMemo(() => {
    const keys: SeasonKey[] = ["spring", "summer", "autumn", "winter"];
    return keys.map((key) => {
      const dStr = seasonalDates[key];
      const ev = calculateSolarEvents(dStr, location.latitude, location.longitude);
      const cfg = SEASON_CONFIG[key];
      return {
        seasonKey: key,
        seasonName: cfg.name,
        dateStr: dStr,
        dateLabel: `${dStr.slice(5)} (${cfg.name})`,
        sunriseTimeStr: ev.sunriseTimeStr,
        sunriseAzimuthDeg: ev.sunriseAzimuthDeg,
        sunriseDirectionName: getDirectionName16(ev.sunriseAzimuthDeg),
        solarNoonTimeStr: ev.solarNoonTimeStr,
        solarNoonAltitudeDeg: ev.solarNoonAltitudeDeg,
        sunsetTimeStr: ev.sunsetTimeStr,
        sunsetAzimuthDeg: ev.sunsetAzimuthDeg,
        sunsetDirectionName: getDirectionName16(ev.sunsetAzimuthDeg),
        daylightDurationStr: ev.daylightDurationStr,
        color: cfg.color,
      };
    });
  }, [seasonalDates, location]);

  // 再生ループ (requestAnimationFrameベース)
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const deltaMs = now - lastTime;
      lastTime = now;

      const minutesToAdd = (deltaMs / 1000) * (playbackSpeed * 1.5);

      setMinuteOfDay((prev) => {
        const next = prev + minutesToAdd;
        if (next >= 1439) {
          setIsPlaying(false);
          return 1439;
        }
        return next;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, playbackSpeed]);

  // キーボード操作対応
  useEffect(() => {
    const isInteractiveTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(
        target.closest('input, select, textarea, button, a[href], [role="button"], [contenteditable="true"]')
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;

      // ヘルプモーダル表示中はEscapeのみ処理し、背景操作を抑制
      if (isHelpOpen) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setIsHelpOpen(false);
        }
        return;
      }

      // フォーカス中のボタンや入力欄でのSpaceや矢印キーの操作を奪わない
      if (isInteractiveTarget(e.target)) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowRight' || e.key === 'ArrowRight') {
        e.preventDefault();
        setMinuteOfDay((prev) => Math.min(1439, prev + (e.shiftKey ? 30 : 5)));
      } else if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setMinuteOfDay((prev) => Math.max(0, prev - (e.shiftKey ? 30 : 5)));
      } else if (e.code === 'Escape' || e.key === 'Escape') {
        if (presentationMode) {
          setPresentationMode(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpOpen, presentationMode]);

  // プレゼンモード切替
  const handleTogglePresentation = () => {
    const nextMode = !presentationMode;
    setPresentationMode(nextMode);

    if (nextMode) {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // 軌道トグル
  const handleTogglePath = (key: 'selected' | SeasonKey) => {
    setVisiblePaths((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 時刻先頭リセット（日の出の30分前へ）
  const handleResetTime = () => {
    if (currentEvents.sunrise) {
      const sunriseMin = getMinutesOfDayJST(currentEvents.sunrise);
      setMinuteOfDay(Math.max(0, sunriseMin - 30));
    } else {
      setMinuteOfDay(360);
    }
  };

  return (
    <div className={`app-container ${presentationMode ? 'mode-presentation' : ''}`}>
      <Header
        presentationMode={presentationMode}
        onTogglePresentation={handleTogglePresentation}
        onOpenHelp={() => setIsHelpOpen(true)}
        onResetCamera={() => setCameraResetTrigger((t) => t + 1)}
      />

      <main className="main-content">
        {!presentationMode && (
          <aside className="sidebar">
            <ControlPanel
              location={location}
              onLocationChange={setLocation}
              selectedDateStr={selectedDateStr}
              onDateChange={setSelectedDateStr}
              seasonalDates={seasonalDates}
              visiblePaths={visiblePaths}
              onTogglePath={handleTogglePath}
              showHourTicks={showHourTicks}
              onToggleHourTicks={() => setShowHourTicks((v) => !v)}
              showSkyGrid={showSkyGrid}
              onToggleSkyGrid={() => setShowSkyGrid((v) => !v)}
              showLabels={showLabels}
              onToggleLabels={() => setShowLabels((v) => !v)}
              showSunRays={showSunRays}
              onToggleSunRays={() => setShowSunRays((v) => !v)}
              showHouseModel={showHouseModel}
              onToggleHouseModel={() => setShowHouseModel((v) => !v)}
            />
          </aside>
        )}

        <div className="viewport-and-data-area">
          <div className="viewport-wrapper">
            <Viewport3D
              solarPoint={currentSolarPoint}
              selectedDateStr={selectedDateStr}
              seasonalDates={seasonalDates}
              latitude={location.latitude}
              longitude={location.longitude}
              visiblePaths={visiblePaths}
              showHourTicks={showHourTicks}
              showSkyGrid={showSkyGrid}
              showLabels={showLabels}
              showSunRays={showSunRays}
              showHouseModel={showHouseModel}
              cameraResetTrigger={cameraResetTrigger}
            />
          </div>

          <div className="time-controls-wrapper">
            <TimeControls
              minuteOfDay={Math.floor(minuteOfDay)}
              onTimeChange={setMinuteOfDay}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              playbackSpeed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
              events={currentEvents}
              onResetTime={handleResetTime}
            />
          </div>

          <div className="metrics-wrapper">
            <MetricsPanel
              location={location}
              selectedDateStr={selectedDateStr}
              solarPoint={currentSolarPoint}
              events={currentEvents}
            />
          </div>

          <div className="comparison-wrapper">
            <ComparisonTable
              rows={comparisonRows}
              selectedDateStr={selectedDateStr}
              onSelectSeasonDate={setSelectedDateStr}
            />
          </div>
        </div>
      </main>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
