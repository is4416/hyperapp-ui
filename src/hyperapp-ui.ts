import { VNode, Dispatch, Effect } from "hyperapp"
import h from "hyperapp-jsx-pragma"

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
// 表示制御
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
 * @param   {string[]}            props.keyNames - ステート内の文字までのパス
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

/* 補助関数 */

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
	props: { [key: string]: any},
	...keys: string[]
): { [key: string]: any } => {
	const result = { ...props }

	keys.forEach(key => delete result[key])

	return result
}

/* コンポーネント */

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
	return h("button", {
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
	return h("button", {
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
 * @property {string} id - ユニークID
 * @property {(state: S, element: Element) => S | [S, Effect<S>]}
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
		id: string
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
