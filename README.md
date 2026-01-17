# hyperapp-ui

HyperappでのUI構築を支援する、再利用可能なコンポーネントと状態操作ユーティリティです。
Reusable UI components and state management utilities for Hyperapp.

[example](https://is4416.github.io/hyperapp-ui/)

本ライブラリは **イミュータブルなステート更新** と **シンプルな副作用管理** を前提として設計されています。
JSX を使用する場合は `hyperapp-jsx-pragma` を前提としています。

## Functions / 関数リスト

- [getValue](#getvalue)
- [setValue](#setvalue)
- [getLocalState](#getlocalstate)
- [setLocalState](#setlocalstate)
- [el](#el)
- [concatAction](#concataction)
- [getClassList](#getclasslist)
- [deleteKeys](#deletekeys)
- [Route](#route)
- [SelectButton](#selectbutton)
- [OptionButton](#optionbutton)
- [effect_initializeNodes](#effect_initializenodes)
- [effect_setTimedValue](#effect_settimedvalue)
- [effect_throwMessage](#effect_throwmessage)
- [effect_pauseThrowMessage](#effect_pausethrowmessage)
- [effect_resumeThrowMessage](#effect_resumethrowmessage)
- [subscription_nodesCleanup](#subscription_nodescleanup)
- [subscription_nodesLifecycleByIds](#subscription_nodeslifecyclebyids)
- [subscription_rAFManager](#subscription_rafmanager)
- [effect_rAFProperties](#effect_rafproperties)
- [getScrollMargin](#getscrollmargin)

## Design / 設計方針

### ライブラリの目的

Hyperapp はステートの形に制約がないため、コンポーネントを作る際にはどのステートを参照・更新するかを事前に決めておく必要があります。
本ライブラリでは、コンポーネントに「目的の値がどこにあるか」を通知する設計を採用。
これにより、コンポーネントはアプリごとに使い捨てにならず、自由度を保てます。

### 基本的なステート操作関数

- `getValue` / `setValue` : パスを指定して値を取得・設定
- `getLocalState` / `setLocalState` : コンポーネント内部の一時状態を ID キーで管理

### DOM 初期化・アクション補助

- `effect_initializeNodes` : VNode マウント後の初期化処理（サイズ取得、外部ライブラリ初期化など）
- `concatAction` : 複数アクションを結合して汎用コンポーネント設計をサポート

### DOM 廃棄・アニメーション管理

- `subscription_nodesCleanup` : DOM アンマウント時にガベージコレクション風の終了処理
- `subscription_rAFManager` : RAFTask 配列をフレームごとに実行
- `effect_rAFProperties`    : CSS プロパティを RAF で段階的に設定

## source file / ソースファイル

All utilities and components are exported from a single file:
```
src/hyperapp-ui.ts
```

## (1) State Utilities / 状態操作

### getValue
```ts
function getValue<S, D>(state: S, keyNames: string[], def: D): D
```
パスを辿ってステートから値を取得。
安全にアクセス可能。

### setValue
```ts
function setValue<S>(state: S, keyNames: string[], value: any): S
```
パスを辿ってステートに値を設定し、immutable な新しいステートを返す。

### getLocalState
```ts
function getLocalState<S>(state: S, id: string, def: {[key: string]: any}): {[key: string]: any}
```
ID に紐づいたローカルステートを取得。

### setLocalState
```ts
function setLocalState<S>(state: S, id: string, value: {[key: string]: any}): S
```
ローカルステートを更新して新しいステートを返す。

## (2) Selection Utilities / 選択

### el
Hyperapp の h 関数ラッパー。JSX と競合する場合に使用。

### concatAction
アクションを結合して結果を返す。`effect_initializeNodes` と組み合わせ可能。

### getClassList
props オブジェクトから classList を取得。

### deleteKeys
props から不要なキーを除去。

## (3) Selection Components / 選択系コンポーネント

### Route
ステート値と一致した場合に VNode を返す。条件付きレンダリングに利用。

### SelectButton
クラス名 `select` をトグルするボタン。複数選択可能。

### OptionButton
クラス名 `select` を単一選択で切り替えるボタン。単一選択用。

## (4) Effects / エフェクト

### effect_initializeNodes
VNode マウント後の初期化処理を実行。

### effect_setTimedValue
ステートに存在時間制限付きの値を設定。

### effect_throwMessage
文字を一文字ずつ流し込むエフェクト。

### effect_pauseThrowMessage / effect_resumeThrowMessage
throwMessage を一時停止・再開。

## (5) Subscriptions / サブスクリプション

### subscription_nodesCleanup
DOM 消失時にクリーンアップ処理を実行。

### subscription_nodesLifecycleByIds
ステート上の ID 配列変化に応じて initialize / finalize を自動管理。

## (6) rAF / Animation System

[詳細説明](animation-system.md)

### interface RAFTask
アニメーションタスクを定義。

### subscription_rAFManager
RAFTask 配列をフレームごとに実行するサブスクリプション。

### effect_rAFProperties
CSS プロパティをフレーム単位で段階的に変更。

## (7) DOM / Event

### getScrollMargin
スクロール余白を取得。スクロール追従 UI や無限スクロール判定に便利。

## Notes
- This library assumes immutable state updates.
- Designed for Hyperapp with effect-based side effects.
- JSX usage assumes `hyperapp-jsx-pragma`.

## License
MIT
