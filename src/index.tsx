// ---------- ---------- ---------- ---------- ----------
// import 
// ---------- ---------- ---------- ---------- ----------

import { app } from "hyperapp"
import h from "hyperapp-jsx-pragma"

import { SelectButton, OptionButton } from "./hyperapp-ui"

// ---------- ---------- ---------- ---------- ----------
// State
// ---------- ---------- ---------- ---------- ----------

interface State {
	selected: string[]
	group   : string
}

// ---------- ---------- ---------- ---------- ----------
// Entry Point
// ---------- ---------- ---------- ---------- ----------

addEventListener("load", () => {
	app({
		node: document.getElementById("app") as HTMLElement,
		init: {
			selected: [],
			group   : ""
		},
		view: (state: State) => (<div>
			<div>
				<SelectButton state={state} keyNames={["selected"]} id="btn1">Btn1</SelectButton>
				<SelectButton state={state} keyNames={["selected"]} id="btn2" reverse={true}>Btn2</SelectButton>
			</div>
			<div>
				<OptionButton state={state} keyNames={["group"]} id="btn3" reverse={true}>Btn3</OptionButton>
				<OptionButton state={state} keyNames={["group"]} id="btn4" reverse={true}>Btn4</OptionButton>
				<OptionButton state={state} keyNames={["group"]} id="btn5" reverse={true}>Btn5</OptionButton>
			</div>
		</div>)
	})
})