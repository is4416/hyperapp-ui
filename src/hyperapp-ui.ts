import { VNode, Effect } from "hyperapp"
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

// ---------- ---------- ---------- ---------- ----------
// deleteKeys
// ---------- ---------- ---------- ---------- ----------
/**
 * オブジェクトから複数キーを削除する
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

// ---------- ---------- ---------- ---------- ----------
// concatAction
// ---------- ---------- ---------- ---------- ----------
/**
 * アクションを結合して結果を返す
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
	return action ? action(newState, e) : newState
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
