# rAF / Animation System

requestAnimationFrame によるフレーム単位のアニメーションを、  
hyperappのステート管理と連携させたシステムです

- ステートに RAFTask 配列を持ち、この情報をもとにフレーム単位でアニメーションが実行されます
- ステートの値が変更された時点で、サブスクリプションにより requestAnimationFrame がセットされます
- RAFTask に保存された情報によりアニメーションが処理され、必要に応じて次の requestAnimationFrame がセットされます
- アニメーションは RAFTask.duration の時間 (ms) 実行され、必要に応じて finish イベントが実行されます
- リアルタイム制御のため、ステート内の RAFTask.isDone は直接変更されます

## sample: button[id="app"] のフォントを、赤色に変更していく

```ts
// button.click
const action = (state: State) => {
	const effect = effect_RAFProperties({
		id        : "app",
		keyNames  : ["tasks"],
		duration  : 1000,
		properties: [{
			selector: "#app",
			rules: [{
				name: "color",
				value: (progress: number) => {
					const r = 255 * progress
					const g = 0
					const b = 0
					return `rgb(${r}, ${g}, ${b})`
				}
			}]
		}]
	})

	return [state, effect]
}

// app
app({
	node: document.getElementById("app") as HTMLElement,

	init: {
		tasks: [] as RAFTask<State>[] // ステートに RAFTask 配列が必要
	},

	view: (state: State) => (
		<button
			type    = "button"
			id      = "app"
			onclick = { action }
		>
			Hello World
		</button>
	)

	subscriptions: (state: State) => [
		subscription_RAFManager(state, ["tasks"]) // subscription_RAFManager でサブスクリプションを生成して追加
	]
})

```

## 解説

properties には、CSSProperty[] を設定させる仕様としています

```ts
interface CSSProperty {
	selector: string
	rules: {
		name : string
		value: (progress: number) => string
	}[]
}
```

before / after 形式ではなく、進捗状況により CSS 値を出力させる関数としています  
これにより複雑な形式の CSS 値を出力することができます

例
```ts
rules: [{
	name : "transform",
	value: (progress: number) => {
		return `translate(${ 100 * progress }px, ${ 3 * progress }rem)`
	}
}]
```

## 補足

progress は、0から1までの数値を返します  
value の関数を自由に決めることができるため、easing 処理なども実装できます  

easing 用のプリセットも、別ファイルで用意しています。  
[progress_easing.ts](src/hyperapp-ui/animation/easing.ts)

## hyperapp でのコンポーネント初期化について

hyperapp にはライフサイクルイベントが採用されていないため、コンポーネント単体では初期化処理を行うことができません。  
必ずステートに対してアクションを起こす必要があり、その後の監視は基本的にサブスクリプションで行われます。

1. view にコンポーネントを配置する  
2. 必要であれば、subscriptions に監視用 Subscription を登録する  
3. 開始アクションを実行する  

という **2〜3ステップ** が必ず必要となりますが、本ライブラリでは、この仕様を「制約」ではなく **設計指針** として扱っています。  
これにより、

1. ステートの変更
1. サブスクリプションによる監視
1. 副作用の実行

という一貫した流れで処理されるため、

- 初期化タイミングが完全にコントロール下にある
- 処理の開始・終了がすべてステートで追跡可能
- DOM 依存処理が分離される

といったメリットがあります

---

`subscription_nodesCleanup` は、DOM を監視してメモリリークを防止する目的で作成したサブスクリプションですが、  
基本的には **DOM ではなくステートを追跡して制御する設計** が望ましいと考えています

そのため、`subscription_nodesCleanup` の出番はあまり多くないでしょう
