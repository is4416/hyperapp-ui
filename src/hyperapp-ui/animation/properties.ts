// hyperapp-ui / animation / properties.ts

import { Effect, Dispatch } from "hyperapp"
import { getValue, setValue } from "../core/state"
import { RAFTask } from "./raf"

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
		name    : string
		value   : (progress: number) => string
	}[]
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
 * @param   {(state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]} [props.finish] - 終了時アクション
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_RAFProperties = function <S>(
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

		// get progress
		const progress = Math.min(
			1,
			((rafTask.currentTime ?? 0) - (rafTask.startTime ?? 0)) /
			Math.max(1, rafTask.duration)
		)

		// set property
		const list: CSSProperty[] = rafTask.extension.properties
		const elements = list
			? Array.from(new Set(
				list.flatMap(props => {
					const doms = Array.from(document.querySelectorAll(props.selector)) as HTMLElement[]
					doms.forEach(dom => {
						props.rules.forEach(r => dom.style.setProperty(r.name, r.value(progress)))
					})
					return doms
				})
			)) as HTMLElement[]
			: []

		// next
		if (progress < 1) return state

		// finish
		rafTask.isDone = true

		// release gpu layer
		elements.forEach(dom => dom.style.willChange = "")

		// newState
		const newState = setValue(state, keyNames, tasks)

		return finish ? finish(newState, rafTask) : newState
	}

	// result
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {

			// set gpu layer
			properties.forEach(props => {
				const doms = Array.from(document.querySelectorAll(props.selector)) as HTMLElement[]
				const val = [...new Set(props.rules.map(r => r.name).filter(name => GPU_LAYER.has(name)))].join(",")
				doms.forEach(dom => dom.style.willChange = val)
			})

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
