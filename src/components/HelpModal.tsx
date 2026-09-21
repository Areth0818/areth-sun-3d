import React from 'react';
import { X, Info, AlertTriangle, Compass, Sun } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Info className="text-primary" size={24} />
            <h2 className="modal-title">この図の見方・営業説明のポイント</h2>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* 1. 太陽軌道と季節差のポイント */}
          <section className="modal-section">
            <h3 className="modal-section-title">
              <Sun className="text-amber" size={18} />
              季節による太陽の動きの違い
            </h3>
            <ul className="help-points-list">
              <li>
                <strong>夏至（6月21日前後）:</strong> 太陽が1年で最も高い軌道を通ります。正午付近の高度は約78°にも達し、真上近くから照りつけます。また、日の出・日の入りは北寄りになります。
              </li>
              <li>
                <strong>冬至（12月21日前後）:</strong> 太陽が1年で最も低い軌道を通ります。正午でも高度は約31°程度と低く、部屋の奥深くまで光が差し込みます。日の出・日の入りは南寄りになります。
              </li>
              <li>
                <strong>春分・秋分（3月20日 / 9月23日前後）:</strong> 太陽は概ね<strong>真東から昇り、真西へと沈みます</strong>。昼と夜の長さがほぼ同じになります。
              </li>
            </ul>
          </section>

          {/* 2. 角度と方位の定義 */}
          <section className="modal-section">
            <h3 className="modal-section-title">
              <Compass className="text-primary" size={18} />
              太陽高度と方位角の定義
            </h3>
            <div className="definition-cards-grid">
              <div className="def-card">
                <span className="def-card-title">太陽高度（高度角）</span>
                <p>地平線を <strong>0°</strong>、真上（天頂）を <strong>90°</strong> とした角度です。太陽が地平線の下にある夜間はマイナス値となります。</p>
              </div>
              <div className="def-card">
                <span className="def-card-title">方位角</span>
                <p><strong>真北を 0°</strong> として時計回りに測定します。<br />
                <strong>東 = 90°</strong>、<strong>南 = 180°</strong>、<strong>西 = 270°</strong> です。</p>
              </div>
            </div>
          </section>

          {/* 3. 3D空間の操作方法 */}
          <section className="modal-section">
            <h3 className="modal-section-title">3Dビューの操作方法</h3>
            <ul className="help-points-list">
              <li><strong>回転:</strong> マウス左ドラッグ（または1本指タッチ）で360度自由に見回せます。</li>
              <li><strong>ズーム:</strong> マウスホイール（またはピンチ操作）で拡大・縮小できます。</li>
              <li><strong>視点リセット:</strong> 画面右上の「視点リセット」ボタンで、南向きの初期構図へいつでも戻せます。</li>
              <li><strong>キーボード:</strong> スペースキーで再生/一時停止、左右矢印キーで時刻操作が可能です。</li>
            </ul>
          </section>

          {/* 4. 免責事項 */}
          <section className="modal-section disclaimer-section">
            <div className="disclaimer-header">
              <AlertTriangle className="text-amber" size={18} />
              <h3 className="disclaimer-title">免責・ご利用上の注意</h3>
            </div>
            <p className="disclaimer-text">
              本シミュレーターは、住宅商談・研修における季節や時間帯による太陽軌道の概念説明を目的とした概算ツールです。周辺の建物・地形・山林による影、窓・庇による遮蔽、気象条件、厳密な大気差等は考慮されていません。建築基準法に基づく日影規制や法的判定、採光計算、日照権等の公的保証用途には利用できません。
            </p>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            理解しました
          </button>
        </div>
      </div>
    </div>
  );
};
