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
 * requestAnimasionFrame 管理用オブジェクト
 * 
 * @template S
 * @type {Object} RAFTask
 * @property {string}   id           - ユニークID
 * @property {number}   duration     - 1回あたりの処理時間 (ms)
 * @property {number}  [startTime]   - 開始時間
 * @property {number}  [currentTime] - 現在時間
 * @property {number}  [deltaTime]   - 前回からの実行時間
 * @property {number}  [priority]    - 処理優先順位
 * @property {boolean} [paused]      - 一時停止フラグ
 * @property {boolean} [resume]      - 再開フラグ
 * @property {boolean} [isDone]      - 処理終了フラグ
 * @property {(state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]}  action  - アクション
 * @property {(state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]} [finish] - 終了時アクション
 * @property {any} [extension] - 拡張用オプション
 */
export interface RAFTask <S> {
	id          : string
	duration    : number
	startTime  ?: number
	currentTime?: number
	deltaTime  ?: number
	priority   ?: number
	paused     ?: boolean
	resume     ?: boolean
	isDone     ?: boolean
	action      : (state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]
	finish     ?: (state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]
	extension  ?: any
}

// ---------- ---------- ---------- ---------- ----------
// subscription_rAFManager
// ---------- ---------- ---------- ---------- ----------
/**
 * requestAnimationFrame を利用し、RAFTask をフレームごとに実行するサブスクリプション
 * 
 * @template S
 * @param   {S}        state    - ステート
 * @param   {string[]} keyNames - RAFTask 配列までのパス
 * @returns {Subscription<S>}
 */
export const subscription_rAFManager = function <S> (
	state   : S,
	keyNames: string[]
): Subscription<S> {
	return [
		(dispatch: Dispatch<S>, payload: RAFTask<S>[]) => {
			if (payload.length === 0) return () => {}

			let rafId = 0

			// requestAnimationFrame Callback
			const action = (now: number) => {
				dispatch((state: S) => {

					// tasks
					const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
						.sort((a, b) => ((b.priority ?? 0) - (a.priority ?? 0)))

					// newTasks
					const newTasks: RAFTask<S>[] = tasks.flatMap(task => {

						// pause
						if (task.paused && !task.resume) {
							return {
								...task,
								currentTime: task.currentTime,
								deltaTime  : 0
							}
						}

						// done
						if (task.isDone) return []

						// update time
						const newTask: RAFTask<S> = {
							...task,
							startTime  : task.resume
								? (task.startTime ?? now) + (now - (task.currentTime ?? now))
								: task.startTime ?? now,
							currentTime: now,
							deltaTime  : now - (task.currentTime ?? now),
							paused     : false,
							resume     : undefined
						}

						// get progress (0 - 1)
						const progress = Math.min(
							1,
							(now - (newTask.startTime ?? now)) /
							Math.max(1, newTask.duration)
						)

						// dispatch action
						if (
							newTask.startTime !== undefined &&
							now >= newTask.startTime
						) dispatch([task.action, newTask])

						// finish
						if (!task.isDone && progress >= 1) {
							newTask.isDone = true
							if (task.finish) dispatch([task.finish, newTask])
							return []
						}

						// result task
						return [newTask]
					})

					// set value
					return setValue(state, keyNames, newTasks)

				}) // end dispatch

				// set next animation
				rafId = requestAnimationFrame(action)

			} // end action

			// start animation
			rafId = requestAnimationFrame(action)

			// subscription finalize
			return () => cancelAnimationFrame(rafId)
		},

		// payload
		getValue(state, keyNames, [] as RAFTask<S>[])
			.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
	]
}

// ---------- ---------- ---------- ---------- ----------
// interface CSSProperty
// ---------- ---------- ---------- ---------- ----------
/**
 * CSS設定オブジェクト
 * 
 * @type {Object} CSSProperty
 * @property {string}                       name  - プロパティ名
 * @property {(progress: number) => string} value
 * - 進行状況 progress (0 - 1) に応じて、設定する値を返す関数
 */
export interface CSSProperty {
	name : string
	value: (progress: number) => string
}

// ---------- ---------- ---------- ---------- ----------
// effect_rAFProperties
// ---------- ---------- ---------- ---------- ----------
const GPU_LAYER = new Set(["transform", "opacity"])

/**
 * subscription_rAFManager をベースにした CSS アニメーションエフェクト
 * 
 * @template S
 * @param   {Object}        props            - プロパティ
 * @param   {string}        props.id         - ユニークID
 * @param   {string[]}      props.keyNames   - RAFTaks 配列までのパス
 * @param   {number}        props.duration   - 実行時間 (ms)
 * @param   {CSSProperty[]} props.properties - CSS設定オブジェクト配列
 * @param   {(state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]} [props.finish] - 終了時アクション
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_rAFProperties = function <S>(
	props: {
		id        : string,
		keyNames  : string[],
		duration  : number,
		properties: CSSProperty[],
		finish   ?: (state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]
	}
): (dispatch : Dispatch<S>) => void {
	const { id, keyNames, duration, properties, finish } = props

	// action
	const action = (state: S, rafTask: RAFTask<S>) => {
		// get tasks
		const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
			.filter(task => task.id !== rafTask.id)
			.sort((a, b) => ((b.priority ?? 0) - (a.priority ?? 0)))

		// get dom
		const dom = document.getElementById(rafTask.id)
		if (!dom) {
			return setValue(state, keyNames, tasks)
		}

		// get progress
		const progress = Math.min(
			1,
			((rafTask.currentTime ?? 0) - (rafTask.startTime ?? 0)) /
			Math.max(1, rafTask.duration)
		)

		// set property
		const list: CSSProperty[] = rafTask.extension.properties
		if (list) list.forEach(p => dom.style.setProperty(p.name, p.value(progress)))

		// next
		if (progress < 1) return state

		// finish
		rafTask.isDone = true

		// release gpu layer
		dom.style.willChange = ""

		// newState
		const newState = setValue(state, keyNames, tasks)

		return finish ? finish(newState, rafTask) : newState
	}

	// result
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {

			// set gpu layer
			const dom = document.getElementById(id)
			if (dom) {
				dom.style.willChange = [...new Set(
					properties
						.map(p => p.name)
						.filter(name => GPU_LAYER.has(name))
				)].join(",")
			}

			// newTask
			const newTask: RAFTask<S> = {
				id, duration, action, extension: { properties }
			}

			// set value
			return setValue(
				state,
				keyNames,
				getValue(state, keyNames, [] as RAFTask<S>[])
					.filter(task => task.id !== id)
					.concat(newTask)
			)
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
