import React, { useState } from 'react';
import { MapPin, Calendar, Layers, Eye, RotateCcw } from 'lucide-react';
import { LocationPreset, SeasonKey } from '../app/types';
import { LOCATION_PRESETS, DEFAULT_LOCATION, SEASON_CONFIG, PATH_STYLES } from '../app/constants';
import { validateLatitude, validateLongitude } from '../utils/validation';

interface ControlPanelProps {
  location: LocationPreset;
  onLocationChange: (loc: LocationPreset) => void;
  selectedDateStr: string;
  onDateChange: (dateStr: string) => void;
  seasonalDates: Record<SeasonKey, string>;
  visiblePaths: {
    selected: boolean;
    spring: boolean;
    summer: boolean;
    autumn: boolean;
    winter: boolean;
  };
  onTogglePath: (key: 'selected' | SeasonKey) => void;
  showHourTicks: boolean;
  onToggleHourTicks: () => void;
  showSkyGrid: boolean;
  onToggleSkyGrid: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  showSunRays: boolean;
  onToggleSunRays: () => void;
  showHouseModel: boolean;
  onToggleHouseModel: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  location,
  onLocationChange,
  selectedDateStr,
  onDateChange,
  seasonalDates,
  visiblePaths,
  onTogglePath,
  showHourTicks,
  onToggleHourTicks,
  showSkyGrid,
  onToggleSkyGrid,
  showLabels,
  onToggleLabels,
  showSunRays,
  onToggleSunRays,
  showHouseModel,
  onToggleHouseModel,
}) => {
  const [isCustomLoc, setIsCustomLoc] = useState(false);
  const [customLat, setCustomLat] = useState(location.latitude.toString());
  const [customLng, setCustomLng] = useState(location.longitude.toString());
  const [locError, setLocError] = useState<string | null>(null);

  // 都市セレクト変更
  const handleCitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (id === 'custom') {
      setIsCustomLoc(true);
      return;
    }
    const found = LOCATION_PRESETS.find((p) => p.id === id);
    if (found) {
      setIsCustomLoc(false);
      setCustomLat(found.latitude.toString());
      setCustomLng(found.longitude.toString());
      setLocError(null);
      onLocationChange(found);
    }
  };

  // 緯度経度手入力の適用
  const handleCustomApply = () => {
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);

    const latVal = validateLatitude(lat);
    if (!latVal.isValid) {
      setLocError(latVal.errorMessage || "無効な緯度です");
      return;
    }
    const lngVal = validateLongitude(lng);
    if (!lngVal.isValid) {
      setLocError(lngVal.errorMessage || "無効な経度です");
      return;
    }

    setLocError(null);
    onLocationChange({
      id: "custom",
      name: `手入力 (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
      prefecture: "カスタム地点",
      latitude: lat,
      longitude: lng,
      timezone: "Asia/Tokyo",
    });
  };

  // 初期値（茨木市）へ戻す
  const handleResetLocation = () => {
    setIsCustomLoc(false);
    setCustomLat(DEFAULT_LOCATION.latitude.toString());
    setCustomLng(DEFAULT_LOCATION.longitude.toString());
    setLocError(null);
    onLocationChange(DEFAULT_LOCATION);
  };

  // 今日の日付をセット
  const handleSetToday = () => {
    const now = new Date();
    // JSTの今日
    const jstMs = now.getTime() + 9 * 3600 * 1000;
    const jstDate = new Date(jstMs);
    const yyyy = jstDate.getUTCFullYear();
    const mm = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(jstDate.getUTCDate()).padStart(2, '0');
    onDateChange(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div className="control-panel">
      {/* 1. 地点セクション */}
      <section className="panel-section">
        <div className="section-header">
          <MapPin size={18} className="text-primary" />
          <h2 className="section-title">観測地点</h2>
        </div>

        <div className="form-group">
          <label htmlFor="city-select" className="form-label">主要都市プリセット</label>
          <div className="select-row">
            <select
              id="city-select"
              className="select-input"
              value={isCustomLoc ? 'custom' : location.id}
              onChange={handleCitySelect}
              aria-label="都市プリセット選択"
            >
              {LOCATION_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.prefecture ? `${p.prefecture} ${p.name}` : p.name}
                </option>
              ))}
              <option value="custom">緯度・経度を手入力...</option>
            </select>

            <button
              className="btn btn-outline btn-icon-only"
              onClick={handleResetLocation}
              title="初期地点（茨木市）へ戻す"
              aria-label="初期地点へ戻す"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        {/* 緯度経度の手入力フィールド */}
        <div className="coords-grid">
          <div className="coord-input-group">
            <label htmlFor="lat-input" className="form-label-sub">北緯 (°)</label>
            <input
              id="lat-input"
              type="number"
              step="0.0001"
              min="-90"
              max="90"
              className="number-input"
              value={customLat}
              onChange={(e) => {
                setCustomLat(e.target.value);
                setIsCustomLoc(true);
              }}
              onBlur={handleCustomApply}
            />
          </div>
          <div className="coord-input-group">
            <label htmlFor="lng-input" className="form-label-sub">東経 (°)</label>
            <input
              id="lng-input"
              type="number"
              step="0.0001"
              min="-180"
              max="180"
              className="number-input"
              value={customLng}
              onChange={(e) => {
                setCustomLng(e.target.value);
                setIsCustomLoc(true);
              }}
              onBlur={handleCustomApply}
            />
          </div>
        </div>
        {locError && <p className="error-text">{locError}</p>}
      </section>

      {/* 2. 日付セクション */}
      <section className="panel-section">
        <div className="section-header">
          <Calendar size={18} className="text-primary" />
          <h2 className="section-title">シミュレーション日付</h2>
        </div>

        <div className="form-group">
          <label htmlFor="date-picker" className="form-label">日付選択 (JST)</label>
          <input
            id="date-picker"
            type="date"
            className="date-input"
            value={selectedDateStr}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            aria-label="シミュレーション日付"
          />
        </div>

        {/* 代表日ショートカットボタン */}
        <div className="season-buttons-grid">
          <button
            className="btn btn-season btn-today"
            onClick={handleSetToday}
            title="今日の日付を設定"
          >
            今日
          </button>
          <button
            className={`btn btn-season ${selectedDateStr === seasonalDates.spring ? 'active-season' : ''}`}
            onClick={() => onDateChange(seasonalDates.spring)}
            style={{ borderColor: SEASON_CONFIG.spring.color }}
            title="春分日を設定（真東から昇り真西へ沈む）"
          >
            春分 ({seasonalDates.spring.slice(5)})
          </button>
          <button
            className={`btn btn-season ${selectedDateStr === seasonalDates.summer ? 'active-season' : ''}`}
            onClick={() => onDateChange(seasonalDates.summer)}
            style={{ borderColor: SEASON_CONFIG.summer.color }}
            title="夏至日を設定（太陽が最も高い）"
          >
            夏至 ({seasonalDates.summer.slice(5)})
          </button>
          <button
            className={`btn btn-season ${selectedDateStr === seasonalDates.autumn ? 'active-season' : ''}`}
            onClick={() => onDateChange(seasonalDates.autumn)}
            style={{ borderColor: SEASON_CONFIG.autumn.color }}
            title="秋分日を設定（真東から昇り真西へ沈む）"
          >
            秋分 ({seasonalDates.autumn.slice(5)})
          </button>
          <button
            className={`btn btn-season ${selectedDateStr === seasonalDates.winter ? 'active-season' : ''}`}
            onClick={() => onDateChange(seasonalDates.winter)}
            style={{ borderColor: SEASON_CONFIG.winter.color }}
            title="冬至日を設定（太陽が最も低い）"
          >
            冬至 ({seasonalDates.winter.slice(5)})
          </button>
        </div>
      </section>

      {/* 3. 軌道・比較表示セクション */}
      <section className="panel-section">
        <div className="section-header">
          <Layers size={18} className="text-primary" />
          <h2 className="section-title">軌道表示・季節比較</h2>
        </div>

        <div className="toggles-list">
          {/* 選択日 */}
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={visiblePaths.selected}
              onChange={() => onTogglePath('selected')}
            />
            <span className="color-badge" style={{ backgroundColor: PATH_STYLES.selected.color }} />
            <span className="toggle-label font-bold">選択日の軌道</span>
          </label>

          {/* 夏至 */}
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={visiblePaths.summer}
              onChange={() => onTogglePath('summer')}
            />
            <span className="color-badge" style={{ backgroundColor: SEASON_CONFIG.summer.color }} />
            <span className="toggle-label">夏至の軌道 (高・北寄り)</span>
          </label>

          {/* 春分 */}
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={visiblePaths.spring}
              onChange={() => onTogglePath('spring')}
            />
            <span className="color-badge" style={{ backgroundColor: SEASON_CONFIG.spring.color }} />
            <span className="toggle-label">春分の軌道 (真東→真西)</span>
          </label>

          {/* 秋分 */}
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={visiblePaths.autumn}
              onChange={() => onTogglePath('autumn')}
            />
            <span className="color-badge" style={{ backgroundColor: SEASON_CONFIG.autumn.color }} />
            <span className="toggle-label">秋分の軌道 (真東→真西)</span>
          </label>

          {/* 冬至 */}
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={visiblePaths.winter}
              onChange={() => onTogglePath('winter')}
            />
            <span className="color-badge" style={{ backgroundColor: SEASON_CONFIG.winter.color }} />
            <span className="toggle-label">冬至の軌道 (低・南寄り)</span>
          </label>
        </div>
      </section>

      {/* 4. 表示オプション */}
      <section className="panel-section">
        <div className="section-header">
          <Eye size={18} className="text-primary" />
          <h2 className="section-title">補助表示</h2>
        </div>

        <div className="toggles-list">
          <label className="toggle-item">
            <input
              type="checkbox"
              checked={showHouseModel}
              onChange={onToggleHouseModel}
            />
            <span className="toggle-label font-bold text-primary">参考住宅モデル (2階建て & 日影)</span>
          </label>

          <label className="toggle-item">
            <input
              type="checkbox"
              checked={showHourTicks}
              onChange={onToggleHourTicks}
            />
            <span className="toggle-label">軌道の時刻目盛り (2時間毎)</span>
          </label>

          <label className="toggle-item">
            <input
              type="checkbox"
              checked={showSunRays}
              onChange={onToggleSunRays}
            />
            <span className="toggle-label">太陽光線・投影ガイド</span>
          </label>

          <label className="toggle-item">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={onToggleLabels}
            />
            <span className="toggle-label">方位・太陽ラベル</span>
          </label>

          <label className="toggle-item">
            <input
              type="checkbox"
              checked={showSkyGrid}
              onChange={onToggleSkyGrid}
            />
            <span className="toggle-label">天空グリッド (高度/方位線)</span>
          </label>
        </div>
      </section>
    </div>
  );
};
