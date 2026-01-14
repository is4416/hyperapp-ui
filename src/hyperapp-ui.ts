import { h, text, VNode, Dispatch, Effect, Subscription } from "hyperapp"

// ========== ========== ========== ========== ==========
// 状態操作
// ========== ========== ========== ========== ==========

// ---------- ---------- ---------- ---------- ----------
// getValue
// ---------- ---------- ---------- ---------- ----------
/**
 * パスを辿って、ステートから値を取得する
 *
 * @template S
 * @template D
 * @param   {S}        state    - ステート
 * @param   {string[]} keyNames - 値までのパス
 * @param   {D}        def      - デフォルト値
 * @returns {D}                 - 型保証は呼び出し側の責任
 */
export const getValue = function <S, D> (
	state   : S,
	keyNames: string[],
	def     : D
): D {
	let result = state as any

	for (const key of keyNames) {
		if (
			result == null ||
			typeof result !== "object"
		) return def

		if (Object.prototype.hasOwnProperty.call(result, key)) {
			result = result[key]
		} else {
			return def
		}
	}

	return result as D
}

// ---------- ---------- ---------- ---------- ----------
// setValue
// ---------- ---------- ---------- ---------- ----------
/**
 * パスを辿って、ステートに値を設定して返す
 * 
 * @template S
 * @param   {S}        state    - ステート
 * @param   {string[]} keyNames - 値までのパス
 * @param   {any}      value    - 設定する値
 * @returns {S}
 */
export const setValue = function <S> (
	state   : S,
	keyNames: string[],
	value   : any
): S {
	let result = { ...state } as any
	let current = result

	for (let i = 0; i < keyNames.length; i++) {
		const key = keyNames[i]

		if (
			Object.prototype.hasOwnProperty.call(current, key) &&
			current[key] != null &&
			typeof current[key] === "object"
		) {
			current[key] = { ...current[key] }
		} else {
			current[key] = {}
		}

		if (keyNames.length - 1 === i) {
			current[key] = value
		}

		current = current[key]
	}

	return result as S
}

// ---------- ---------- ---------- ---------- ----------
// createLocalKey
// ---------- ---------- ---------- ---------- ----------
/**
 * IDからユニーク文字列を作成する
 * 
 * @param   {string} id - ユニークID
 * @returns {string}
 */
const createLocalKey = (id: string): string => `local_key_${ id }`

// ---------- ---------- ---------- ---------- ----------
// getLocalState
// ---------- ---------- ---------- ---------- ----------
/**
 * ステートから、ローカルステートを取得する
 * 
 * @template S
 * @param   {S}                   state - ステート
 * @param   {string}              id    - ユニークID
 * @param   {Record<string, any>} def   - 初期値
 * @returns {Record<string, any>}
 */
export const getLocalState = function <S> (
	state: S,
	id   : string,
	def  : { [key: string]: any }
): { [key: string]: any } {
	const localKey = createLocalKey(id)
	const obj = Object.prototype.hasOwnProperty.call(state, localKey)
		? (state as any)[localKey]
		: {}

	return {
		...def,
		...obj
	}
}

// ---------- ---------- ---------- ---------- ----------
// setLocalState
// ---------- ---------- ---------- ---------- ----------
/**
 * ローカルステートを更新してステートを返す
 * 
 * @template S
 * @param   {S}                   state - ステート
 * @param   {string}              id    - ユニークID
 * @param   {Record<string, any>} value - 設定するローカルステート
 * @returns {S}
 */
export const setLocalState = function <S> (
	state: S,
	id   : string,
	value: { [key: string]: any }
): S {
	const localKey = createLocalKey(id)
	const obj = Object.prototype.hasOwnProperty.call(state, localKey)
		? (state as any)[localKey]
		: {}

	return {
		...state,
		[localKey]: {
			...obj,
			...value
		}
	}
}

// ========== ========== ========== ========== ==========
// コンポーネント
// ========== ========== ========== ========== ==========

// ========== ========== ========== ========== ==========
// 補助関数
// ========== ========== ========== ========== ==========

// ---------- ---------- ---------- ---------- ----------
// el
// ---------- ---------- ---------- ---------- ----------
/**
 * h 関数のラッパー
 * 他でjsxを使用した場合、hが競合する可能性があるので作成した
 * 
 * @template S
 * @param   {string} tag - タグ名
 * @returns {VNode<S>}
 */
export const el = (tag: string) => <S> (props?:{ [key: string]: any }, children?: Array<any>): VNode<S> => h(
	tag,
	props ?? {},
	children
		? children.map((child: any) => typeof child === "object" ? child : text(child))
		: []
)

/* element */
const button = el("button")

// ---------- ---------- ---------- ---------- ----------
// concatAction
// ---------- ---------- ---------- ---------- ----------
/**
 * アクションを結合して結果を返す
 * 
 * @template S
 * @template E
 * @param   {undefined | (state: S, e: E) => S | [S, Effect<S>]} action   - 結合するアクション
 * @param   {S}                                                  newState - 結合するステート
 * @param   {E}                                                  e        - イベント (任意のイベント型)
 * @returns {S | [S, Effect<S>]}
 */
export const concatAction = function <S, E> (
	action  : undefined | ((state: S, e: E) => S | [S, Effect<S>]),
	newState: S,
	e       : E
): S | [S, Effect<S>] {
	if (!action) return newState

	const effect = (dispatch: Dispatch<S>) => {

		// 次の描画を待たないと、newStateと同時にdispatchが走ってしまい、DOMが存在しない可能性がある
		// effect_initializeNodesを機能させるため、dispatch を描画後まで保留する
		requestAnimationFrame(() => {
			dispatch((state: S) => action(state, e))
		})
	}

	return [newState, effect]
}

// ---------- ---------- ---------- ---------- ----------
// getClassList
// ---------- ---------- ---------- ---------- ----------
/**
 * オブジェクトから classList を取得
 * 
 * @param   {Record<string, any>} props - オブジェクト
 * @returns {string[]}
 */
export const getClassList = (
	props: { [key: string]: any }
): string[] => {
	return props.class
		? props.class.trim().split(" ").filter(Boolean)
		: []
}

// ---------- ---------- ---------- ---------- ----------
// deleteKeys
// ---------- ---------- ---------- ---------- ----------
/**
 * props から不要なキーを削除する
 * 
 * @param   {Record<string, any>} props - オブジェクト
 * @param   {string[]}            keys  - 削除するキー
 * @returns {Record<string, any>}
 */
export const deleteKeys = (
	props  : { [key: string]: any},
	...keys: string[]
): { [key: string]: any } => {
	const result = { ...props }

	keys.forEach(key => delete result[key])

	return result
}

// ========== ========== ========== ========== ==========
// 選択
// ========== ========== ========== ========== ==========

// ---------- ---------- ---------- ---------- ----------
// Route
// ---------- ---------- ---------- ---------- ----------
/**
 * ステート内の文字とmatchした時、VNodeを返す
 * 
 * @template S
 * @param   {Record<string, any>} props          - プロパティ
 * @param   {S}                   props.state    - ステート
 * @param   {string[]}            props.keyNames - ステート内の文字配列までのパス
 * @param   {string}              props.match    - 一致判定する文字
 * @param   {any}                 children       - 出力する内容 (VNode / 配列 / 文字など)
 * @returns {VNode<S> | null}
 */
export const Route = function <S> (
	props: {
		state   : S
		keyNames: string[]
		match   : string
	},
	children: any
): VNode<S> | null {
	const { state, keyNames, match } = props
	const selectedName = getValue(state, keyNames, "")

	// nullの場合、VNodeは生成されない
	return selectedName === match ? children : null
}

// ========== ========== ========== ========== ==========
// 選択
// ========== ========== ========== ========== ==========
const REVERSE_PREFIX = "r_"

// ---------- ---------- ---------- ---------- ----------
// SelectButton
// ---------- ---------- ---------- ---------- ----------

/**
 * クリックで、クラス名のselectをトグルするボタン
 * 
 * @template S
 * @param   {Record<string, any>} props          - プロパティ
 * @param   {S}                   props.state    - ステート
 * @param   {string[]}            props.keyNames - ステート内の文字配列までのパス
 * @param   {string}              props.id       - ユニークID
 * @param   {boolean}            [props.reverse] - 反転選択するか
 * @param   {any}                 children       - 子要素 (VNode / string / 配列など)
 * @returns {VNode<S>}
 */
export const SelectButton = function <S> (
	props: {
		state        : S
		keyNames     : string[]
		id           : string
		reverse?     : boolean
		[key: string]: any
	},
	children: any
): VNode<S> {
	const { state, keyNames, id, reverse = false } = props

	// classList
	const classList = getClassList(props).filter(item => {
		const name = item.toLowerCase()
		return name !== "select" && name !== "reverse"
	})
	const selectedNames = getValue(state, keyNames, []) as string[]
	if (selectedNames.includes(id)) classList.push("select")
	if (selectedNames.includes(`${ REVERSE_PREFIX }${ id }`)) classList.push("reverse")

	// action
	const action = (state: S, e: MouseEvent) => {
		const selectedNames = getValue(state, keyNames, []) as string[]
		const newList = selectedNames.includes(id)
			? reverse
				? selectedNames.filter(item => item !== id).concat(`${ REVERSE_PREFIX }${ id }`)
				: selectedNames.filter(item => item !== id)
			: selectedNames.includes(`${ REVERSE_PREFIX }${ id }`)
				? selectedNames.filter(item => item !== `${ REVERSE_PREFIX }${ id }`)
				: selectedNames.concat(id)
		const newState = setValue(state, keyNames, newList)
		return concatAction(props.onclick, newState, e)
	}

	// VNode
	return button({
		type: "button",
		...deleteKeys(props, "state", "keyNames", "reverse"),
		class  : classList.join(" "),
		onclick: action
	}, children)
}

// ---------- ---------- ---------- ---------- ----------
// OptionButton
// ---------- ---------- ---------- ---------- ----------
/**
 * クリックで、クラス名のselectを排他的に選択するボタン
 * 
 * @template S
 * @param   {Record<string, any>} props          - プロパティ
 * @param   {S}                   props.state    - ステート
 * @param   {string[]}            props.keyNames - ステート内の文字までのパス
 * @param   {string}              props.id       - ユニークID
 * @param   {boolean}            [props.reverse] - 反転選択するか
 * @param   {any}                 children       - 子要素 (VNode / string / 配列など)
 * @returns {VNode<S>}
 */

export const OptionButton = function <S> (
	props: {
		state        : S
		keyNames     : string[]
		id           : string
		reverse?     : boolean
		[key: string]: any
	},
	children: any
): VNode<S> {
	const { state, keyNames, id, reverse = false } = props

	// classList
	const classList = getClassList(props).filter(item => {
		const name = item.toLowerCase()
		return name !== "select" && name !== "reverse"
	})
	const selectedName = getValue(state, keyNames, "") as string
	if (selectedName === id) classList.push("select")
	if (selectedName === `${ REVERSE_PREFIX }${ id }`) classList.push("reverse")

	// action
	const action = (state: S, e: MouseEvent) => {
		const selectedName = getValue(state, keyNames, "") as string
		const newValue = selectedName === id && reverse
			? `${ REVERSE_PREFIX }${ id }`
			: id
		const newState = setValue(state, keyNames, newValue)
		return concatAction(props.onclick, newState, e)
	}

	// VNode
	return button({
		type: "button",
		...deleteKeys(props, "state", "keyNames", "reverse"),
		class  : classList.join(" "),
		onclick: action
	}, children)
}

// ========== ========== ========== ========== ==========
// エフェクト
// ========== ========== ========== ========== ==========

// ---------- ---------- ---------- ---------- ----------
// effect_initializeNodes
// ---------- ---------- ---------- ---------- ----------

/**
 * @template S
 * @type {Object} InitializeNode
 * @property {string}                                             id    - ユニークID
 * @property {(state: S, element: Element) => S | [S, Effect<S>]} event - 初期化イベント
 */

/**
 * DOM生成後にノードを取得して初期化処理を実行するエフェクト
 *
 * @template S
 * @param   {InitializeNode<S>[]} nodes - 初期化対象ノード定義配列
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_initializeNodes = function <S> (
	nodes: {
		id   : string
		event: (state: S, element: Element) => S | [S, Effect<S>]
	}[]
): (dispatch: Dispatch<S>) => void {
	const done = new Set<string>()

	return (dispatch: Dispatch<S>) => {
		nodes.forEach(node => {
			if (done.has(node.id)) return
			done.add(node.id)

			const element = document.getElementById(node.id)
			if (element) dispatch([node.event, element])
		})
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_setTimedValue
// ---------- ---------- ---------- ---------- ----------
/**
 * ステートに存在時間制限付きの値を設定するエフェクト
 *
 * @template S
 * @template T
 * @param   {string[]} keyNames - 値までのパス
 * @param   {string}   id       - ユニークID
 * @param   {number}   timeout  - 存在可能時間（ms）
 * @param   {T}        value    - 一時的に設定する値
 * @param   {T | null} reset    - タイムアウト後に設定する値
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_setTimedValue = function <S, T> (
	keyNames: string[],
	id      : string,
	timeout : number,
	value   : T,
	reset   : T | null = null
): (dispatch: Dispatch<S>) => void {
	const NO_TIMER = 0

	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			const { timerID } = getLocalState(state, id, { timerID: NO_TIMER })
			if (timerID !== NO_TIMER) clearTimeout(timerID)
			
			return setLocalState(
				setValue(state, keyNames, value),
				id,
				{
					timerID: setTimeout(() => {
						dispatch((state: S) => setLocalState(
							setValue(state, keyNames, reset),
							id,
							{
								timerID: NO_TIMER
							}
						))
					}, Math.max(0, timeout))
				}
			)
		})
	}
}

// ---------- ---------- ---------- ---------- ----------
// action_throwMessageTick
// ---------- ---------- ---------- ---------- ----------

const action_throwMessageTick = function <S> (
	keyNames: string[],
	id      : string,
	text    : string,
	interval: number,
): (state: S) => S | [S, Effect<S>] {
	const NO_TIMER = 0

	return (state: S) => {
		const local = getLocalState(state, id, {
			timerID: NO_TIMER,
			msg    : "",
			index  : 0,
			paused : false
		})
		if (local.timerID !== NO_TIMER) clearTimeout(local.timerID)
		if (local.paused) return state

		const index = text === local.msg ? local.index : 0

		return [
			setValue(state, keyNames, text.slice(0, index + 1)),
			(dispatch: Dispatch<S>) => {
				dispatch((state: S) => setLocalState(state, id, {
					timerID: index + 1 < text.length
						? setTimeout(() => {
							dispatch(action_throwMessageTick(
								keyNames,
								id,
								text,
								interval
							))
						}, Math.max(0, interval))
						: 0,
					msg  : text,
					index: index + 1
				}))
			}
		]
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_throwMessage
// ---------- ---------- ---------- ---------- ----------
/**
 * ステートに文字を一文字ずつ流し込むエフェクト
 * 
 * @template S
 * @param   {string[]} keyNames - 値までのパス
 * @param   {string}   id       - ユニークID
 * @param   {string}   text     - 流し込む文字
 * @param   {number}   interval - 次の文字を流し込むまでの間隔（ms）
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_throwMessage = function <S> (
	keyNames: string[],
	id      : string,
	text    : string,
	interval: number,
): (dispatch: Dispatch<S>) => void {
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => setLocalState(state, id, {
			keyNames: keyNames,
			msg     : "",
			interval: interval,
			index   : 0,
			paused  : false
		}))

		dispatch(action_throwMessageTick(keyNames, id, text, interval))
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_pauseThrowMessage
// ---------- ---------- ---------- ---------- ----------
/**
 * throwMessageを一時停止する
 * 
 * @template S
 * @param   {string} id - ユニークID
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_pauseThrowMessage = function <S> (
	id: string
): (dispatch: Dispatch<S>) => void {
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => setLocalState(state, id, { paused: true }))
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_resumeThrowMessage
// ---------- ---------- ---------- ---------- ----------
/**
 * 一時停止したthrowMessageを再開する
 * 
 * @template S
 * @param   {string} id - ユニークID
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_resumeThrowMessage = function <S> (
	id: string
): (dispatch: Dispatch<S>) => void {
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => setLocalState(state, id, { paused: false }))

		dispatch((state: S) => {
			const { keyNames, msg, interval } = getLocalState(state, id, {
				keyNames: [],
				msg     : "",
				interval: 0,
				paused   : false
			})

			return action_throwMessageTick(keyNames, id, msg, interval)
		})
	}
}

// ========== ========== ========== ========== ==========
// サブスクリプション
// ========== ========== ========== ========== ==========

// ---------- ---------- ---------- ---------- ----------
// subscription_nodesCleanup
// ---------- ---------- ---------- ---------- ----------

/**
 * @type {Object} CleanupNode
 * @property {string}                           id       - ユニークID
 * @property {(state: S) => S | [S, Effect<S>]} finalize - クリーンアップイベント
 */

/**
 * DOMが存在しない場合、クリーンアップ処理を実行するサブスクリプト
 * クリーンアップは、DOMが廃棄された直後ではなく、次のアクション時に実行されます
 * 
 * @template S
 * @param   {CleanupNode<S>[]} nodes - クリーンアップ対象ノード定義配列
 * @returns {Subscription<S>[]}
 */
export const subscription_nodesCleanup = function <S>(
	nodes: {
		id      : string
		finalize: (state: S) => S | [S, Effect<S>]
	}[]
): Subscription<S>[] {
	const key = `local_key_nodesCleanup`

	return nodes.map(node => [
		(dispatch: Dispatch<S>, payload: typeof node) => {
			dispatch((state: S) => {
				const dom = document.getElementById(payload.id)
				const keys = [key, payload.id, "initialized"]

				const initialized = getValue(state, keys, false)

				// initialize
				if (dom && !initialized) {
					return setValue(state, keys, true)
				}

				// finalize
				if (!dom && initialized) {
					const newState = setValue(state, keys, false)
					return payload.finalize(newState)
				}

				return state
			})

			return () => {}
		},
		node
	])
}

// ---------- ---------- ---------- ---------- ----------
// subscription_nodesLifecycleByIds
// ---------- ---------- ---------- ---------- ----------
/**
 * @type {Object} LifecycleNode
 * @property {string}                                                    id         - ユニークID
 * @property {(state: S, element: Element | null) => S | [S, Effect<S>]} initialize - 初期化イベント
 * @property {(state: S, element: Element | null) => S | [S, Effect<S>]} finalize   - 終了イベント
 */

/**
 * 登録されたIDを元に、初期化・終了処理を実行するサブスクリプト
 * IDに一致するDOMが存在する場合、イベント時にがセットされます
 * 
 * @template S
 * @param   {string[]}        keyNames - 文字配列までのパス
 * @param   {LifecycleNode[]} nodes    - 監視対象ノード定義配列
 * @returns {Subscription<S>[]}
 */
export const subscription_nodesLifecycleByIds = function <S> (
	keyNames: string[],
	nodes: {
		id        : string
		initialize: (state: S, element: Element | null) => S | [S, Effect<S>]
		finalize  : (state: S, element: Element | null) => S | [S, Effect<S>]
	}[]
): Subscription<S>[] {
	const key  = "local_key_nodesLifecycleByIds"

	return nodes.map(node => [
		(dispatch: Dispatch<S>, payload: typeof node) => {
			dispatch((state: S) => {
				const dom  = document.getElementById(payload.id)
				const keys = [key, payload.id, "initialized"]

				const list = getValue(state, keyNames, [] as string[])
				const initialized = getValue(state, keys, false)

				// initialize
				if (list.includes(payload.id) && !initialized) {
					const newState = setValue(state, keys, true)
					return node.initialize(newState, dom)
				}

				// finalize
				if (!list.includes(payload.id) && initialized) {
					const newState = setValue(state, keys, false)
					return node.finalize(newState, dom)
				}

				return state
			})

			return () => {}
		}
		,
		node
	])
}

// ========== ========== ========== ========== ==========
// rAF (Animation System)
// ========== ========== ========== ========== ==========

// ---------- ---------- ---------- ---------- ----------
// interface RAFTask
// ---------- ---------- ---------- ---------- ----------
/**
 * @template S
 * @type {Object} RAFTask
 * @property {string}                                                id           - ユニークID (DOMのidと同一)
 * @property {(state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]} action       - アクション
 * @property {number}                                               [startTime]   - 開始時間 (省略ですぐ開始)
 * @property {number}                                               [currentTime] - 現在の時間 (コールバック用)
 * @property {number}                                               [deltaTime]   - 前回のアクションからの経過時間
 * @property {number}                                               [elapsedTime] - startTime からの経過時間
 * @property {boolean}                                              [paused]      - 一時停止フラグ
 * @property {number}                                               [priority]    - アクションの優先順位
 * @property {any}                                                  [extension]   - 拡張用のプロパティ
 * @property {boolean}                                              [done]        - 終了判定
 */
export interface RAFTask <S> {
	id          : string
	action      : (state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]
	startTime?  : number
	currentTime?: number
	deltaTime?  : number
	elapsedTime?: number
	paused?     : boolean
	priority?   : number
	extension?  : any
	done?       : boolean
}

// ---------- ---------- ---------- ---------- ----------
// subscription_rAFManager
// ---------- ---------- ---------- ---------- ----------
/**
 * requestAnimationFrame を利用し、RAFTask をフレームごとに実行するサブスクリプション
 * 
 * - state から RAFTask 配列を取得
 * - 対応する DOM が存在するタスクのみ実行
 * - priority 順にソートして処理
 * - startTime による遅延開始対応
 * - deltaTime / elapsedTime を自動計算
 * - state へ反映するかどうかは action の処理
 *
 * @template S
 * @param   {S}        state    - ステート
 * @param   {string[]} keyNames - RAFTask 配列までのパス
 * @returns {Subscription<S>}
 */
export const subscription_rAFManager = function <S>(
	state: S,
	keyNames: string[]
): Subscription<S> {
	const sortFn = (a: RAFTask<S>, b: RAFTask<S>) => (b.priority ?? 0) - (a.priority ?? 0)
	const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
		.filter(task => document.getElementById(task.id))
		.filter(task => task.done !== true)
		.sort(sortFn)

	return [
		(dispatch: Dispatch<S>, payload: RAFTask<S>[]) => {
			if (payload.length === 0) return () => {}

			let rafId = 0

			const loop = (now: number) => {
				dispatch((state: S) => {
					const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
						.filter(task => document.getElementById(task.id))
						.filter(task => task.done !== true)
						.sort(sortFn)

					const newTasks: RAFTask<S>[] = tasks.flatMap(task => {
						if (task.paused) return [task]

						const newTask: RAFTask<S> = {
							...task,
							startTime  : task.startTime ?? now,
							currentTime: now,
							deltaTime  : task.currentTime ? now - task.currentTime : 0,
							elapsedTime: now - (task.startTime ?? now)
						}

						if (now >= task.startTime!) {
							dispatch([task.action, newTask])
						}
						return [newTask]
					})
					return setValue(state, keyNames, newTasks)
				})
				rafId = requestAnimationFrame(loop)
			}

			rafId = requestAnimationFrame(loop)
			return () => cancelAnimationFrame(rafId)
		},
		tasks
	]
}

// ---------- ---------- ---------- ---------- ----------
// effect_rAFMoveTo
// ---------- ---------- ---------- ---------- ----------
/**
 * scription_rAFManager を利用したアニメーションムーブエフェクト
 * 
 * - DOM の translate を使って移動
 * - 進捗率に基づき毎フレーム transform を更新
 * - 終了時に onfinish を呼び出す
 * - will-change を使って GPU レイヤーを活用
 * - 終了時の translate / left / top 設定は onfinish で処理
 * - onfinish での処理を考慮し、rafTask.extension には { before, after } が格納されます
 * 
 * @template S
 * @param   {string}                                                id       - ユニークID (DOM の id と一致) 
 * @param   {string[]}                                              keyNames - RAFTask 配列までのパス
 * @param   {{left: number, top: number}}                           before   - 開始位置
 * @param   {{left: number, top: number}}                           after    - 終了位置
 * @param   {number}                                                speed    - 移動完了までの時間 (ms)
 * @param   {(state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]} onfinish - 移動完了時に呼ばれるイベント
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_rAFMoveTo = function <S> ({
	id,
	keyNames,
	before,
	after,
	speed,
	onfinish
}: {
	id      : string,
	keyNames: string[],
	before  : {
		top : number
		left: number
	},
	after   : {
		top : number
		left: number
	},
	speed   : number,
	onfinish: (state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]
}): (dispatch: Dispatch<S>) => void {
	const dx = after.left - before.left
	const dy = after.top  - before.top

	// action
	const action = (state: S, rafTask: RAFTask<S>) => {
		const dom = document.getElementById(rafTask.id)
		if (!dom) return state

		// progress
		const progress = Math.min(1, (rafTask.elapsedTime ?? 0) / Math.max(1, speed))

		// set property
		dom.style.transform = `translate(${ dx * progress }px, ${ dy * progress }px)`

		// next
		if (progress < 1) return state

		// newState
		const newTaskItems = getValue(state, keyNames, [] as RAFTask<S>[])
			.filter(task => task.id !== rafTask.id)
			.filter(task => task.done !== true)

		const newState = setValue(state, keyNames, newTaskItems)

		// releasre gpu layer
		dom.style.willChange = ""

		// finish
		rafTask.done = true

		return onfinish
			? onfinish(newState, rafTask)
			: newState
	}

	// result
	return ((dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			const taskItems = getValue(state, keyNames, [] as RAFTask<S>[])
				.filter(task => task.id !== id)
				.filter(task => task.done !== true)

			// set gpu layer
			const dom = document.getElementById(id)
			if (dom) dom.style.willChange = "transform"

			return setValue(state, keyNames, taskItems.concat({
				id       : id,
				action   : action,
				extension: { before, after }
			}))
		})
	})
}

// ---------- ---------- ---------- ---------- ----------
// effect_rAFProperties
// ---------- ---------- ---------- ---------- ----------
/**
 * @type {Object} CSSProperty
 * @property {string} name   - プロパティ名
 * @property {number} before - 変更前の数値
 * @property {number} after  - 変更後の数値
 * @property {string} [unit] - 単位
 */

/**
 * scription_rAFManager を利用したCSS値変更エフェクト
 * 
 * - 進捗状況に基づき毎フレーム CSS値を変更
 * - 終了時に onfinish を呼び出す
 * - onfinish での処理を考慮し、rafTask.extension には properties が格納されます
 * 
 * @template S
 * @param   {string}                                                id         - ユニークID (DOM の id と一致) 
 * @param   {string[]}                                              keyNames   - RAFTask 配列までのパス
 * @param   {CSSProperty[]}                                         properties - 変更するCSS値 
 * @param   {number}                                                speed      - 移動完了までの時間 (ms)
 * @param   {(state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]} onfinish   - 移動完了時に呼ばれるイベント
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_rAFProperties = function <S>({
	id,
	keyNames,
	properties,
	speed,
	onfinish
}: {
	id        : string,
	keyNames  : string[],
	properties: {
		name  : string
		before: number
		after : number
		unit? : string
	}[],
	speed     : number,
	onfinish  : (state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]
}): (dispatch : Dispatch<S>) => void {

	// action
	const action = (state: S, rafTask: RAFTask<S>) => {
		const dom = document.getElementById(rafTask.id)
		if (!dom) return state

		// progress
		const progress = Math.min(1, (rafTask.elapsedTime ?? 0) / Math.max(1, speed))

		// set css properties
		properties.forEach(p => {
			const val = `${ p.before + (p.after - p.before) * progress }${ p.unit ?? "" }`
			dom.style.setProperty(p.name, val)
		})

		// next
		if (progress < 1) return state

		// newState
		const newTaskItems = getValue(state, keyNames, [] as RAFTask<S>[])
			.filter(task => task.id !== rafTask.id)
			.filter(task => task.done !== true)

		const newState = setValue(state, keyNames, newTaskItems)

		// release gpu layer
		dom.style.willChange = ""

		// finish
		rafTask.done = true

		return onfinish
			? onfinish(newState, rafTask)
			: newState
	}

	// result
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			const taskItems = getValue(state, keyNames, [] as RAFTask<S>[])
				.filter(task => task.id !== id)
				.filter(task => task.done !== true)

			// set gpu layer
			const dom = document.getElementById(id)
			if (dom) dom.style.willChange = "transform"

			return setValue(state, keyNames, taskItems.concat({
				id,
				action,
				extension: properties
			}))
		})
	}
}

// ========== ========== ========== ========== ==========
// DOM / Event
// ========== ========== ========== ========== ==========

// ---------- ---------- ---------- ---------- ----------
// interface ScrollMargin
// ---------- ---------- ---------- ---------- ----------
/**
 * スクロールの余白
 * 
 * @type {Object} ScrollMargin
 * @property {number} top    - 上までの余白
 * @property {number} left   - 左までの余白
 * @property {number} right  - 右までの余白
 * @property {number} bottom - 下までの余白
 */
export interface ScrollMargin {
	top   : number
	left  : number
	right : number
	bottom: number
}

// ---------- ---------- ---------- ---------- ----------
// getScrollMargin
// ---------- ---------- ---------- ---------- ----------
/**
 * スクロールの余白を取得する
 * 
 * @param   {Event} e - イベント
 * @returns {ScrollMargin}
 */
export const getScrollMargin = function (e: Event): ScrollMargin {
	const el = e.currentTarget as HTMLElement
	if (!el) return { top: 0, left: 0, right: 0, bottom: 0 }

	return {
		top   : el.scrollTop,
		left  : el.scrollLeft,
		right : el.scrollWidth - (el.clientWidth + el.scrollLeft),
		bottom: el.scrollHeight - (el.clientHeight + el.scrollTop)
	}
}
