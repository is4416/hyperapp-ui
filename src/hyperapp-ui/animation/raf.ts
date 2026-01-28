// hyperapp-ui / animation / raf.ts

import { Dispatch, Effect, Subscription } from "hyperapp"
import { getValue, setValue } from "../core/state"

// ---------- ---------- ---------- ---------- ----------
// type InternalEffect
// ---------- ---------- ---------- ---------- ----------
/**
 * 戻値としては返されないことを示したエフェクト
 * Effect の型エイリアス
 */
export type InternalEffect<S> = Effect<S>

// ---------- ---------- ---------- ---------- ----------
// interface RAFRuntime
// ---------- ---------- ---------- ---------- ----------
/**
 * rAF : mutable オブジェクト
 * RAFManager でのみ更新される
 * 
 * @type {Object} RAFRuntime
 * @property {number}  [startTime]   - アクション開始時間
 * @property {number}  [currentTime] - 実行時間
 * @property {number}  [pausedTime]  - 一時停止時間
 * @property {boolean} [paused]      - 一時停止フラグ
 * @property {boolean} [isDone]      - 処理終了フラグ
 */
export interface RAFRuntime {
	startTime  ?: number
	currentTime?: number
	pausedTime ?: number
	paused     ?: boolean
	isDone     ?: boolean
}

// ---------- ---------- ---------- ---------- ----------
// interface RAFTask
// ---------- ---------- ---------- ---------- ----------
/**
 * rAF を管理するためのオブジェクト
 * 
 * @template S
 * @type {Object} RAFTask
 * @property {string} id          - ユニークID
 * @property {string} [groupID]   - グループナンバー
 * @property {number} duration    - 1回あたりの処理時間 (ms)
 * @property {number} [delay]     - 開始までの待機時間 (ms)
 * @property {number} [progress]  - 進捗状況 (0 - 1)
 * @property {number} [deltaTime] - 前回からの実行時間
 * 
 * @property {(state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]}  action  - アクション
 * @property {(state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]} [finish] - 終了時アクション
 * 
 * @property {RAFRuntime} runtime   - runtime (mutable)
 * @property {number}    [priority] - 処理優先順位
 * 
 * @property {{ [key: string]: any }} [extension] - 拡張用オプション
 */
export interface RAFTask<S> {
	id      : string
	groupID?: string
	duration: number
	delay  ?: number

	progress  ?: number
	deltaTime ?: number

	action : (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]
	finish?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]

	runtime: RAFRuntime
	priority ?: number
	extension?: { [key: string]: any }
}

// ---------- ---------- ---------- ---------- ----------
// subscription_RAFManager
// ---------- ---------- ---------- ---------- ----------
/**
 * RAFTask 配列をフレームごとに実行するサブスクリプション
 * 
 * @template S
 * @param   {S}        state    - ステート
 * @param   {string[]} keyNames - RAFTask 配列までのパス
 * @returns {Subscription<S>}
 */
export const subscription_RAFManager = function <S>(
	state: S,
	keyNames: string[]
): Subscription<S> {
	return [
		(dispatch: Dispatch<S>, payload: RAFTask<S>[]) => {
			if (!payload.length) return () => {}

			let rafId = 0

			const loop = (now: number) => {
				let hasTasks = false

				dispatch((state: S) => {
					const tasks = [...getValue(state, keyNames, [] as RAFTask<S>[])].sort(
						(a, b) => (b.priority ?? 0) - (a.priority ?? 0)
					)

					const newTasks: RAFTask<S>[] = tasks.map(task => {
						// isDone
						if (task.runtime.isDone) return null


						// init startTime
						if (!task.runtime.startTime) {
							task.runtime.startTime = now + (task.delay ?? 0)
						}

						// paused
						if (task.runtime.paused) {
							task.runtime.pausedTime = task.runtime.pausedTime ?? now
							task.deltaTime = 0
							return task
						}

						// resume
						if (task.runtime.pausedTime !== undefined) {
							task.runtime.startTime += now - task.runtime.pausedTime
							task.runtime.pausedTime = undefined
						}

						// deltaTime
						const prevTime = task.runtime.currentTime ?? now
						task.deltaTime = task.runtime.paused ? 0 : now - prevTime

						// currentTime
						task.runtime.currentTime = now

						// progress
						const progress = Math.min(
							1,
							(now - task.runtime.startTime)
							/ Math.max(1, task.duration)
						)

						// action dispatch
						if (now >= task.runtime.startTime) {
							requestAnimationFrame(() => {
								dispatch((state: S) => task.action(state, { ...task, progress }))
							})
						}

						// finish
						if (progress >= 1) {
							task.runtime.isDone = true

							const finish = task.finish
							if (finish) {
								requestAnimationFrame(() => dispatch((state: S) => finish(state, task)))
							}

							return null
						}

						return task
					}).filter(task => task !== null) as RAFTask<S>[]

					hasTasks = newTasks.length > 0

					return setValue(state, keyNames, newTasks)
				})

				if (hasTasks) rafId = requestAnimationFrame(loop)
			}

			rafId = requestAnimationFrame(loop)

			return () => cancelAnimationFrame(rafId)
		},

		[...getValue(state, keyNames, [] as RAFTask<S>[])]
			.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
	]
}

// ---------- ---------- ---------- ---------- ----------
// effect_RAFPause
// ---------- ---------- ---------- ---------- ----------
/**
 * アニメーションの一時停止を行うエフェクト
 * 
 * @param   {string}   id       - ユニークID
 * @param   {string[]} keyNames - RAFTask 配列までのパス
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_RAFPause = function <S>(
	id      : string,
	keyNames: string[]
): (dispatch: Dispatch<S>) => void {
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
			const task = tasks.find(t => t.id === id)
			if (!task) return state

			task.runtime.paused = true

			return setValue(state, keyNames, [...tasks])
		})
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_RAFResume
// ---------- ---------- ---------- ---------- ----------
/**
 * アニメーションの再開を行うためのエフェクト
 * 
 * @param   {string}   id       - ユニークID
 * @param   {string[]} keyNames - RAFTask 配列までのパス
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_RAFResume = function <S>(
	id      : string,
	keyNames: string[]
): (dispatch: Dispatch<S>) => void {
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
			const task = tasks.find(t => t.id === id)
			if (!task) return state

			task.runtime.paused = false

			return setValue(state, keyNames, [...tasks])
		})
	}
}
