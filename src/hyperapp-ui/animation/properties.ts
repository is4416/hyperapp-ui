// hyperapp-ui / animation / properties.ts

import { Dispatch } from "hyperapp"
import { getValue, setValue } from "../core/state"
import { InternalEffect, RAFTask } from "./raf"

// ---------- ---------- ---------- ---------- ----------
// interface CSSProperty
// ---------- ---------- ---------- ---------- ----------
/**
 * アニメーション進捗 (0〜1) を受け取り CSS 値を返す関数
 *
 * @type {Object.<string, Object.<string, (progress: number) => string>>} CSSProperty
 * @property {Object.<string, (progress: number) => string>} [selector]
 * @param {number} progress
 */
export interface CSSProperty {
	[selector: string]: {
		[name: string]: (progress: number) => string
	}
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
		const list: CSSProperty[] = rafTask.extension?.properties ?? []

		const elements = Array.from(new Set(
			list.flatMap(p => {
				const selector = Object.keys(p)[0]
				const rules    = p[selector]

				// get DOMS
				const doms = Array.from(document.querySelectorAll<HTMLElement>(selector))

				// set style
				doms.forEach(dom => {
					for (const name in rules) {
						const fn = rules[name]
						dom.style.setProperty(name, fn(rafTask.progress ?? 0))
					}
				})

				// result
				return doms
			})
		))

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
				const selector = Object.keys(p)[0]
				const rules    = p[selector]

				const doms = Array.from(document.querySelectorAll<HTMLElement>(selector))
				const val  = Object.keys(rules).filter(name => GPU_LAYER.has(name)).join(",")

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
