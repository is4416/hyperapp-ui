// ---------- ---------- ---------- ---------- ----------
// import 
// ---------- ---------- ---------- ---------- ----------

import { app, VNode } from "hyperapp"
import h from "hyperapp-jsx-pragma"

import {
	Route, SelectButton, OptionButton,
	effect_setTimedValue, effect_throwMessage, effect_pauseThrowMessage, effect_resumeThrowMessage,
	ScrollMargin, getScrollMargin,
	setValue
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
	margin   : ScrollMargin
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
	margin   : { top: 0, left: 0, right: 0, bottom: 0 }
})

// ---------- ---------- ---------- ---------- ----------
// action_setTimedNode
// ---------- ---------- ---------- ---------- ----------

const action_effectButtonClick = (state: State) => {
	const label = (<label>Label</label>)
	const text  = Array.from({length: 40}).map((_, i) => i).join("")

	return [
		state,
		effect_setTimedValue(["timedText"], "timedText", 2000, "timedText", ""),
		effect_setTimedValue(["node"], "label1", 2000, label, null),
		effect_throwMessage(["throwMsg"], "msg", text, 50)
	]
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
	app({
		node: document.getElementById("app") as HTMLElement,
		init: {
			selected : [],
			group0   : "",
			group1   : "",
			group2   : "",
			timedText: "",
			throwMsg : "",
			node     : null,
			margin   : { top: 0, left: 0, right: 0, bottom: 0 }
		},
		view: (state: State) => (<main>

			{/* *** Tabs Header *** */}
			<div>
				<OptionButton state={state} keyNames={["group0"]} id="page1">SelectButton</OptionButton>
				<OptionButton state={state} keyNames={["group0"]} id="page2">OptionButton</OptionButton>
				<OptionButton state={state}	keyNames={["group0"]} id="page5">Graph</OptionButton>
				<OptionButton
					state    = { state }
					keyNames = { ["group0"] }
					id       = "page3"
					onclick  = { action_effectButtonClick }
				>Effect</OptionButton>
				<OptionButton state={state} keyNames={["group0"]} id="page4">DOM / Event</OptionButton>
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

				{/* *** page5: Graph *** */}
				<Route state={state} keyNames={["group0"]} match="page5">
					<h2>Graph</h2>

					<h3>Line Graph</h3>
					<div style={{
						position: "absolute",
						margin  : "0.5rem 0 0 2rem",
						width   : "20rem",
						height  : "10rem",
						border  : "1px gray solid",
						backgroundColor: "white"
					}}>
						<svg
							width  = "100%"
							height = "100%"
						>
							<polyline
								fill        = "none"
								stroke      = "red"
								points      = "0,0 100,100"
							/>
						</svg>
					</div>
				</Route>

				{/* *** page3: Effect *** */}
				<Route state={state} keyNames={["group0"]} match="page3">
					<h2>Effect example</h2>

					<h3>effect_setTimedValue</h3>
					<input type="text" id="timedText" value={ state.timedText } />
					{ state.node }

					<h3>effect_throwMessage</h3>
					<input type="text" id="msg" value={ state.throwMsg } />
					<div>
						<button
							type    = "button"
							onclick = {(state: State) => [state, effect_pauseThrowMessage("msg")]}
						>pause</button>
						<button
							type    = "button"
							onclick = {(state: State) => [state, effect_resumeThrowMessage("msg")]}
						>resume</button>
					</div>
				</Route>

				{/* *** page4: DOM / Event *** */}
				<Route state={state} keyNames={["group0"]} match="page4">
					<h2>DOM / Event example</h2>

					<h3>getScrollMargin</h3>
					<div id="parent" onscroll={action_scroll}>
						<div id="child">スクロールしてください</div>
					</div>
					<div>{ JSON.stringify(state.margin) }</div>
				</Route>
			</div>
		</main>)
	})
})