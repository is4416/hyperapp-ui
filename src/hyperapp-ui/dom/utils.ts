// hyperapp-ui / dom / utils.ts

// ---------- ---------- ---------- ---------- ----------
// interface ScrollMargin
// ---------- ---------- ---------- ---------- ----------
/**
 * スクロールの余白
 * 
 * @type {Object} ScrollMargin
 * @property {number} top    - 上までの余白
 * @property {number} left   - 左までの余白
 * @property {number} right  - 右までの余白
 * @property {number} bottom - 下までの余白
 */
export interface ScrollMargin {
	top   : number
	left  : number
	right : number
	bottom: number
}

// ---------- ---------- ---------- ---------- ----------
// getScrollMargin
// ---------- ---------- ---------- ---------- ----------
/**
 * スクロールの余白を取得する
 * 
 * @param   {Event} e - イベント
 * @returns {ScrollMargin}
 */
export const getScrollMargin = function (e: Event): ScrollMargin {
	const el = e.currentTarget as HTMLElement
	if (!el) return { top: 0, left: 0, right: 0, bottom: 0 }

	return {
		top   : el.scrollTop,
		left  : el.scrollLeft,
		right : el.scrollWidth - (el.clientWidth + el.scrollLeft),
		bottom: el.scrollHeight - (el.clientHeight + el.scrollTop)
	}
}
