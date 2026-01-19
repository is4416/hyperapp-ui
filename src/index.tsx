// ---------- ---------- ---------- ---------- ----------
// import 
// ---------- ---------- ---------- ---------- ----------

import { app, VNode } from "hyperapp"
import h from "hyperapp-jsx-pragma"
import {
	setValue,
	Route, SelectButton, OptionButton,
	effect_nodesInitialize,
	effect_setTimedValue,
	effect_throwMessageStart, effect_throwMessagePause, effect_throwMessageResume,
	RAFTask, subscription_RAFManager,
	subscription_nodesCleanup, subscription_nodesLifecycleByIds,
	effect_RAFProperties,
	progress_easing,
	ScrollMargin, getScrollMargin
} from "./hyperapp-ui"

// ---------- ---------- ---------- ---------- ----------
// State
// ---------- ---------- ---------- ---------- ----------

interface State {
	selected : string[]
	group0   : string
	group1   : string
	group2   : string
	timedText: string
	throwMsg : string
	node     : VNode<State> | null
	finalize : boolean
	margin   : ScrollMargin
	tasks    : RAFTask<State>[]
	easing   : keyof typeof progress_easing
}

// ---------- ---------- ---------- ---------- ----------
// action_reset
// ---------- ---------- ---------- ---------- ----------

const action_reset = (state: State) => ({
	selected : [],
	group0   : "",
	group1   : "",
	group2   : "",
	timedText: "",
	throwMsg : "",
	node     : null,
	finalize : false,
	margin   : { top: 0, left: 0, right: 0, bottom: 0 },
	easing   : "linear"
})

// ---------- ---------- ---------- ---------- ----------
// action_setTimedNode
// ---------- ---------- ---------- ---------- ----------

const action_effectButtonClick = (state: State) => {
	const label = (<label>Label</label>)
	const text  = Array.from({length: 40}).map((_, i) => i).join("")

	return [
		state,
		effect_nodesInitialize([
			{
				id: "initTest",
				event: (state: State, element: Element) => {
					const input = element as HTMLInputElement
					input.value = `initTest: width = ${ input.clientWidth }, height = ${ input.clientHeight }`
					return state
				}
			}
		]),
		effect_setTimedValue(["timedText"], "timedText", 2000, "timedText", ""),
		effect_setTimedValue(["node"], "label1", 2000, label, null),
		effect_throwMessageStart(["throwMsg"], "msg", text, 50)
	]
}

// ---------- ---------- ---------- ---------- ----------
// action_throwAction
// ---------- ---------- ---------- ---------- ----------

const action_throwAction = (state: State) => {
	return { ...state }
}

// ---------- ---------- ---------- ---------- ----------
// action_toggleFinalize
// ---------- ---------- ---------- ---------- ----------

const action_toggleFinalize = (state: State) => {
	return setValue(state, ["finalize"], !state.finalize)
}

// ---------- ---------- ---------- ---------- ----------
// action_move
// ---------- ---------- ---------- ---------- ----------

const action_move = (state: State) => {
	const effect = effect_RAFProperties({
		id: "raf",
		keyNames: ["tasks"],
		duration: 1000,

		properties: [{
			selector: "#raf",
			rules   : [
				{
					name : "transform",
					value: (progress: number) => {
						const fn = progress_easing[state.easing]
						return `translate(${ fn(progress) * 10}rem, 0)`
					}
				}
			]
		}],

		finish: (state: State, rafTask: RAFTask<State>) => {
			const dom = document.getElementById(rafTask.id)
			if (!dom) return state
			setTimeout(() => {
				dom.style.transform = "translate(0, 0)"
			}, 1000)
			return state
		}
	})

	return [state, effect]
}

// ---------- ---------- ---------- ---------- ----------
// action_setEasing
// ---------- ---------- ---------- ---------- ----------

const action_setEasing = (state: State, e: Event) => {
	const element = e.currentTarget as HTMLSelectElement
	return setValue(state, ["easing"], element.value)
}

// ---------- ---------- ---------- ---------- ----------
// action_setProperties
// ---------- ---------- ---------- ---------- ----------

const action_setProperties = (state: State) => {

	const effect = effect_RAFProperties({
		id        : "rafP",
		keyNames  : ["tasks"],
		duration  : 1000,
		properties: [
			{
				selector: "#rafP",
				rules: [
					{
						name : "font-size",
						value: (progress: number) => `${ 1 + (progress * 3) }rem`
					},
					{
						name: "margin",
						value: (progress: number) => `0.5rem 0 0.5rem ${ 2 + progress * 5}rem`
					}
				]
			},
		],
		finish: (state: State, rafTask: RAFTask<State>) => {
			const dom = document.getElementById(rafTask.id)
			if (!dom) return state
			setTimeout(() => {
				dom.style.fontSize = "1rem"
				dom.style.margin = "0.5rem 0 0.5rem 2rem"
			}, 1000)
			return state
		}
	})

	return [state, effect]
}

// ---------- ---------- ---------- ---------- ----------
// action_scroll
// ---------- ---------- ---------- ---------- ----------

const action_scroll = (state: State, e: Event) => {
	return setValue(state, ["margin"], getScrollMargin(e))
}

// ---------- ---------- ---------- ---------- ----------
// Entry Point
// ---------- ---------- ---------- ---------- ----------

addEventListener("load", () => {

	// progress_easing
	const easingList: string[] = (() => {
		const r: string[] = []
		for (const p in progress_easing) {
			r.push(p)
		}
		return r
	})()

	// State
	const param: State = {
		selected : [],
		group0   : "",
		group1   : "",
		group2   : "",
		timedText: "",
		throwMsg : "",
		node     : null,
		finalize : false,
		margin   : { top: 0, left: 0, right: 0, bottom: 0 },
		tasks    : [],
		easing   : "linear"
	}

	// app
	app({
		node: document.getElementById("app") as HTMLElement,
		init: param,

		view: (state: State) => (<main>

			{/* *** Tabs Header *** */}
			<div>
				<OptionButton state={state} keyNames={["group0"]} id="page1">SelectButton</OptionButton>
				<OptionButton state={state} keyNames={["group0"]} id="page2">OptionButton</OptionButton>
				<OptionButton
					state    = { state }
					keyNames = { ["group0"] }
					id       = "page3"
					onclick  = { action_effectButtonClick }
				>Effect</OptionButton>
				<OptionButton state={state} keyNames={["group0"]} id="page4">Subscriptions</OptionButton>
				<OptionButton state={state} keyNames={["group0"]} id="page5">DOM / Event</OptionButton>
				<button type="button" onclick={action_reset}>reset</button>
			</div>

			{/* *** Tabs Body *** */}
			<div>
				{/* *** page1: SelectButton *** */}
				<Route state={state} keyNames={["group0"]} match="page1">
					<h2>SelectButton example</h2>

					<h3>select / none</h3>
					<SelectButton state={state} keyNames={["selected"]} id="btn1">select / none</SelectButton>

					<h3>select / reverse / none</h3>
					<SelectButton state={state} keyNames={["selected"]} id="btn2" reverse={true}>select / reverse / none</SelectButton>
				</Route>

				{/* *** page2: OptionButton *** */}
				<Route state={state} keyNames={["group0"]} match="page2">
					<h2>OptionButton example</h2>

					<h3>select</h3>
					<OptionButton state={state} keyNames={["group1"]} id="g1_btn1">group1_btn1</OptionButton>
					<OptionButton state={state} keyNames={["group1"]} id="g1_btn2">group1_btn2</OptionButton>
					<OptionButton state={state} keyNames={["group1"]} id="g1_btn3">group1_btn3</OptionButton>

					<h3>select / reverse</h3>
					<OptionButton state={state} keyNames={["group2"]} id="g2_btn1" reverse={true}>group2_btn1</OptionButton>
					<OptionButton state={state} keyNames={["group2"]} id="g2_btn2" reverse={true}>group2_btn2</OptionButton>
					<OptionButton state={state} keyNames={["group2"]} id="g2_btn3" reverse={true}>group2_btn3</OptionButton>
				</Route>

				{/* *** page3: Effect *** */}
				<Route state={state} keyNames={["group0"]} match="page3">
					<h2>Effect example</h2>

					<h3>effect_initializeNodes</h3>
					<input type="text" id="initTest" />

					<h3>effect_setTimedValue</h3>
					<input type="text" id="timedText" value={ state.timedText } />
					{ state.node }

					<h3>effect_throwMessage</h3>
					<input type="text" id="msg" value={ state.throwMsg } />
					<div>
						<button
							type    = "button"
							onclick = {(state: State) => [state, effect_throwMessagePause("msg")]}
						>pause</button>
						<button
							type    = "button"
							onclick = {(state: State) => [state, effect_throwMessageResume("msg")]}
						>resume</button>
					</div>

					<h2>rAF / Animation System</h2>

					<h3>effect_rAFProperties - transform</h3>
					<button state={state} onclick={action_move} id="raf">{ state.easing }</button><br/>
					<select onchange={action_setEasing}>{
						easingList.map(p => (<option>{p}</option>))
					}</select>

					<h3>effect_rAFProperties - font-size</h3>
					<button state={state} onclick={action_setProperties} id="rafP">font</button>
				</Route>

				{/* *** page4: Subscriptions *** */}
				<Route state={state} keyNames={["group0"]} match="page4">
					<h2>Subscriptions example</h2>

					<h2>subscription_nodesCleanup</h2>
					<button type="button" onclick={action_throwAction}>throw action</button>
					<button type="button" onclick={action_toggleFinalize}>toggle object</button>
					{ state.finalize ? (<span id="dom">object</span>) : null }
				</Route>

				{/* *** page5: DOM / Event *** */}
				<Route state={state} keyNames={["group0"]} match="page5">
					<h2>DOM / Event example</h2>

					<h3>getScrollMargin</h3>
					<div id="parent" onscroll={action_scroll}>
						<div id="child">スクロールしてください</div>
					</div>
					<div>{ JSON.stringify(state.margin) }</div>
				</Route>
			</div>
		</main>),

		subscriptions: (state: State) => [
			...subscription_nodesCleanup([{
				id      : "dom",
				finalize: (state: State) => {
					alert("finalize")
					return state
				}
			}]),
			subscription_RAFManager(state, ["tasks"])
		]
	})
})