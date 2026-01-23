// hyperapp-ui / animation / raf.ts

import { Dispatch, Effect, Subscription } from "hyperapp"
import { getValue, setValue } from "../core/state"

// ---------- ---------- ---------- ---------- ----------
// interface RAFRuntime
// ---------- ---------- ---------- ---------- ----------
/**
 * 即時反映が必要な mutable 処理を前提としたオブジェクト
 * 
 * @type {Object} RAFRuntime
 * 
 * @property {boolean} paused  - 一時停止フラグ
 * @property {boolean} resume  - 再開フラグ
 * @property {boolean} isDone  - 処理終了フラグ
 */
export interface RAFRuntime {
	paused: boolean
	resume: boolean
	isDone: boolean
}

// ---------- ---------- ---------- ---------- ----------
// interface RAFTask
// ---------- ---------- ---------- ---------- ----------
/**
 * requestAnimasionFrame 管理用オブジェクト
 * 
 * @template S
 * @type {Object} RAFTask
 * 
 * @property {string}  id       - ユニークID
 * @property {number} [groupID] - グループナンバー (任意)
 * @property {number}  duration - 1回あたりの処理時間 (ms)
 * 
 * @property {number} [progress]    - 進捗状況 (0-1)
 * @property {number} [startTime]   - 開始時間
 * @property {number} [currentTime] - 現在時間
 * @property {number} [deltaTime]   - 前回からの実行時間
 * 
 * @property {(state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]}  action  - アクション
 * @property {(state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]} [finish] - 終了時アクション
 * 
 * @property {RAFRuntime} runtime - mutable 処理を前提としたオブジェクト
 * 
 * @property {number}               [priority]  - 処理優先順位
 * @property {{[key: string]: any}} [extension] - 拡張用オプション
 */
export interface RAFTask <S> {
	id      : string
	groupID?: number
	duration: number

	progress   ?: number
	startTime  ?: number
	currentTime?: number
	deltaTime  ?: number

	action : (state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]
	finish?: (state: S, rafTask: RAFTask<S>) => S | [S, Effect<S>]

	// 即時反映が必要な mutable 処理を前提としたオブジェクト
	// このプロパティは、ステートにセットする際にクローンしないこと
	runtime: RAFRuntime

	priority ?: number

	// 拡張用のオブジェクト
	// Carousel など、タスク固有ロジック用の拡張領域
	// RAFManager は、extension を一切参照しない
	extension?: {
		[key: string]: any
	}
}

// ---------- ---------- ---------- ---------- ----------
// subscription_RAFManager
// ---------- ---------- ---------- ---------- ----------
/**
 * requestAnimationFrame を利用し、RAFTask をフレームごとに実行するサブスクリプション
 * 
 * @template S
 * @param   {S}        state    - ステート
 * @param   {string[]} keyNames - RAFTask 配列までのパス
 * @returns {Subscription<S>}
 */
export const subscription_RAFManager = function <S> (
	state   : S,
	keyNames: string[]
): Subscription<S> {
	return [
		(dispatch: Dispatch<S>, payload: RAFTask<S>[]) => {
			if (payload.length === 0) return () => {}

			let rafId = 0

			// requestAnimationFrame Callback
			const action = (now: number) => {
				let hasTasks = false

				dispatch((state: S) => {

					// tasks
					const tasks = [...getValue(state, keyNames, [] as RAFTask<S>[])]
						.sort((a, b) => ((b.priority ?? 0) - (a.priority ?? 0)))

					// newTasks
					const newTasks: RAFTask<S>[] = tasks.flatMap(task => {

						// pause
						if (task.runtime.paused && !task.runtime.resume) {
							return [{
								...task,
								currentTime: task.currentTime,
								deltaTime  : 0
							}]
						}

						// done
						if (task.runtime.isDone) return []

						// update time
						const newTask: RAFTask<S> = {
							...task,
							startTime  : task.runtime.resume
								? (task.startTime ?? now) + (now - (task.currentTime ?? now))
								: task.startTime ?? now,
							currentTime: now,
							deltaTime  : now - (task.currentTime ?? now),
						}

						// runtime
						newTask.runtime.paused = false
						newTask.runtime.resume = false

						// get progress (0 - 1)
						newTask.progress = Math.min(
							1,
							(now - (newTask.startTime ?? now)) /
							Math.max(1, newTask.duration)
						)

						// dispatch action
						if (
							newTask.startTime !== undefined &&
							now >= newTask.startTime
						) dispatch((state: S) => newTask.action(state, newTask))

						// finish
						if (!newTask.runtime.isDone && newTask.progress >= 1) {
							newTask.runtime.isDone = true

							const finish = newTask.finish
							if (finish) dispatch((state: S) => finish(state, newTask))

							return []
						}

						// result task
						return [newTask]
					})

					// set has
					hasTasks = newTasks.length > 0

					// set value
					return setValue(state, keyNames, newTasks)

				}) // end dispatch

				// set next animation
				if (hasTasks) rafId = requestAnimationFrame(action)

			} // end action

			// start animation
			rafId = requestAnimationFrame(action)

			// subscription finalize
			return () => cancelAnimationFrame(rafId)
		},

		// payload
		[...getValue(state, keyNames, [] as RAFTask<S>[])]
			.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
	]
}

// ---------- ---------- ---------- ---------- ----------
// effectRAFPause
// ---------- ---------- ---------- ---------- ----------
/**
 * rAF アニメーションの一時停止を行うエフェクト
 * 
 * @template S
 * @param {string}   id       - ユニークID
 * @param {string[]} keyNames - RAFTask 配列までのパス
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_RAFPause = function <S> (
	id      : string,
	keyNames: string[]
): (dispatch: Dispatch<S>) => void {
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
			const task  = tasks.find(task => task.id === id)
			if (!task) return state

			task.runtime.paused = true
			task.runtime.resume = false

			return setValue(state, keyNames, [ ...tasks ])
		})
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_RAFResume
// ---------- ---------- ---------- ---------- ----------
/**
 * rAF アニメーションの一時停止からの再開を行うエフェクト
 * 
 * @template S
 * @param {string}   id       - ユニークID
 * @param {string[]} keyNames - RAFTask 配列までのパス
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_RAFResume = function <S> (
	id      : string,
	keyNames: string[]
): (dispatch: Dispatch<S>) => void {
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
			const task  = tasks.find(task => task.id === id)
			if (!task) return state

			task.runtime.resume = true

			return setValue(state, keyNames, [ ...tasks ])
		})
	}
}