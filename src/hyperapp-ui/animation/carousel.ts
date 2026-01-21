import { Dispatch, Effect } from "hyperapp";
import { RAFTask } from "./raf";
import { effect_RAFProperties } from "./properties";
import { concatAction } from "../core/component";

// ---------- ---------- ---------- ---------- ----------
// interface CarouselState
// ---------- ---------- ---------- ---------- ----------

export interface CarouselState {
	index  : number
	total  : number
	timerID: number
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

	// create effect
	const createEffect = (
		width  : number,
		index  : number,
		total  : number,
		timerID: number
	) => effect_RAFProperties({
		id, keyNames, duration,

		// properties
		properties: [{
			selector: `#${ id }`,
			rules: [{
				name : "transform",
				value: (progress: number) => `translateX(${ - easing(progress) * width }px)`
			}]
		}],

		// finish
		finish: (state: S, rafTask: RAFTask<S>): S | [S, Effect<S>] => {
			return [state, (dispatch: Dispatch<S>) => {
				const param: CarouselState = rafTask.extension.carouselState
				const newTask: RAFTask<S> = { ...rafTask,
					extension: { ...rafTask.extension,
						carouselState: { ...param,
							index: param.index + 1 < param.total
								? param.index + 1
								: 0
						}
					}
				} // end newTask
				
				// DOM parent
				const parent = document.getElementById(newTask.id) as HTMLElement
				if (!parent) return

				// DOM children
				const children = Array.from(parent.children) as HTMLElement[]
				if (!children || children.length < 2) return

				// reset property
				parent.style.transform = `translate(0px)`

				// loop
				const firstChild = children[0]
				parent.appendChild(firstChild)

				// onchange
				requestAnimationFrame(() => {
					dispatch((state: S) => {
						return onchange
							? onchange(state, newTask)
							: { ...state }
					})
				})

				// next
				const timerID = window.setTimeout(() => {
					dispatch((state: S) => [
						state,
						createEffect(
							(parent.children[1] as HTMLElement).offsetLeft -
							(parent.children[0] as HTMLElement).offsetLeft,
							newTask.extension.carouselState.index,
							children.length,
							timerID
						)
					])
				}, interval)
			}]
		},

		// extension
		extension: { carouselState: { index, total, timerID } }
	})

	// result
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {

			// DOM parent
			const parent = document.getElementById(id)
			if (!parent) return state

			// DOM children
			const children = Array.from(parent.children) as HTMLElement[]
			if (!children || children.length < 2) return state

			// get width
			const width = children[1].offsetLeft - children[0].offsetLeft

			return [state, createEffect(width, 0, children.length, 0)]
		})
	}
}
