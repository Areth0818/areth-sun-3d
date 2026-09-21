import React from 'react';
import { Sun, Maximize2, Minimize2, HelpCircle, RotateCcw } from 'lucide-react';

interface HeaderProps {
  presentationMode: boolean;
  onTogglePresentation: () => void;
  onOpenHelp: () => void;
  onResetCamera: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  presentationMode,
  onTogglePresentation,
  onOpenHelp,
  onResetCamera,
}) => {
  return (
    <header className={`header ${presentationMode ? 'header-presentation' : ''}`}>
      <div className="header-left">
        <div className="logo-icon">
          <Sun className="icon-sun" size={24} />
        </div>
        <div>
          <h1 className="header-title">3D 太陽軌道シミュレーター</h1>
          <p className="header-subtitle">季節と時刻で変わる太陽の道 | Areth Design 住宅営業用</p>
        </div>
      </div>

      <div className="header-right">
        <button
          className="btn btn-secondary btn-header"
          onClick={onResetCamera}
          title="3D視点を南向き初期構図にリセット"
          aria-label="視点をリセット"
        >
          <RotateCcw size={18} />
          <span className="btn-text">視点リセット</span>
        </button>

        <button
          className="btn btn-secondary btn-header"
          onClick={onOpenHelp}
          title="この図の見方と太陽軌道の説明"
          aria-label="ヘルプ・見方の説明"
        >
          <HelpCircle size={18} />
          <span className="btn-text">図の見方</span>
        </button>

        <button
          className={`btn ${presentationMode ? 'btn-warning' : 'btn-primary'} btn-header`}
          onClick={onTogglePresentation}
          title={presentationMode ? "プレゼンモード終了 (Esc)" : "プレゼンモード開始 (大画面表示)"}
          aria-label="プレゼンモード切替"
        >
          {presentationMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          <span className="btn-text">{presentationMode ? '通常表示へ戻る' : 'プレゼン表示'}</span>
        </button>
      </div>
    </header>
  );
});
