import React from 'react';
import { Compass, Clock, MapPin } from 'lucide-react';
import { LocationPreset, SolarPoint, SolarEvents } from '../app/types';
import { formatDegrees, formatJapaneseDate } from '../utils/formatting';

interface MetricsPanelProps {
  location: LocationPreset;
  selectedDateStr: string;
  solarPoint: SolarPoint;
  events: SolarEvents;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  location,
  selectedDateStr,
  solarPoint,
  events,
}) => {
  const isDay = solarPoint.isAboveHorizon;

  return (
    <div className="metrics-container">
      <div className="metrics-cards-grid">
        {/* 1. 太陽高度 */}
        <div className={`metric-card ${isDay ? 'card-sun' : 'card-night'}`}>
          <div className="card-header">
            <span className="card-label">太陽高度</span>
            {isDay ? (
              <span className="badge badge-amber">地平線上</span>
            ) : (
              <span className="badge badge-slate">地平線下</span>
            )}
          </div>
          <div className="card-value-row">
            <span className="card-huge-number">{formatDegrees(solarPoint.altitudeDeg)}</span>
            <span className="card-unit">度</span>
          </div>
          <div className="card-sub-info">
            {isDay ? (
              <span>南中高度: <strong>{formatDegrees(events.solarNoonAltitudeDeg)}</strong></span>
            ) : (
              <span className="text-muted">現在は夜間です</span>
            )}
          </div>
        </div>

        {/* 2. 太陽方位角 */}
        <div className="metric-card">
          <div className="card-header">
            <span className="card-label">太陽方位</span>
            <Compass size={18} className="text-primary" />
          </div>
          <div className="card-value-row">
            <span className="card-huge-number">{formatDegrees(solarPoint.azimuthDeg)}</span>
            <span className="direction-badge">{solarPoint.directionName}</span>
          </div>
          <div className="card-sub-info">
            <span>真北を0°とした時計回り方位</span>
          </div>
        </div>

        {/* 3. 日照イベント時刻 */}
        <div className="metric-card">
          <div className="card-header">
            <span className="card-label">本日の日照</span>
            <Clock size={18} className="text-muted" />
          </div>
          <div className="events-mini-grid">
            <div className="event-item">
              <span className="event-name text-emerald">日の出</span>
              <span className="event-time">{events.sunriseTimeStr}</span>
              <span className="event-azimuth">({formatDegrees(events.sunriseAzimuthDeg)})</span>
            </div>
            <div className="event-item">
              <span className="event-name text-amber">南中</span>
              <span className="event-time">{events.solarNoonTimeStr}</span>
              <span className="event-azimuth">({formatDegrees(events.solarNoonAltitudeDeg)})</span>
            </div>
            <div className="event-item">
              <span className="event-name text-rose">日の入り</span>
              <span className="event-time">{events.sunsetTimeStr}</span>
              <span className="event-azimuth">({formatDegrees(events.sunsetAzimuthDeg)})</span>
            </div>
          </div>
          <div className="card-sub-info">
            <span>昼の長さ: <strong>{events.daylightDurationStr}</strong></span>
          </div>
        </div>

        {/* 4. 地点・日付情報 */}
        <div className="metric-card metric-card-location">
          <div className="card-header">
            <span className="card-label">観測情報</span>
            <MapPin size={18} className="text-muted" />
          </div>
          <div className="location-info-content">
            <div className="location-city-name">
              {location.prefecture ? `${location.prefecture} ${location.name}` : location.name}
            </div>
            <div className="location-coords">
              北緯 {location.latitude.toFixed(4)}° / 東経 {location.longitude.toFixed(4)}°
            </div>
            <div className="location-date">
              {formatJapaneseDate(selectedDateStr)} (JST)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
