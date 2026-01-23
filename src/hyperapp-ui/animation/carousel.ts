import { Dispatch, Effect } from "hyperapp";
import { getValue, setValue } from "../core/state"
import { RAFTask } from "./raf";
import { CSSProperty, createRAFProperties, effect_RAFProperties } from "./properties";

// ---------- ---------- ---------- ---------- ----------
// interface CarouselState
// ---------- ---------- ---------- ---------- ----------
/**
 * Carousel 管理用オブジェクト
 * 
 * @type {Object} CarouselState
 * @property {number} index - 先頭のインデックス
 * @property {number} total - 子の数
 */
export interface CarouselState {
	index  : number
	total  : number
}

// ---------- ---------- ---------- ---------- ----------
// createRAFCarousel
// ---------- ---------- ---------- ---------- ----------
/**
 * subscription_RAFManager をベースにした Carousel アニメーション RAFTask を作成する
 * 
 * @template S
 * @param {Object}   props          - props
 * @param {string}   props.id       - ユニークID (DOM の id と同一)
 * @param {string[]} props.keyNames - RAFTask 配列までのパス
 * @param {number}   props.duration - 実行時間 (ms)
 * @param {number}   props.interval - 待機時間 (ms)
 * @param {(t: number) => number} [props.easing] - easing 関数
 * @param {(state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]} [props.finish] - 終了時イベント
 * @param {{CarouselState, [key: string]: any}} props.extention - CSSProperty / CarouselState 拡張
 */
export const createRAFCarousel = function <S> (
	props: {
		id       : string
		keyNames : string[]
		duration : number
		interval : number
		easing  ?: (t: number) => number
		finish  ?: (state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]
		extension: {
			carouselState: CarouselState
			[key: string]: any
		}
	}
): RAFTask<S> {
	const { id, keyNames, duration, interval, easing = (t: number) => t, finish, extension } = props

	// task
	const result = createRAFProperties({ id, keyNames, duration, properties: [], finish, extension })
	result.startTime = performance.now() + interval
	result.runtime.isDone = true

	// DOM parent
	const parent = document.getElementById(id) as HTMLElement
	if (!parent) return result

	// DOM children
	const children = Array.from(parent.children) as HTMLElement[]
	if (!children || children.length < 2) return result

	// width
	const width = children[1].offsetLeft - children[0].offsetLeft

	// set properties
	const properties: CSSProperty[] = [{
		selector: `#${ id }`,
		rules: [{
			name : "transform",
			value: (progress: number) => `translateX(${ - easing(progress) * width }px)`
		}]
	}]

	result.extension = {
		...result.extension,
		properties,
	}
	result.runtime.isDone = false

	return result
}

// ---------- ---------- ---------- ---------- ----------
// effect_carouselStart
// ---------- ---------- ---------- ---------- ----------
/**
 * subscription_RAFManager をベースにした Carousel アニメーションエフェクト
 * 
 * @template S
 * @param {Object}   props          - props
 * @param {string}   props.id       - ユニークID (DOM の id と同一)
 * @param {string[]} props.keyNames - RAFTask 配列までのパス
 * @param {number}   props.duration - 実行時間 (ms)
 * @param {number}   props.interval - 待機時間 (ms)
 * 
 * @param {(t: number) => number} [props.easing] - easing 関数
 * @param {(state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]} [props.onchange]
 *  - 実行時間終了後に呼ばれるイベント
 * 
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_carouselStart = function <S> (
	props: {
		id       : string
		keyNames : string[]
		duration : number
		interval : number
		easing  ?: (t: number) => number
		onchange?: (state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]
	}
): (dispatch: Dispatch<S>) => void {
	const { id, keyNames, duration, interval, easing = (t: number) => t, onchange } = props

	// finish
	const finish = (state: S, rafTask: RAFTask<S>): S | [S, Effect<S>] => {
		return [
			state,
			(dispatch: Dispatch<S>): void => {
				// tasks
				const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
					.filter(task => task.id !== rafTask.id)

				// DOM parent
				const parent = document.getElementById(rafTask.id) as HTMLElement
				if (!parent) return

				// DOM children
				const children = Array.from(parent.children) as HTMLElement[]
				if (!children || children.length < 2) return

				// set style
				parent.style.transform = `translateX(0px)`

				// loop
				const firstChild = children[0]
				parent.appendChild(firstChild)

				// CarouselState
				const param: CarouselState = rafTask.extension?.carouselState
				const carouselState: CarouselState = {
					index: param.index + 1 < param.total ? param.index + 1 : 0,
					total: children.length
				}

				// set extension
				const extension = {
					...rafTask.extension,
					carouselState
				}

				// newTask
				const newTask: RAFTask<S> = createRAFCarousel({
					id, keyNames, duration, interval, easing, finish, extension
				})

				// onchange
				if (onchange) {
					requestAnimationFrame(() => {
						dispatch((state: S) => onchange(state, newTask))
					})
				}

				// next
				requestAnimationFrame(() => {
					dispatch((state: S) => setValue(state, keyNames, tasks.concat(newTask)))
				})
			}
		]
	}

	// result
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			// DOM parent
			const parent = document.getElementById(id) as HTMLElement
			if (!parent) return state

			// DOM children
			const children = Array.from(parent.children) as HTMLElement[]
			if (!children || children.length < 2) return state

			// get task
			const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
				.filter(task => task.id !== id)

			// newTask
			const newTask = createRAFCarousel({
				id, keyNames, duration, interval, easing, finish,
				extension: {
					carouselState: {
						index: 0,
						total: children.length
					}
				}
			})
			// newTask.startTime = performance.now() ← すぐ動かしたいならこう

			// result
			return setValue(state, keyNames, tasks.concat(newTask))
		})
	}
}
