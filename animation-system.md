# rAF / Animation System

requestAnimationFrame によるフレーム単位のアニメーションを、  
hyperappのステート管理と連携させたシステムです

- ステートに RAFTask 配列を持ち、この情報をもとにフレーム単位でアニメーションが実行されます
- ステートの値が変更された時点で、サブスクリプションにより requestAnimationFrame がセットされます
- RAFTask に保存された情報によりアニメーションが処理され、必要に応じて次の requestAnimationFrame がセットされます
- アニメーションは RAFTask.duration の時間 (ms) 実行され、必要に応じて finish イベントが実行されます

sample: button[id="app"] のフォントを、赤色に変更していく
```ts
// button.click
const action = (state: State) => {
	const effect = effect_rAFProperties({
		id: "app",
		keyNames: ["tasks"],
		duration: 1000,
		properties: [
			{
				name : "color",
				value: (progress: number) => {
					const r = 255 * progress
					const g = 0
					const b = 0
					return `rgb(${r}, ${g}, ${b})`
				}
			}
		]
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
		subscription_rAFManager(state, ["tasks"]) // subscription_rAFManager でサブスクリプションを生成して追加
	]
})

```

properties には、CSSProperty[] を設定させる仕様としています

```ts
interface CSSProperty {
	name : string
	value: (progress: number) => string
}
```

before / after 形式ではなく、進捗状況により CSS 値を出力させる関数としています  
これにより複雑な形式の CSS 値を出力することができます

例
```ts
	name : "transform",
	value: (progress: number) => {
		return `translate(${ 100 * progress }px, ${ 3 * progress }rem)`
	}
```

progress は、0から1までの数値を返します  
value の関数を自由に決めることができるため、easing 処理なども実装できます  
