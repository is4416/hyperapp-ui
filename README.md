# hyperapp-ui

HyperappでのUI構築を支援する、再利用可能なコンポーネントと状態操作ユーティリティです。  
Reusable UI components and state management utilities for Hyperapp.

[example](https://is4416.github.io/hyperapp-ui/)

本ライブラリは **イミュータブルなステート更新** と  
**シンプルな副作用管理** を前提として設計されています。

JSX を使用する場合は `hyperapp-jsx-pragma` を前提としています。

## Design / 設計方針

This library defines a minimal convention for reusable state handling in Hyperapp.

hyperapp はステートをどのような形でも持てるため、コンポーネントを作成する場合、  
どのように目的のステートを参照・更新するかをあらかじめ決めておく必要があります。  
  
コンポーネントの仕様が特定のステート構造に依存すると、設計の自由度が下がり、コードはアプリごとの使い捨てになりがちです。  
そこで本ライブラリでは、コンポーネントに「目的の値がどこにあるか」だけを通知する設計を採用しました。

この考え方に基づき、パスを指定して値を取得する getValue と、値を設定する setValue を用意しています。

---

また、hyperapp ではコンポーネント内にローカルステートを持つことができません。  
すべてをパブリックステートに求めると、UI 内部の一時的な状態まで使用者が管理することになり、負担が大きくなります。

そこで、ユニーク ID をキーとしたステートツリーをルートに追加し、使用者に意識させないステートを扱えるようにしました。  
これを実現するために getLocalState と setLocalState を用意しています。

---

以上の 4 つの関数が、本ライブラリの要です。  
その他の関数は、これらの使用例や、補助的なユーティリティにすぎません。

---

## State Utilities / 状態操作

Utilities for safely accessing and updating nested state structures.

### getValue

パスを辿って、ステートから値を取得する  
Traverse a path in the state object and retrieve the value.

- オブジェクト構造が途中で崩れていても安全に取得できます
- 型保証は呼び出し側の責任です

---

### setValue

パスを辿って、ステートに値を設定して返す  
Traverse a path in the state object, set a value, and return the updated state.

- 必要な階層を自動生成します
- 常に新しいオブジェクトを返します（immutable）

---

### Local State Utilities

#### getLocalState

ステートから、ID に紐づいたローカルステートを取得する  
Retrieve a local state object associated with a given ID.

#### setLocalState

ローカルステートを更新してステートを返す  
Update a local state object and return the updated state.

---

### Local State Design

Local state is stored directly on the root state object using a generated key:

```
local_key_<id>
```

This design:

- Avoids deep nesting
- Keeps UI-specific state isolated by ID
- Allows immediate access and cancellation (e.g. timers)

---

## Display Control / 表示制御

Components for conditional rendering based on state values.

### Route

ステート内の文字列と一致した場合に VNode を返す  
Return a VNode when the state value at the given path matches a string.

- 一致しない場合は `null` を返します
- `null` の場合、VNode は生成されません

This allows safe conditional rendering without extra checks.

---

## Selection / 選択

Helpers and components for managing selection state via class names.

### Helper Functions / 補助関数

#### concatAction

アクションを結合して結果を返す  
Combine an action with a new state and an optional event.

#### getClassList

オブジェクトから classList を取得する  
Extract a `classList` array from a props object.

#### deleteKeys

props から不要なキーを除去する  
Remove specified keys from a props object.

---

### Components / コンポーネント

#### SelectButton

クラス名 `select` をトグルするボタン  
A button component that toggles the `select` class on click.

- 複数選択向け
- `reverse` 指定で反転選択も可能

---

#### OptionButton

クラス名 `select` を排他的に選択するボタン  
A button component that exclusively applies the `select` class on click.

- 単一選択向け
- `reverse` 指定で反転状態を持てます

---

## Effects / エフェクト

Side-effect utilities for timed or state-driven UI behavior.

### effect_throwMessage

ステートに文字を一文字ずつ流し込むエフェクト  
An effect that inserts text into the state one character at a time.

#### Behavior

- 一文字ずつ指定間隔で state に反映されます
- 表示途中で `pause` 可能
- `resume` すると **停止した位置から再開** します
- text が変更された場合、index は自動的に 0 にリセットされます

---

### effect_pauseThrowMessage

throwMessage を一時停止する  
Pause an active `throwMessage` effect.

- 内部状態（index）は保持されます

---

### effect_resumeThrowMessage

一時停止した throwMessage を再開する  
Resume a paused `throwMessage` effect.

- index を維持したまま再開します

---

### effect_setTimedValue

ステートに存在時間制限付きの値を設定するエフェクト  
An effect that sets a value in the state for a limited duration.

- 同じ ID で再実行すると前のタイマーはキャンセルされます
- UI メッセージ、通知、フラグ制御などに適しています
- `reset` に `null` を指定することで VNode を生成しない状態に戻せます

---

## DOM / Event

Utilities for working with DOM-related state and events.

### interface ScrollMargin

```ts
interface ScrollMargin {
  top   : number
  left  : number
  right : number
  bottom: number
}
```

### getScrollMargin

スクロールの余白を取得する  
Retrieve the scroll margin values from a scroll event target.

- 現在のスクロール位置と端までの余白を同時に取得できます
- スクロール追従 UI や無限スクロール判定に便利です

---

## Notes

- This library assumes immutable state updates
- Designed for Hyperapp with effect-based side effects
- JSX usage assumes `hyperapp-jsx-pragma`

---

## License

MIT
