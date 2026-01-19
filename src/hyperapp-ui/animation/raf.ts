// hyperapp-ui / animation / raf.ts

import { Dispatch, Effect, Subscription } from "hyperapp"
import { getValue, setValue } from "../core/state"

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
						if (task.paused && !task.resume) {
							return [{
								...task,
								currentTime: task.currentTime,
								deltaTime  : 0
							}]
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
