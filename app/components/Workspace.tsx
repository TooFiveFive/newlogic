import * as React from 'react';
import { WorkspaceProps, WorkspaceState } from '../interfaces/components';

// import { Stage, Layer } from 'react-konva';

// let styles = require('./styles/Workspace.scss');

//import items (gates etc)
// import AndGate from './items/AND';

export default class Workspace extends React.Component<WorkspaceProps, WorkspaceState> {
	public render() {
		return (<div><p>i</p></div>)
		// return (
		// 	<Stage width={this.props.width} height={this.props.height} className={styles.main}>
		// 		<Layer>
		// 			<AndGate />
		// 		</Layer>
		// 	</Stage>
		// )
	}
}