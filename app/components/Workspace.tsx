import * as React from 'react';
import { Wiring } from '../actions/canvas';
import { Logic } from '../actions/logic';
import { Saving } from '../actions/saving';
//import items (gates etc)
import * as LogicGates from '../gates/all';
import * as ICanvas from '../interfaces/canvas';
import * as IComponent from '../interfaces/components';


let styles = require('./styles/Workspace.scss');


export default class Workspace extends React.Component<IComponent.WorkspaceProps, IComponent.WorkspaceState> {

	// private states for non-react components

	private canvas: HTMLCanvasElement

	public ctx: CanvasRenderingContext2D
	public gates: IComponent.AllGates
	public endNodes: LogicGates.GateNode<ICanvas.AnyGate>[] = []
	public startNodes: LogicGates.GateNode<ICanvas.AnyGate>[] = []

	private nodeSelectEnd: ICanvas.SelectedNode<any>
	private nodeSelectStart: ICanvas.SelectedNode<any>

	private clicked: ICanvas.AnyGate[] = [];
	private clickedDrag: ICanvas.AnyGate[] = [];

	public constructor(props: IComponent.WorkspaceProps) {
		super(props);
		this.gates = { and: [], wire: [], or: [], not: [], switch: [], led: [] }
		
		this.state = {
			width: (this.props.width * window.innerWidth / 100).toString(),
			height: (this.props.height * window.innerHeight / 100).toString(),
			mode: "draw",
			dragging: false,
			dragInit: { x: 0, y: 0 },
			drag: { x: 0, y: 0 },
			gridFactor: 20,
			snapFactor: 20,
			canvasDrag: false,
			context: null
		}
		
		this.nodeSelectEnd = { node: null, selected: false }
		this.nodeSelectStart = { node: null, selected: false }

		this.canvasEvent = this.canvasEvent.bind(this);
	}

	public save = (saveAs: boolean): void => {
		if (saveAs) {
			Saving.saveState(this);
		} else {
			if (!!this.state.path) {
				Saving.saveState(this, this.state.path);
			} else {
				Saving.saveState(this);
			}
		}
		
	}

	public deleteGate = (id: number): void => {
		let is = [];
		for (let index in this.startNodes) {
			if (this.startNodes[index].state.gate.state.id === id) {
				is.push(+index);
			}
		}
		for (let i of is) this.startNodes.splice(i, 1);
		is = [];
		for (let index in this.endNodes) {
			if (this.endNodes[index].state.gate.state.id === id) {
				is.push(+index);
			}
		}
		for (let i of is) this.endNodes.splice(i, 1);
		const find = (check: (val: ICanvas.AnyGate) => boolean): void => {
			let i = this.gates.and.findIndex(check);
			if (i !== -1) this.gates.and.splice(i, 1);
			if (i === -1) {
				i = this.gates.or.findIndex(check); 
				if (i !== -1) this.gates.or.splice(i, 1);
			}
			if (i === -1) {
				i = this.gates.not.findIndex(check); 
				if (i !== -1) this.gates.not.splice(i, 1);
			} 
			if (i === -1) {
				i = this.gates.led.findIndex(check);
				if (i !== -1) this.gates.led.splice(i, 1);
			}
			if (i === -1) {
				i = this.gates.switch.findIndex(check);
				if (i !== -1) this.gates.switch.splice(i, 1);
			} 
		}
		find(val => { return val.state.id === id; })
		// find(val => { return val.state.gateIn.findIndex(val => { return val.state.id === id; }) !== -1; });
		// find(val => { return val.state.gateOut.findIndex(val => { return val.state.id === id; }) !== -1; });
		console.log(this.gates);
	}

	public load = (): void => Saving.loadState(this);
	
	public changeMode = (mode: string): void => this.setState({ mode });

	public onChange = (): void => Logic.evalAll(this.gates);
	
	public async componentDidMount() {
		this.setCtx();
		this.setState({
			width: (this.props.width * window.innerWidth / 100).toString(),
			height: (this.props.height * window.innerHeight / 100).toString()
		});

		// Preload gates
		await LogicGates.AndGate.LOAD(this.ctx);
		await LogicGates.OrGate.LOAD(this.ctx);
		await LogicGates.NotGate.LOAD(this.ctx);
		await LogicGates.Switch.LOAD(this.ctx);
		await LogicGates.LED.LOAD(this.ctx);
		
		// Create graph
		this.onChange();

		// Draw grid
		this.updateCanvas();
		console.log(this.gates);
		
	}

	public componentDidUpdate() {
		this.updateCanvas();
	}

	private drawGrid = (): void => {
		if (!!this.ctx) {
			this.ctx.fillStyle = "rgba(0,0,0,1)";
			for (let x = 0; x < this.canvas.width; x++) {
				if (x % this.state.snapFactor == 0) {
					for (let y = 0; y < this.canvas.height; y++) {
						if (y % this.state.snapFactor == 0) {
							this.ctx.fillRect(x, y, 1, 1);
						}
					}
				}
			}
		}
	}

	private setCtx = (): void => {
		const cont = this.canvas.getContext('2d');
		if (cont !== null) {
			this.ctx = cont;
		}
	}

	private updateCanvas = (): void => {
		this.drawGrid();
		Wiring.rerender(this.gates.wire, this.ctx);
		Wiring.rerender(this.gates.and, null);
		Wiring.rerender(this.gates.or, null);
		Wiring.rerender(this.gates.not, null);
		Wiring.rerender(this.gates.switch, null);
		Wiring.rerender(this.gates.led, null);

		Wiring.renderNodes(this.startNodes, this.ctx);
		Wiring.renderNodes(this.endNodes, this.ctx);

		if (this.state.context !== null) Wiring.renderContext(this.ctx, this.state.context);
	}

	private getCoords(e: any): ICanvas.GateCoords {
		const box = e.currentTarget.getBoundingClientRect();
		return { x: e.clientX - box.left, y: e.clientY - box.top };
	}

	

	private async canvasEvent(e: React.MouseEvent<HTMLCanvasElement>): Promise<void> {
		let coords = this.getCoords(e);

		coords = Wiring.gridLayout(coords, this.state.gridFactor);

		if (e.type === "contextmenu") {
			let check = this.isClicked(coords); 
			console.log(check);
			if (check !== null && (this.state.context === null || check.state.id !== this.state.context.gate.state.id )) {
				await this.setState({context: null});
				await this.clear();
				let context = await check.context(coords);
				await this.setState({context});
				return;
			}
			return;
		} else if (e.type === "click" && this.state.context !== null ? !Wiring.contextClicked(coords, this.state.context) : false) {
			await this.setState({context: null});
			this.clear();
			return;
		} else if (this.state.context !== null && Wiring.contextClicked(coords, this.state.context)) {
			switch (e.type) {
				case "mousemove":
					this.clear();
					Wiring.contextHover(coords.y, this.state.context, this.ctx);
					return;
				case "click":
					this.clear();
					Wiring.contextActions(this, this.state.context.gate, Wiring.contextHover(coords.y, this.state.context, this.ctx));
					return;
			}
		}
		

		switch (this.state.mode) {
			case "click":
				this.canvasClick(e, coords);
				break;

			case "draw":
				this.cavasDrag(e, coords);
				break;


			// Gate cases
			case "and":
				if (e.type == "click") {
					this.gates.and.push(new LogicGates.AndGate(this.ctx));
					const size: ICanvas.GateSize = { width: 2 * this.state.gridFactor + 1, height: 2 * this.state.gridFactor + 1 }
					const newNodes = this.gates.and[this.gates.and.length - 1].add(coords, size);

					this.addNodes(newNodes);
					this.onChange();
				}
				break;


			case "or":
				if (e.type == "click") {
					this.gates.or.push(new LogicGates.OrGate(this.ctx));
					const size: ICanvas.GateSize = { width: 2 * this.state.gridFactor + 1, height: 2 * this.state.gridFactor + 1 }
					const newNodes = this.gates.or[this.gates.or.length - 1].add(coords, size);

					this.addNodes(newNodes);
					this.onChange();
				}
				break;

			case "not":
				if (e.type == "click") {
					this.gates.not.push(new LogicGates.NotGate(this.ctx));
					const size: ICanvas.GateSize = { width: 2 * this.state.gridFactor + 1, height: 2 * this.state.gridFactor + 1 }
					const newNodes = this.gates.not[this.gates.not.length - 1].add(coords, size);

					this.addNodes(newNodes);
					this.onChange();
				}
				break;

			case "led":
				if (e.type == "click") {
					this.gates.led.push(new LogicGates.LED(this.ctx));
					const size: ICanvas.GateSize = { width: 2 * this.state.gridFactor + 1, height: 2 * this.state.gridFactor + 1 }
					const newNodes = this.gates.led[this.gates.led.length - 1].add(coords, size);

					this.addNodes(newNodes);
					this.onChange();
				}
				break;

			case "switch":
				if (e.type == "click") {
					this.gates.switch.push(new LogicGates.Switch(this.ctx));
					const size: ICanvas.GateSize = { width: 2 * this.state.gridFactor + 1, height: 2 * this.state.gridFactor + 1 }
					const newNodes = this.gates.switch[this.gates.switch.length - 1].add(coords, size);

					this.addNodes(newNodes);
					this.onChange();
				}
				break;
		}

	}



	private addNodes<T extends LogicGates.Gates<any>>(newNodes: ICanvas.Nodes<T>): void {
		this.endNodes.push(...newNodes.end);
		this.startNodes.push(...newNodes.start);

		Wiring.renderNodes(newNodes.end, this.ctx);
		Wiring.renderNodes(newNodes.start, this.ctx);
	}

	private clear = (): void => {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.updateCanvas();
	}

	private isClicked = (coords: ICanvas.GateCoords): ICanvas.AnyGate | null => {
		return Wiring.isClicked(this.gates.and, coords) 
			|| Wiring.isClicked(this.gates.or, coords)
			|| Wiring.isClicked(this.gates.not, coords)
			|| Wiring.isClicked(this.gates.switch, coords)
			|| Wiring.isClicked(this.gates.led, coords);
	}

	private canvasClick = (e: React.MouseEvent<HTMLCanvasElement>, coords: ICanvas.GateCoords): void => {

		// Find if a gate was clicked
		let gate = this.isClicked(coords);

		switch (e.type) {
			case "click":
				if (gate === null){
					this.clicked = [];
					this.clear();
				} else {
					this.clicked = []
					this.clear();
					this.clicked.push(gate);
				}

				if (gate !== null) { gate.click(); gate.clickSpecific(); }
				this.onChange();
				break;

			case "mousedown":
				if (gate !== null) {
					if (gate == this.clicked[0]) {
						this.setState({
							dragging: true,
							dragInit: coords,
							drag: gate.state.coords
						});
						this.clickedDrag = [];
						this.clickedDrag.push(gate);
						this.clear();
					}
				} else {
					this.setState({canvasDrag: true});
				}
				break;

			case "mousemove":
				if (this.state.dragging) {
					const move: ICanvas.GateCoords = {
						x: coords.x - (this.state.dragInit.x - this.state.drag.x),
						y: coords.y - (this.state.dragInit.y - this.state.drag.y)
					}
					for (let g of this.clickedDrag) {
						g.drag(move);
					}
					this.clear();
				} else if (this.state.canvasDrag) {
					console.log("dragging");
					const move: ICanvas.GateCoords = {
						x: coords.x - (this.state.dragInit.x - this.state.drag.x),
						y: coords.y - (this.state.dragInit.y - this.state.drag.y)
					}
					Wiring.selection(this.ctx, move, {x: this.state.dragInit.x - this.state.drag.x, y: this.state.dragInit.x - this.state.drag.x});
				}
				break;

			case "mouseup":
				if (this.state.dragging) {
					this.clear();
					this.setState({ dragging: false });
				} else if (this.state.canvasDrag) {
					this.setState({canvasDrag: false});
				}

				break;

		}
	}

	private cavasDrag = (e: React.MouseEvent<HTMLCanvasElement>, coords: ICanvas.GateCoords): void => {

		// Drawing wires

		switch (e.type) {
			case "mousedown":
				let node = Wiring.wireSnap(this.startNodes, coords, this.state.snapFactor);
				if (node === null) node = Wiring.wireSnap(this.endNodes, coords, this.state.snapFactor);

				if (node !== null) {
					const snapCoords = node.getCoords();
					this.setState({
						dragInit: snapCoords,
						drag: snapCoords,
						dragging: true
					});
					this.nodeSelectStart = { node, selected: true }
				} else {
					this.nodeSelectStart = { node: null, selected: false };
				}

				break;
			case "mousemove":
				if (this.state.dragging) {
					let node: LogicGates.GateNode<any> | null = null;

					if (this.nodeSelectStart.node !== null && this.nodeSelectStart.node.type() === "start") {
						node = Wiring.wireSnap(this.endNodes, coords, this.state.snapFactor);
					} else {
						node = Wiring.wireSnap(this.startNodes, coords, this.state.snapFactor);
					}
					

					if (node !== null) {
						coords = node.getCoords();
						this.nodeSelectEnd = { node, selected: true };
					} else {
						this.nodeSelectEnd = { node: null, selected: false };
					}
					this.setState({
						drag: coords
					});
					this.clear();
					Wiring.drawWire(this.ctx, this.state.dragInit, this.state.drag);
				}

				break;
			case "mouseup":
			case "mouseleave":
				// save wire
				if (this.nodeSelectEnd.selected && this.nodeSelectEnd.node !== null && this.nodeSelectStart.node !== null 
					&& this.state.dragging) {

					let startNode = this.nodeSelectStart.node;
					let endNode = this.nodeSelectEnd.node;
					if (this.nodeSelectStart.node.type() === "end") {
						startNode = this.nodeSelectEnd.node;
						endNode = this.nodeSelectStart.node;
					} 

					const wire = new LogicGates.Wire({
						startNode, endNode
					});

					this.gates.wire.push(wire);
					endNode.setWire(wire, "end");
					startNode.setWire(wire, "start");
					this.onChange();
				} else {
					this.clear();
				}
				this.setState({ dragging: false });
				break;
		}

	}

	public propertyWindow = (gate: ICanvas.AnyGate): void => {}

	public resize = (n: IComponent.Component): void =>
		this.setState({
			width: (n.width * window.innerWidth / 100).toString(),
			height: (n.height * window.innerHeight / 100).toString()
		});

	public render(): JSX.Element {
		return (
			<div className={styles.main} onContextMenu={(e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); }}>
				<canvas ref={(canvas) => { if (canvas !== null) this.canvas = canvas }} onClick={this.canvasEvent}
					className={styles.canvas} width={this.state.width} height={this.state.height}
					onMouseUp={this.canvasEvent} onMouseDown={this.canvasEvent} onMouseMove={this.canvasEvent}
					onMouseLeave={this.canvasEvent} onContextMenu={this.canvasEvent} />
			</div>
		)
	}
}