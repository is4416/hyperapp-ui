// hyperapp-ui / animation / properties.ts

import { Dispatch } from "hyperapp"
import { getValue, setValue } from "../core/state"
import { InternalEffect, RAFTask } from "./raf"

// ---------- ---------- ---------- ---------- ----------
// interface CSSProperty
// ---------- ---------- ---------- ---------- ----------
/**
 * CSS設定オブジェクト
 * 
 * @type {Object} CSSProperty
 * @property {string}                                                selector    - セレクター
 * @property {{name: string, value: (progress: number) => string}[]} rules       - ルール
 * @property {string}                                                rules.name  - プロパティ名
 * @property {(progress: number) => string}                          rules.value - CSS 値
 */
export interface CSSProperty {
	selector: string
	rules   : {
		name : string
		value: (progress: number) => string
	}[]
}

// ---------- ---------- ---------- ---------- ----------
// createRAFProperties
// ---------- ---------- ---------- ---------- ----------
/**
 * subscription_RAFManager をベースにした CSS アニメーション RAFTask を作成する
 * 
 * @template S
 * @param   {Object}        props            - props
 * @param   {string}        props.id         - ユニークID
 * @param   {string[]}      props.keyNames   - RAFTaks 配列までのパス
 * @param   {number}        props.duration   - 実行時間 (ms)
 * @param   {CSSProperty[]} props.properties - CSS設定オブジェクト配列
 * @param   {(state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]} [props.finish] - 終了時アクション
 * @param   {{[key: string]: any}} [props.extension] - 拡張オプション
 * @returns {RAFTask<S>}
 */
export const createRAFProperties = function <S> (
	props: {
		id        : string,
		keyNames  : string[],
		duration  : number,
		properties: CSSProperty[],
		finish   ?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>],
		extension?: { [key: string]: any }
	}
): RAFTask<S> {
	const { id, keyNames, duration, properties, finish, extension } = props

	// action
	const action = (state: S, rafTask: RAFTask<S>) => {
		// get tasks
		const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
			.filter(task => task.id !== rafTask.id)

		// set property
		const list: CSSProperty[] = rafTask.extension?.properties
		const elements = list
			? Array.from(new Set(
				list.flatMap(props => {
					const doms = Array.from(document.querySelectorAll(props.selector)) as HTMLElement[]
					doms.forEach(dom => {
						props.rules.forEach(r => dom.style.setProperty(r.name, r.value((rafTask.progress ?? 0))))
					})
					return doms
				})
			)) as HTMLElement[]
			: []

		// next
		if ((rafTask.progress ?? 0) < 1) return state

		// finish
		rafTask.runtime.isDone = true

		// release gpu layer
		elements.forEach(dom => dom.style.willChange = "")

		// newState
		const newState = setValue(state, keyNames, tasks)

		return finish ? finish(newState, rafTask) : newState
	}

	// result
	return {
		id, duration, action, finish,
		runtime: {
			paused: false,
			resume: false,
			isDone: false
		},
		extension: {
			...extension,
			properties
		}
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_RAFProperties
// ---------- ---------- ---------- ---------- ----------
const GPU_LAYER = new Set(["transform", "opacity"])

/**
 * subscription_RAFManager をベースにした CSS アニメーションエフェクト
 * 
 * @template S
 * @param   {Object}        props            - props
 * @param   {string}        props.id         - ユニークID
 * @param   {string[]}      props.keyNames   - RAFTaks 配列までのパス
 * @param   {number}        props.duration   - 実行時間 (ms)
 * @param   {CSSProperty[]} props.properties - CSS設定オブジェクト配列
 * @param   {(state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]} [props.finish] - 終了時アクション
 * @param   {{[key: string]: any}} [props.extension] - 拡張オプション
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_RAFProperties = function <S> (
	props: {
		id        : string,
		keyNames  : string[],
		duration  : number,
		properties: CSSProperty[],
		finish   ?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>],
		extension?: {
			[key: string]: any
		}
	}
): (dispatch : Dispatch<S>) => void {
	const { id, keyNames, properties } = props

	// result
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {

			// set gpu layer
			properties.forEach(p => {
				const doms = Array.from(document.querySelectorAll(p.selector)) as HTMLElement[]
				const val = [...new Set(p.rules.map(r => r.name).filter(name => GPU_LAYER.has(name)))].join(",")
				doms.forEach(dom => dom.style.willChange = val)
			})

			// newTask
			const newTask = createRAFProperties(props)

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
