// Gates imports
import AndGate from "../gates/AND";
import OrGate from "../gates/OR";
import Wire from "../gates/Wire";
import { GateCoords } from "./canvas";
import NotGate from "../gates/NOT";
import Switch from "../gates/Switch";
import LED from "../gates/LED";
import GateNode from "../gates/Node";

// Home
export interface Child extends WinBarResize {
	initWidth: number,
	initHeight: number,
	initX: number,
	initY: number
}
export interface Component {
	width: number,
	height: number
}
export interface HomeState {
	child1: Child,
	child2: Child
}
export interface HomeProps {
	testing?: boolean
}
// Gates
export interface AllGates {
	and: AndGate[],
	or: OrGate[],
	wire: Wire[],
	not: NotGate[],
	switch: Switch[],
	led: LED[]
}
// WinBar
export interface WinBarState extends Component {
	title: string,
	focused: boolean,
	offsetX: number,
	offsetY: number,
	resize: string
}
export interface WinBarProps {
	title: string,
	type: string,
	identity: number,
	resize: string,
}
export interface WinBarResize extends Component {
	x: number,
	y: number
}

// Menu
export interface MenuState {
	mode: string,
	loading: boolean
}
export interface MenuProps extends Component {

}

// Workspace
export interface WorkspaceState {
	width: string,
	height: string,
	mode: string,
	dragInit: GateCoords,
	drag: GateCoords,
	dragging: boolean,
	gridFactor: number,
	snapFactor: number
}
export interface WorkspaceProps extends Component {
	name?: string,
	testing?: boolean
}

export interface WorkspaceSaveState {
	gates: { and: AndGate[], wire: Wire[], or: OrGate[], not: NotGate[], switch: Switch[], led: LED[] },
	endNodes:  GateNode<any>[],
	startNodes:  GateNode<any>[],
	gridFactor: number,
	snapFactor: number
}