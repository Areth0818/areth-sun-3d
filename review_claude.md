ファイルへの書き込み権限が許可されていないため、レビュー内容はここに直接出力します。

# 3D太陽軌道シミュレーター 詳細コードレビュー

対象: `AGENTS.md` / `README.md` / `src/` 全体（React層・Three.js層・計算ロジック層）
観点: ①React/UI設計 ②Three.js/WebGL設計 ③エラー処理・入力検証・エッジケース

---

## 総評

計算ロジック（`coordinateTransform.ts` / `solarPosition.ts`）自体は座標系定義・単体テスト・NAOJベンチマーク（`benchmarks.ts`）まで整備されており堅牢です。一方で、**UI層でその計算結果を「時刻（分）」へ変換する箇所に、JSTの日跨ぎを考慮していない致命的なバグ**が5箇所に重複実装されており、「日の出」関連の主要操作が実質的に壊れています。加えてThree.js層では**軌道再構築のたびにGPUリソース（ジオメトリ/マテリアル/テクスチャ）が解放されない**という、長時間の商談デモで進行的に悪化するメモリリークがあります。これらはAGENTS.mdの非交渉ルール（「表示値と3D描画は同一の計算結果を使う」「表示時刻はJST」）に直接抵触するため、最優先で修正すべきです。

---

## 1. React/UI設計

### 1.1 状態管理

- `App.tsx` は10個以上の独立した`useState`をフラットに保持しています（`location`, `selectedDateStr`, `minuteOfDay`, `isPlaying`, `playbackSpeed`, `presentationMode`, `isHelpOpen`, `cameraResetTrigger`, `visiblePaths`, `showHourTicks`...）。関連性の強い表示トグル群（`showHourTicks`〜`showHouseModel`）は`useReducer`か単一オブジェクトstateにまとめると、`ControlPanel`への props バケツリレー（8個の`show*`/`onToggle*`ペア）を削減できます。緊急度は低いですが、今後トグルが増えるたびに`App.tsx`↔`ControlPanel.tsx`のprops面が線形に増える設計です。
- `cameraResetTrigger`をカウンタとして使い`useEffect`の依存配列で検知する実装（`App.tsx:33`, `Viewport3D.tsx:97-100`）は、Reactの慣習的な「命令的トリガー」パターンとして妥当です。

### 1.2 レンダリング最適化

- **再生中の全ツリー再描画**: `isPlaying`時、`requestAnimationFrame`ループが`setMinuteOfDay`を毎フレーム呼びます（`App.tsx:117-124`、最大60回/秒）。`ControlPanel`・`ComparisonTable`・`Header`は`minuteOfDay`に一切依存しない純粋な表示ですが、`React.memo`でラップされていないため、`App`の再レンダリングのたびに**全て道連れで再レンダリング**されます。商談中にノートPCで長時間再生し続けるケースを考えると、CPU負荷の観点から`ControlPanel` / `ComparisonTable` / `Header`への`React.memo`適用が有効です。
- **Viewport3Dのeffect依存範囲が広すぎる**: `visiblePaths`のどれか1つをトグルしただけで`updatePaths`が呼ばれ（`Viewport3D.tsx:70-80`）、`SunScene.updatePaths`は**表示中の軌道を全て**作り直します（2.1節で詳述）。本来は変更された軌道1本だけを追加/削除すればよく、React側のeffect設計とThree.js側の再構築ロジックの両方が「差分更新」ではなく「全再構築」になっている点が、React/Three.js境界での設計上の弱点です。

### 1.3 アクセシビリティ（A11y）

- `src/index.css:558-566` の `.time-slider { outline: none; }` は、代替のフォーカスリング（box-shadowなど）を用意せずにデフォルトのフォーカス表示を消しています。同じファイル内の`.select-input`/`.date-input`/`.number-input`（`index.css:264-268`）は`outline: none`の代わりに`box-shadow`を付与していますが、時刻スライダーだけ代替がありません。キーボード操作者が現在フォーカス中か視認できません。
- `ComparisonTable.tsx:42-46` の季節行は`onClick`のみで選択できますが、`<tr>`に`role`/`tabIndex`/`onKeyDown`が無く、**キーボード操作・スクリーンリーダーから選択不可能**です（`title`属性はスクリーンリーダーに読み上げ保証がありません）。`<button>`でラップするか、`role="button" tabIndex={0}`＋Enter/Spaceハンドラの追加が必要です。
- `App.tsx:140-142` のグローバルSpaceキーハンドラは、`INPUT`/`SELECT`/`TEXTAREA`のときのみ無視しますが、それ以外の**フォーカス可能な`<button>`（ヘッダーのボタン、視点プリセットボタン等）にフォーカスがある状態でもSpaceを乗っ取り**、`e.preventDefault()`しているため標準のボタン活性化（Space押下でクリック）が働きません。キーボードユーザーの慣習的期待（フォーカス中のボタンをSpaceで押せる）を裏切る設計です。
- `HelpModal.tsx:13` は`role="dialog" aria-modal="true"`を設定していますが、`aria-labelledby`でタイトル（`modal-title`）と関連付けていません。また開いた際に閉じるボタン等へ初期フォーカスを移動する処理、フォーカストラップ、閉じた後に呼び出し元へフォーカスを戻す処理も無く、スクリーンリーダー/キーボードユーザーには背景コンテンツへのフォーカス移動を防げません。
- 好ましい点: `MetricsPanel`/`ComparisonTable`はWebGL Canvas内では完結せず、**太陽高度・方位・日照時刻を通常のDOMテキストとして重複表示**しており、Canvasが読み上げられない環境でも数値情報自体は取得可能です。これは良い設計です。

### 1.4 商談視認性

- `handleTogglePresentation`（`App.tsx:163-176`）は`requestFullscreen().catch(() => {})`で失敗を握りつぶしています。企業PCのポリシーやiframe埋め込み等でFullscreen APIが拒否された場合、`presentationMode`のUI（サイドバー非表示等）だけが切り替わり、実際にはフルスクリーンにならず、ユーザーには何が起きたか分かりません。エラー時にトースト等でフィードバックすべきです。
- `index.html:9-12` はGoogle FontsをCDN経由で読み込んでおり、AGENTS.mdの非交渉ルール「外部CDNだけに依存しない」に反しています。商談先のWi-Fi/ファイアウォールでGoogleドメインがブロックされると、フォントが読み込めずシステムフォントにフォールバックします（クラッシュはしませんが、見た目の統一感が損なわれた状態で気づかず商談に臨むリスクがあります）。`@fontsource`等でのセルフホスト化を推奨します。
- 常時60fps・2048²ソフトシャドウでの継続レンダリング（`SunScene.animate`, 2.1節）は、ノートPCの発熱・ファン音・バッテリー消費に直結し、長時間の対面商談での体験に影響し得ます。

---

## 2. Three.js/WebGL設計

### 2.1 描画負荷

- `SunPath.ts`の`buildSinglePath`は、`generateDayPathPoints`で1日を2分刻み（約721点）サンプリングし、さらに内部で`findSolarNoon`（探索ループ約325回のSunCalc評価）と`calculateSolarEvents`（これも内部で`findSolarNoon`を再度呼ぶため、実質**南中探索が二重に実行**されています）を呼び出します。1本の軌道あたり概算で**1,000回超のSunCalc同期評価**が発生し、これが選択日＋最大4季節分＝最大5本、**メインスレッドをブロックする形**で`useEffect`内から呼ばれます（`Viewport3D.tsx:70-80`）。日付をドラッグ操作で変更した際や季節軌道のチェックボックスを連打した際に、UIが一時的にフリーズするリスクがあります。デバウンス、Web Worker化、またはメモ化（`findSolarNoon`の結果を`calculateSolarEvents`と共有）が有効です。
- `SunScene.updatePaths` → `SunPath.updatePaths`（`SunPath.ts:184-234`）は、**軌道チェックボックスを1つトグルしただけでも表示中の全軌道を作り直します**。変更されたキーだけを追加/削除する差分更新にすべきです。
- `TubeGeometry`のセグメント数は`Math.max(64, abovePts.length * 2)`（`SunPath.ts:74`）で、夏至など日照時間の長い日は1,000〜1,400セグメント規模になります。これを日付が変わるたびに毎回フル再生成するのはコストが高く、`BufferGeometry`の位置属性更新の使い回し等での軽量化余地があります。
- `SunScene.animate()`（`SunScene.ts:125-130`）はダーティチェックなしに永続的に`requestAnimationFrame`で毎フレーム`renderer.render`を実行し続けます。`OrbitControls`のダンピング用に必要ですが、カメラ・太陽位置とも静止している間もフル解像度・フルシャドウで描画し続けるため、"render on demand"（変化があったときだけ再描画）への切り替えでGPU負荷を下げられます。

### 2.2 影品質

- `PCFSoftShadowMap` + 2048×2048 + 住宅周辺±18mに最適化されたシャドウカメラ視錐台（`SunScene.ts:85-94`）は、住宅モデルのスケール感に対して妥当な設定です。
- `sunLight.intensity = Math.max(0.3, Math.sin(altRad)) * 1.5`（`SunScene.ts:187-189`）は、太陽高度が地平線付近まで下がっても光量が0.3未満に下がらない設計です。夕景の暗さの演出という意味では意図的な可能性がありますが、日没直前でも室内が明るいままに見えるため、「軒による遮蔽効果」の説明シーンで実際の見え方と齟齬が出る可能性があります。意図的な仕様かどうかの確認を推奨します。
- `HouseModel.ts`内、窓ガラス（`window1FGlass`/`window2FGlass`/採光スリット）が`castShadow`/`receiveShadow`を設定していないのは合理的ですが、窓枠（`window1FFrame`/`window2FFrame`/`door`）も同様に未設定です。枠は本来わずかな影を落とすはずで、視覚的ディテールとして意図的な省略か見落としかが不明瞭です。
- `point.isAboveHorizon`の切り替えごとに`sunLight.castShadow`をtrue/falseへ毎回トグルしています（`SunScene.ts:190, 195`）。日没・日の出付近で高頻度にトグルが起きる場合、追加の描画コストになり得ます。

### 2.3 破棄処理（メモリリーク）— 最重要

- **`SunScene.dispose()`（`SunScene.ts:239-251`）は`renderer`と`controls`のみを破棄し、シーングラフ内のジオメトリ・マテリアル・テクスチャを一切traverseして解放していません。** `skyDome`・`compass`・`sunPath`・`sunObject`・`houseModel`が保持する多数のGeometry/Material/CanvasTextureはリークしたままになります。`main.tsx`で`React.StrictMode`が有効なため、開発時はeffectのマウント/アンマウントが二重実行され、このリークが早期から顕在化します。
- **`SunPath.updatePaths`（`SunPath.ts:192-196`）は最も深刻です。** 日付変更・地点変更・軌道表示トグルのたびに、古い`pathGroups[key]`は`group.remove()`でシーングラフから外されるだけで、内部の`TubeGeometry`・`LineDashedMaterial`・`SphereGeometry`・`MeshBasicMaterial`・ラベル`Sprite`の`CanvasTexture`は一切`.dispose()`されていません。これは**エッジケースではなく、通常の商談操作（日付をスライド、季節軌道をON/OFF）のたびに毎回発生**します。長時間の商談で日付をいろいろ動かして見せるという本アプリの主目的の使い方そのものが、GPUメモリを線形に消費し続け、最悪WebGLコンテキストロスト（描画が突然止まる/真っ黒になる）を招きかねません。
- `buildHourTicks`（`SunPath.ts:149-179`）は古いマーカーの`.geometry.dispose()`のみ呼び、`.material`とラベルスプライトの`CanvasTexture`/`SpriteMaterial`は未解放です。
- 対応方針: `group.traverse(obj => { obj.geometry?.dispose(); obj.material?.map?.dispose(); obj.material?.dispose(); })`のようなヘルパーを用意し、`group.remove()`の前に必ず呼ぶ運用に統一することを推奨します。

---

## 3. エラー処理・入力検証・エッジケース

### 3.1 JST変換バグ（日の出関連操作が実質破綻）— 最優先

`getUTCHours() + 9` で「その日のJST分」を求める同一パターンが5箇所に重複実装されています。

```
App.tsx:189                            （先頭へ戻る＝日の出30分前リセット）
TimeControls.tsx:29, 36, 43            （日の出/南中/日の入りジャンプボタン）
SunPath.ts:126, 135                    （軌道上の日の出/日の入りマーカー配置）
```

このロジックは、**JST時刻がUTCで前日に属する場合（＝JST 0:00〜8:59のケース。日本の日の出は年間を通じてほぼ常にこの範囲）に破綻します**。具体例（大阪・夏至の日の出 04:46 JST ＝ 前日19:46 UTC）：

```
誤: (19 + 9) * 60 + 46 = 1726分   （本来より丸1日＝1440分多い）
正: 4 * 60 + 46 = 286分
```

結果として「日の出」ジャンプボタン・「先頭へ戻る」ボタンを押すと、`minuteOfDay`に1726がセットされ、`formatMinutesOfDay`が範囲外値を`23:59`にクランプして**表示**する一方、`calculateSolarPoint`はクランプなしの1726分（＝翌日04:46扱い）を使って**3D太陽位置**を計算します。結果、数値表示は「23:59」、3D描画は「翌日の日の出」という状態になり、AGENTS.mdの非交渉ルール「表示値と3D描画は同一の計算結果を使う」に直接違反します。南中・日の入りジャンプは（JST時刻が9時以降のため）たまたま正しく動作しますが、同じ壊れた式を再利用している設計自体が脆弱です。

**修正方針**: 既に正しい実装が`dateTime.ts`の`getDatePartsJST(date).minutesOfDay`として存在します。上記5箇所をすべてこのユーティリティ呼び出しに置き換えるべきです。

### 3.2 日付入力のバリデーション未接続

- `validation.ts`に`validateDateStr`が定義され単体テスト（`tests/validation.test.ts`）まで存在しますが、**アプリ内のどこからも呼ばれていません**。`ControlPanel.tsx:209-216`の`<input type="date">`には`min`/`max`属性も無く、`onChange`も値の有無しかチェックしていません。ブラウザによっては極端な年の自由入力を許容するため、`createDateFromJST`や`getSeasonalDates`（1980〜2099年前提とコメントあり）に範囲外の値がそのまま渡ります。`formatDegrees`等はNaNガードがあり表示は壊れませんが、`findSolarNoon`のループや3D軌道生成には範囲外ガードが無く、無意味な3D位置が「エラーなく」描画される可能性があります。`validateDateStr`をUIに接続し、`<input>`にも`min="1900-01-01" max="2100-12-31"`を追加すべきです。
- 緯度・経度は`validateLatitude`/`validateLongitude`が`ControlPanel.handleCustomApply`（`ControlPanel.tsx:75-99`）で適切に配線されています。ただしエラー時、無効な値がテキストフィールドに残ったまま（直前の有効値に戻らない）で、どちら（緯度/経度）が無効かをメッセージが特定しない点はUX上の改善余地です。

### 3.3 高緯度（極夜・極昼）エッジケース

- `calculateSolarEvents`は`times.sunrise`/`times.sunset`が`NaN`の場合`null`に正規化し、UIも`disabled={!events.sunrise}`等で防御的に扱っています（良い設計）。一方`findSolarNoon`（`solarEvents.ts:43-81`）はブルートフォース探索のため、極夜（太陽が一日中沈んだまま）でも**必ず何らかの「南中時刻・南中高度」を返してしまい**、UI上は通常の日と同じ見た目で「南中」が表示されます。太陽が実際には昇らない日にもっともらしい南中情報が出るのは誤解を招きます。`validateLatitude`が±90°まで許容している一方、README/AGENTSは日本国内利用が前提であり、バリデーション範囲と製品スコープが一致していません。

### 3.4 WebGLコンテキストロスト未対応

- `Viewport3D.tsx:46-56`は初期化時のWebGLコンテキスト取得可否のみ判定し、日本語のエラーパネルを表示する丁寧な設計です。しかし**実行中の`webglcontextlost`イベント**（GPUドライバのクラッシュ・スリープ復帰時のリセット等）を監視しておらず、発生時はCanvasが無反応/真っ黒になるだけでユーザーへの通知がありません。長時間の商談利用を想定するなら、`webglcontextlost`リスナーで既存のエラーパネルへフォールバックする実装を推奨します。

---

## 優先改善項目まとめ

| 優先度 | 項目 | 該当箇所 |
|---|---|---|
| **P0** | JST変換バグの一本化修正（`getDatePartsJST`へ統一） | `App.tsx:189`, `TimeControls.tsx:29,36,43`, `SunPath.ts:126,135` |
| **P0** | Three.js破棄処理の徹底（軌道再構築時・`SunScene.dispose()`時のgeometry/material/texture解放） | `SunPath.ts:192-196,149-179`, `SunScene.ts:239-251` |
| **P1** | 日付入力バリデーションの接続（`validateDateStr`配線＋`min`/`max`属性） | `ControlPanel.tsx:209-216` |
| **P1** | 軌道再構築の差分更新化・SunCalc呼び出しの重複排除（`findSolarNoon`二重実行の解消） | `SunPath.ts:29-239`, `solarEvents.ts:86-134` |
| **P2** | 再生中の全体再レンダリング抑制（`React.memo`適用） | `ControlPanel.tsx`, `ComparisonTable.tsx`, `Header.tsx` |
| **P2** | Google Fontsのセルフホスト化（CDN単独依存の解消） | `index.html:9-12` |
| **P2** | WebGLコンテキストロスト検知・フォールバック表示 | `Viewport3D.tsx` |
| **P3** | A11y改善（time-sliderのフォーカス表示、ComparisonTable行のキーボード操作、Spaceキー競合、HelpModalのフォーカス管理） | `index.css:558-566`, `ComparisonTable.tsx:42-46`, `App.tsx:140-142`, `HelpModal.tsx` |
| **P3** | 高緯度極夜時の南中表示の誤解防止、カスタム座標入力のエラーフィードバック改善 | `solarEvents.ts:43-81`, `ControlPanel.tsx:75-99` |

---

なお、このディレクトリには既存の `review_codex.md`（Codexによる先行レビュー）が存在し、私も独立にコード追跡した結果、そちらが指摘するJST変換バグ（同一箇所）を自分の解析でも再現・確認しました。`review_claude.md` への書き込みはツール権限が未許可のため実施していません。保存をご希望であれば、権限を許可いただくか、上記内容をそのままファイルに貼り付けてください。
