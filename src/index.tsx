// ---------- ---------- ---------- ---------- ----------
// import 
// ---------- ---------- ---------- ---------- ----------

import { app } from "hyperapp"
import h from "hyperapp-jsx-pragma"

import { Route, SelectButton, OptionButton } from "./hyperapp-ui"

// ---------- ---------- ---------- ---------- ----------
// State
// ---------- ---------- ---------- ---------- ----------

interface State {
	selected: string[]
	group0  : string
	group1  : string
	group2  : string
}

// ---------- ---------- ---------- ---------- ----------
// action_reset
// ---------- ---------- ---------- ---------- ----------

const action_reset = (state: State) => ({
	selected: [],
	group0  : "",
	group1  : "",
	group2  : ""
})

// ---------- ---------- ---------- ---------- ----------
// Entry Point
// ---------- ---------- ---------- ---------- ----------

addEventListener("load", () => {
	app({
		node: document.getElementById("app") as HTMLElement,
		init: {
			selected: [],
			group0  : "",
			group1  : "",
			group2  : ""
		},
		view: (state: State) => (<main>
			<div>
				<OptionButton state={state} keyNames={["group0"]} id="page1">SelectButton</OptionButton>
				<OptionButton state={state} keyNames={["group0"]} id="page2">OptionButton</OptionButton>
				<button type="button" onclick={action_reset}>reset</button>
			</div>

			<div>
				<Route state={state} keyNames={["group0"]} match="page1">
					<h2>SelectButton example</h2>

					<SelectButton state={state} keyNames={["selected"]} id="btn1">select / none</SelectButton>
					<SelectButton state={state} keyNames={["selected"]} id="btn2" reverse={true}>select / reverse / none</SelectButton>
				</Route>

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
			</div>
		</main>)
	})
})