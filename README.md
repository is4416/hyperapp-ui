# hyperapp-ui

HyperappでのUI構築を支援する、再利用可能なコンポーネントと状態操作ユーティリティです。  
Reusable UI components and state management utilities for Hyperapp.

[example](https://is4416.github.io/hyperapp-ui/)


## 状態操作 / State Utilities

- **getValue**: パスを辿って、ステートから値を取得する  
	Traverse a path in the state and retrieve the value.

- **setValue**: パスを辿って、ステートに値を設定して返す  
	Traverse a path in the state and set the value, returning the updated state.

- **getLocalState**: ステートから、ローカルステートを取得する  
	Retrieve a local state object from the state by ID.

- **setLocalState**: ローカルステートを更新してステートを返す  
	Update a local state object and return the updated state.


## 表示制御 / Display Control

- **Route**: ステート内の文字と match した時に VNode を返す  
	Return a VNode if the state value at the given path matches a string.


## 選択 / Selection

### 補助関数 / Helper Functions

- **concatAction**: アクションを結合して結果を返す  
	Combine an action with a new state and optional event.

- **getClassList**: オブジェクトから classList を取得  
	Extract a class list array from a props object.

- **deleteKeys**: props から不要なキーを除去する  
	Remove specified keys from a props object.

### コンポーネント / Components

- **SelectButton**: クラス名の select をトグルするボタン  
	A button that toggles the "select" class on click.

- **OptionButton**: クラス名の select を排他的に選択するボタン  
	A button that exclusively selects the "select" class on click.
