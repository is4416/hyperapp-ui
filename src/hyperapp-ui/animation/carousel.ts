import { Dispatch } from "hyperapp";
import { RAFTask } from "./raf";
import { effect_RAFProperties } from "./properties";

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
 * @param {number}   props.width    - 1アイテムの幅
 */
export const effect_carouselStart = function <S> (
	props: {
		id      : string
		keyNames: string[]
		duration: number
		interval: number
		easing? : (t: number) => number
	}
): (dispatch: Dispatch<S>) => void {
	const { id, keyNames, duration, interval, easing = (t: number) => t } = props

	const createEffect = (width: number) => effect_RAFProperties({
		id, keyNames, duration,
		properties: [{
			selector: `#${ id }`,
			rules: [{
				name : "transform",
				value: (progress: number) => `translateX(${ - easing(progress) * width }px)`
			}]
		}],
		finish: (state: S, rafTask: RAFTask<S>) => {
			return [state, (dispatch: Dispatch<S>) => {
				const parent = document.getElementById(rafTask.id)
				if (!parent) return

				const children = Array.from(parent.children) as HTMLElement[]
				if (!children || children.length === 0) return

				const firstChild = children[0]
				parent.appendChild(firstChild)

				parent.style.transform = `translateX(0px)`

				setTimeout(() => dispatch((state: S) => [state, createEffect(width)]), interval)
			}]
		}
	})

	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			const parent = document.getElementById(id)
			if (!parent) return state

			const children = Array.from(parent.children) as HTMLElement[]
			if (!children || children.length < 2) return state

			const width = children[1].offsetLeft - children[0].offsetLeft

			return [state, createEffect(width)]
		})
	}
}
