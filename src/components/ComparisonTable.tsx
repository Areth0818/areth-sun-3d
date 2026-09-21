import React from 'react';
import { SeasonComparisonRow } from '../app/types';
import { formatDegrees } from '../utils/formatting';

interface ComparisonTableProps {
  rows: SeasonComparisonRow[];
  selectedDateStr: string;
  onSelectSeasonDate: (dateStr: string) => void;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  rows,
  selectedDateStr,
  onSelectSeasonDate,
}) => {
  return (
    <div className="comparison-table-wrapper">
      <div className="table-header-title-row">
        <h3 className="table-title">季節による日照の比較</h3>
        <span className="table-hint">※クリックするとその季節の日付へ切り替わります</span>
      </div>

      <div className="table-responsive">
        <table className="season-table">
          <thead>
            <tr>
              <th>季節</th>
              <th>代表日</th>
              <th>日の出</th>
              <th>日の出方位</th>
              <th>南中時刻</th>
              <th>南中高度</th>
              <th>日の入り</th>
              <th>日の入り方位</th>
              <th>昼の長さ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isCurrent = row.dateStr === selectedDateStr;
              return (
                <tr
                  key={row.seasonKey}
                  className={`season-row ${isCurrent ? 'row-selected' : ''}`}
                  onClick={() => onSelectSeasonDate(row.dateStr)}
                  title={`${row.seasonName} (${row.dateStr}) を選択`}
                >
                  <td className="season-name-cell">
                    <span className="color-dot" style={{ backgroundColor: row.color }} />
                    <strong>{row.seasonName}</strong>
                  </td>
                  <td>{row.dateLabel}</td>
                  <td>{row.sunriseTimeStr}</td>
                  <td>
                    {formatDegrees(row.sunriseAzimuthDeg)}
                    <span className="sub-dir"> ({row.sunriseDirectionName})</span>
                  </td>
                  <td>{row.solarNoonTimeStr}</td>
                  <td className="altitude-cell">
                    <strong>{formatDegrees(row.solarNoonAltitudeDeg)}</strong>
                  </td>
                  <td>{row.sunsetTimeStr}</td>
                  <td>
                    {formatDegrees(row.sunsetAzimuthDeg)}
                    <span className="sub-dir"> ({row.sunsetDirectionName})</span>
                  </td>
                  <td>{row.daylightDurationStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
