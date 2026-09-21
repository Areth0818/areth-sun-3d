import React from 'react';
import { Play, Pause, RotateCcw, Sunrise, Sun, Sunset } from 'lucide-react';
import { formatMinutesOfDay } from '../utils/dateTime';
import { SolarEvents } from '../app/types';

interface TimeControlsProps {
  minuteOfDay: number;
  onTimeChange: (minute: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  events: SolarEvents;
  onResetTime: () => void;
}

export const TimeControls: React.FC<TimeControlsProps> = ({
  minuteOfDay,
  onTimeChange,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onSpeedChange,
  events,
  onResetTime,
}) => {
  const handleJumpSunrise = () => {
    if (events.sunrise) {
      const m = (events.sunrise.getUTCHours() + 9) * 60 + events.sunrise.getUTCMinutes();
      onTimeChange(m);
    }
  };

  const handleJumpNoon = () => {
    if (events.solarNoon) {
      const m = (events.solarNoon.getUTCHours() + 9) * 60 + events.solarNoon.getUTCMinutes();
      onTimeChange(m);
    }
  };

  const handleJumpSunset = () => {
    if (events.sunset) {
      const m = (events.sunset.getUTCHours() + 9) * 60 + events.sunset.getUTCMinutes();
      onTimeChange(m);
    }
  };

  const speedOptions = [1, 4, 16];

  return (
    <div className="time-controls-card">
      <div className="time-header-row">
        <div className="time-display-group">
          <span className="time-label">時刻 (JST)</span>
          <span className="time-digital">{formatMinutesOfDay(minuteOfDay)}</span>
        </div>

        <div className="event-jumps-group">
          <button
            className="btn btn-event"
            onClick={handleJumpSunrise}
            disabled={!events.sunrise}
            title={`日の出時刻 (${events.sunriseTimeStr}) へ移動`}
          >
            <Sunrise size={16} className="text-emerald" />
            <span>日の出 {events.sunriseTimeStr}</span>
          </button>

          <button
            className="btn btn-event"
            onClick={handleJumpNoon}
            disabled={!events.solarNoon}
            title={`南中時刻 (${events.solarNoonTimeStr}) へ移動`}
          >
            <Sun size={16} className="text-amber" />
            <span>南中 {events.solarNoonTimeStr}</span>
          </button>

          <button
            className="btn btn-event"
            onClick={handleJumpSunset}
            disabled={!events.sunset}
            title={`日の入り時刻 (${events.sunsetTimeStr}) へ移動`}
          >
            <Sunset size={16} className="text-rose" />
            <span>日の入り {events.sunsetTimeStr}</span>
          </button>
        </div>

        <div className="playback-buttons-group">
          <button
            className="btn btn-outline btn-icon-only"
            onClick={onResetTime}
            title="日の出前（または0:00）へリセット"
            aria-label="先頭へ戻る"
          >
            <RotateCcw size={18} />
          </button>

          <button
            className={`btn ${isPlaying ? 'btn-warning' : 'btn-primary'} btn-play`}
            onClick={onTogglePlay}
            title={isPlaying ? "一時停止 (Space)" : "再生 (Space)"}
            aria-label={isPlaying ? "一時停止" : "再生"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            <span>{isPlaying ? '一時停止' : '再生'}</span>
          </button>

          <div className="speed-buttons">
            {speedOptions.map((s) => (
              <button
                key={s}
                className={`btn-speed ${playbackSpeed === s ? 'active-speed' : ''}`}
                onClick={() => onSpeedChange(s)}
                title={`再生速度 ${s}倍`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="slider-wrapper">
        <input
          type="range"
          min="0"
          max="1439"
          step="1"
          className="time-slider"
          value={minuteOfDay}
          onChange={(e) => onTimeChange(parseInt(e.target.value, 10))}
          aria-label="時刻スライダー（0時から24時）"
        />
        <div className="slider-ticks">
          <span>00:00</span>
          <span>03:00</span>
          <span>06:00</span>
          <span>09:00</span>
          <span>12:00</span>
          <span>15:00</span>
          <span>18:00</span>
          <span>21:00</span>
          <span>24:00</span>
        </div>
      </div>
    </div>
  );
};
