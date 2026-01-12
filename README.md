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

- [getScrollMargin](#getscrollmargin)

## Design / 設計方針

This library defines a minimal convention for reusable state handling in Hyperapp.

hyperapp はステートをどのような形でも持てるため、コンポーネントを作成する場合、  
どのように目的のステートを参照・更新するかをあらかじめ決めておく必要があります。

コンポーネントの仕様が特定のステート構造に依存すると、設計の自由度が下がり、  
コードはアプリごとの使い捨てになりがちです。  
そこで本ライブラリでは、コンポーネントに「目的の値がどこにあるか」だけを通知する設計を採用しました。  
この考え方に基づき、パスを指定して値を取得する `getValue` と、値を設定する `setValue` を用意しています。

また、hyperapp ではコンポーネント内にローカルステートを持つことができません。  
すべてをパブリックステートに求めると、UI 内部の一時的な状態まで使用者が管理することになり、負担が大きくなります。  
そこで ID をキーとしたステートツリーをルートに追加し、使用者に意識しなくても良いように処理することとしました。  
これを実現するために `getLocalState` と `setLocalState` を用意しています。

以上の 4 つの関数が、本ライブラリの要です。  


さらに、Hyperapp ではコンポーネント内で DOM に直接触れられないため、  
VNode マウント後の初期化処理が必要な場合には `effect_initializeNodes` を利用する設計です。  
これにより、サイズ取得や外部ライブラリ初期化などを安全に行えます。

`concatAction` は、この仕組みを補助するもので、アクションを結合する際に利用することで、  
汎用的なコンポーネント設計が可能になります。

また、Hyperapp では DOM 廃棄時（アンマウント）のタイミングを知るすべがありませんが、  
DOMを監視し、ガベージコレクション風に終了処理を行うための手段として `subscription_nodesCleanup`  
を作成しました。

その他の関数は、これらの使用例や、補助的なユーティリティなどとなります。  

## source file / ソースファイル

This library is implemented in a single file:  
All utilities and components are exported from:

```
src
 └ hyperapp-ui.ts
```

## (1) State Utilities / 状態操作

Utilities for safely accessing and updating nested state structures.

### getValue

```ts
function getValue <S, D> (
  state   : S,        // ステート
  keyNames: string[], // 値までのパス
  def     : D         // デフォルト値
): D
```

パスを辿って、ステートから値を取得する  
Traverse a path in the state object and retrieve the value.

- オブジェクト構造が途中で崩れていても安全に取得できます
- 型保証は呼び出し側の責任です

---

### setValue

```ts
function setValue <S> (
  state   : S,        // ステート
  keyNames: string[], // 値までのパス
  value   : any       // 設定する値
): S
```

パスを辿って、ステートに値を設定して返す  
Traverse a path in the state object, set a value, and return the updated state.

- 必要な階層を自動生成します
- 常に新しいオブジェクトを返します（immutable）

---

### getLocalState

```ts
function getLocalState <S> (
  state: S,                     // ステート
  id   : string,                // ユニークID
  def  : { [key: string]: any } // 初期値
): { [key: string]: any }
```

ステートから、ID に紐づいたローカルステートを取得する  
Retrieve a local state object associated with a given ID.

---

### setLocalState

```ts
function setLocalState <S> (
  state: S,                     // ステート
  id   : string,                // ユニークID
  value: { [key: string]: any } // 設定するローカルステート
): S
```

ローカルステートを更新してステートを返す  
Update a local state object and return the updated state.

---

#### Local State Design

Local state is stored directly on the root state object using a generated key:

```ts
local_key_<id>
```

This design:

- Avoids deep nesting
- Keeps UI-specific state isolated by ID
- Allows immediate access and cancellation (e.g. timers)

## (2) Selection Utilities / 選択

Helpers and components for managing selection state via class names.

### el

```ts
function el (
  tag: string
) => <S> (
  props?:{ [key: string]: any },
  children?: Array<any>
): VNode<S>
```

Hyperapp の h 関数のラッパー。JSXと競合する場合に使用する。  
hyperapp h rapper

---

### concatAction

```ts
function concatAction <S, E> (
  action  : undefined | ((state: S, e: E) => S | [S, Effect<S>]), // 結合するアクション
  newState: S,                                                    // 結合するステート
  e       : E                                                     // イベント (任意のイベント型)
): S | [S, Effect<S>]
```

アクションを結合して結果を返す  
Combine an action with a new state and an optional event.

- 新しい state を返すと同時に、オプションで既存のアクションも実行可能
- DOM がまだ存在しない場合でも、安全に次の描画後に dispatch されるよう保留可能（requestAnimationFrame を利用）
- effect_initializeNodes と組み合わせることで、VNode マウント後の初期化処理にも対応可能

- Returns the new state while optionally executing an additional action
- The dispatch can be deferred until after the next render to ensure the DOM exists (requestAnimationFrame is used)
- Works seamlessly with effect_initializeNodes for post-mount initialization of VNodes

---

### getClassList

```ts
function getClassList (
  props: { [key: string]: any } // オブジェクト
): string[]
```

オブジェクトから classList を取得する  
Extract a `classList` array from a props object.

---

### deleteKeys

```ts
function deleteKeys (
  props  : { [key: string]: any}, // オブジェクト
  ...keys: string[]               // 削除するキー
): { [key: string]: any }
```

props から不要なキーを除去する  
Remove specified keys from a props object.

## (3) Selection Component / 選択系コンポーネント

Components for conditional rendering based on state values.

### Route

```ts
function <S> Route (
  props: {
    state   : S        // ステート
    keyNames: string[] // ステート内の文字配列までのパス
    match   : string   // 一致する文字
  },
  children: any        // 出力する内容 (VNode / 配列 / 文字など)
): VNode<S> | null
```

ステート内の文字列と一致した場合に VNode を返す  
Return a VNode when the state value at the given path matches a string.

- 一致しない場合は `null` を返します
- `null` の場合、VNode は生成されません

This allows safe conditional rendering without extra checks.

---

### SelectButton

```ts
function <S> (
  props: {
    state        : S        // ステート
    keyNames     : string[] // ステート内の文字配列までのパス
    id           : string   // ユニークID
    reverse?     : boolean  // 反転選択するか
    [key: string]: any      // 拡張プロパティ
  },
  children: any             // 子要素 (VNode / string / 配列など)
): VNode<S>
```

クラス名 `select` をトグルするボタン  
A button component that toggles the `select` class on click.

- 複数選択向け
- `reverse` 指定で反転選択も可能

---

### OptionButton

```ts
function <S> (
  props: {
    state        : S        // ステート
    keyNames     : string[] // ステート内の文字までのパス
    id           : string   // ユニークID
    reverse?     : boolean  // 反転選択するか
    [key: string]: any      // 拡張プロパティ
  },
  children: any             // 子要素 (VNode / string / 配列など)
): VNode<S>
```

クラス名 `select` を排他的に選択するボタン  
A button component that exclusively applies the `select` class on click.

- 単一選択向け
- `reverse` 指定で反転状態を持てます

## (4) Effects / エフェクト

Side-effect utilities for timed or state-driven UI behavior.

### effect_initializeNodes

```ts
function effect_initializeNodes <S> (
  nodes: {
    id   : string                                             // ユニークID
    event: (state: S, element: Element) => S | [S, Effect<S>] // 初期化イベント
  }[]
): (dispatch: Dispatch<S>) => void
```

DOM生成（マウント）後に要素を取得して初期化処理を実行するエフェクト  
An effect that retrieves DOM nodes after render and runs initialization logic.

#### Behavior

- id を指定して、対象要素を取得します
- 対象ノードごとに 一度だけ 初期化イベントが実行されます  
（同じキーは内部で重複実行防止されます）
- VNode から直接 DOM に触れない Hyperapp の設計を補完します
- サイズ取得・Observer登録・外部ライブラリ初期化などに適しています

#### Use cases

- SVG / Canvas のサイズ取得
- ResizeObserver / IntersectionObserver 登録
- スクロール位置初期化
- 外部 UI ライブラリのバインド処理

```ts
effect_initializeNodes([
  {
    id   : "chart",
    event: (state, el) => ({
      ...state,
      width : el.clientWidth,
      height: el.clientHeight
    })
  }
])
```

#### Note:
This effect should be dispatched after the target nodes exist in the DOM.  
It can be called from `app.init` or any point where nodes are rendered,  
such as after a `Route` switch.

---

### effect_setTimedValue

```ts
function effect_setTimedValue <S, T> (
  keyNames: string[],       // 値までのパス
  id      : string,         // ユニークID
  timeout : number,         // 存在可能時間 (ms)
  value   : T,              // 一時的に設定する値
  reset   : T | null = null // タイムアウト後に設定する値
): (dispatch: Dispatch<S>) => void
```

ステートに存在時間制限付きの値を設定するエフェクト  
An effect that sets a value in the state for a limited duration.

- 同じ ID で再実行すると前のタイマーはキャンセルされます
- UI メッセージ、通知、フラグ制御などに適しています
- `reset` に `null` を指定することで VNode を生成しない状態に戻せます

---

### effect_throwMessage

```ts
function effect_throwMessage <S> (
  keyNames: string[], // 値までのパス
  id      : string,   // ユニークID
  text    : string,   // 流し込む文字
  interval: number,   // 次の文字を流し込むまでの間隔 (ms)
): (dispatch: Dispatch<S>) => void
```

ステートに文字を一文字ずつ流し込むエフェクト  
An effect that inserts text into the state one character at a time.

#### Behavior

- 一文字ずつ指定間隔で state に反映されます
- 表示途中で `pause` 可能
- `resume` すると **停止した位置から再開** します
- text が変更された場合、index は自動的に 0 にリセットされます

---

### effect_pauseThrowMessage

```ts
function effect_pauseThrowMessage <S> (
  id: string // ユニークID
): (dispatch: Dispatch<S>) => void
```

throwMessage を一時停止する  
Pause an active `throwMessage` effect.

- 内部状態（index）は保持されます

---

### effect_resumeThrowMessage

```ts
function effect_resumeThrowMessage <S> (
  id: string // ユニークID
)(dispatch: Dispatch<S>) => void
```

一時停止した throwMessage を再開する  
Resume a paused `throwMessage` effect.

- index を維持したまま再開します

## (5) Subscriptions / サブスクリプション

Side-effect utilities for application subscriptions.

### subscription_nodesCleanup

```ts
function subscription_nodesCleanup <S> (
  nodes: {
    id      : string
    finalize: (state: S) => S | [S, Effect<S>]
  }[]
): Subscription<S>[]
```

DOM が存在しない場合にクリーンアップ処理を実行するサブスクリプション。  
This subscription performs cleanup for nodes that no longer exist in the DOM.

クリーンアップは **次のアクション時に実行** されます。  
The cleanup is carried out during the next action.

```ts
app({
  subscriptions: (state: State) => subscription_nodesCleanup([
    { id: "hoge1", finalize: action_hoge1Finalize },
    { id: "hoge2", finalize: action_hoge2Finalize }
  ])
})
```

#### Behavior

- 各ノードは id に基づき一度だけクリーンアップが実行されます
- DOM が存在しない場合に `finalize` が実行されます
- 再作成された DOM が破棄された場合には、再度 `finalize` が実行されます
- 大量の DOM を監視することを想定して、作成してはいません

#### Notes

- 初期化は `effect_initializeNodes` で実行し、終了タイミングが厳密でなくても良い場合に使用します
- hyperappには、DOM が破棄（アンマウント）されたタイミングを知るためのライフサイクルイベントがありません
- このサブスクリプションは、ガベージコレクションをイメージした終了処理です
- 基本的には、終了処理はステートで管理して自前で行った方が良いでしょう

---

### subscription_nodesLifecycleByIds

```ts
function subscription_nodesLifecycleByIds <S> (
  keyNames: string[],
    nodes: {
      id        : string
      initialize: (state: S, element: Element | null) => S | [S, Effect<S>]
      finalize  : (state: S, element: Element | null) => S | [S, Effect<S>]
    }[]
  ): Subscription<S>[] {
```

ステート上の ID配列の変化 を監視し、ノードの 初期化・終了処理を自動管理 するサブスクリプション。  
This subscription manages node initialization and cleanup based on an ID list in the state.

- ID が リストに追加されたとき   → initialize 実行
- ID が リストから削除されたとき → finalize 実行
- 各処理は 一度だけ 実行されます。  
- DOM が存在する場合、該当要素が element 引数として渡されます。
- DOM の生成前に initialize が実行されることもあるため、DOMが必要な場合は  
  `initialize` に指定するイベントに `effect_initializeNodes` を追加してください

example
```ts
// action
const action_hoge2Init = (state: State) => {
  const action = (state: State, element: Element) => {
    alert("DOM が存在します")
    return state
  }

  return [
    state,
    effect_initializeNodes([{
      id   : "hoge2",
      event: action
    }])
  ]
}

// app
app({
  subscriptions: (state: State) =>
    subscription_nodesLifecycleByIds(
      ["ui", "activeIds"],
      [
        {
          id: "hoge1",
          initialize: action_hoge1Init,
          finalize  : action_hoge1Finalize
        },
        {
          id: "hoge2",
          initialize: action_hoge2Init,
          finalize  : action_hoge2Finalize
        }
      ]
    )
})
```

#### Behavior

- keyNames で指定されたパスの ID配列 を監視します
- ID が 追加された瞬間 に initialize が実行されます
- ID が 削除された瞬間 に finalize が実行されます
- 各ノードは 多重実行されません
- DOM が存在する場合のみ element が渡されます（存在しない場合は null）

#### Notes

- DOM の マウント/アンマウントを直接検知しているわけではありません
- あくまで ステートの変化をトリガー にしています
- UI状態をステートで管理している設計と相性が良いです
- DOMの寿命とステートを 同期させたい場合 に有効です
- subscription_nodesCleanup より 厳密な制御 が可能です
- 初期化終了箇所が複数あり、  
  個別のイベントで管理しきれなくなった場合に使用すると良いでしょう

| 機能     | nodesCleanup | nodesLifecycleByIds |
| -------- | ------------ | ------------------- |
| トリガー | DOM消失検知  | ステート変化        |
| 初期化   | 非対応       | 対応                |
| 終了制御 | ざっくり     | いくらか制御可能    |
| 想定用途 | GC的処理     | ライフサイクル管理  |

#### Concept

- nodesCleanup
  → DOMが消えたっぽい から掃除する
- nodesLifecycleByIds
  → ステートが変わった から正確に制御する

## (6) DOM / Event

Utilities for working with DOM-related state and events.

### getScrollMargin

```ts
interface ScrollMargin {
  top   : number // 上までの余白
  left  : number // 左までの余白
  right : number // 右までの余白
  bottom: number // 下までの余白
}
```

```ts
function getScrollMargin (
  e: Event // イベント
): ScrollMargin
```

スクロールの余白を取得する  
Retrieve the scroll margin values from a scroll event target.

- 現在のスクロール位置と端までの余白を同時に取得できます
- スクロール追従 UI や無限スクロール判定に便利です

---

#### Notes

- This library assumes immutable state updates
- Designed for Hyperapp with effect-based side effects
- JSX usage assumes `hyperapp-jsx-pragma`

---

## License

MIT
