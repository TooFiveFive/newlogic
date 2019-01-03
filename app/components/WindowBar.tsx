import * as React from 'react';
import { WinBarState, WinBarProps } from '../interfaces/components';

let styles = require("./styles/WindowBar.scss");

export default class WindowBar extends React.Component<WinBarProps, WinBarState> {

    constructor(props: WinBarProps) {
        super(props);
        this.state = {title: this.props.title, x: 0, y: 24, initX: 0, initY: 24, moving: false, 
            posX: 0, posY: 0, width: 200, height: 200, max: false, winWidth: 200, winHeight: 200, focused: true};
    }

    private windowDrag = (e: React.MouseEvent<HTMLHeadingElement>): void => {
        switch(e.type) {
            case "mousedown": {
                this.setState({moving: true, initX: e.clientX, initY: e.clientY});
                break;
            }
            case "mousemove": {
                if (this.state.moving && !this.state.max) {
                    let mX = e.clientX - this.state.initX + this.state.posX,
                        mY = e.clientY - this.state.initY + this.state.posY;

                    mY += this.state.posY == 0 ? 24 : 0;

                    this.setState({x: mX, y: mY});
                }
                break;
            }
            case "mouseup": {
                this.setState({moving: false, posX: this.state.x, posY: this.state.y});
                break;
            }
            case "mouseleave": {
                this.setState({moving: false, posX: this.state.x, posY: this.state.y});
                break;
            }

        }
        
    }

    private windowClick = (e: React.MouseEvent<HTMLDivElement>): void => {

        if (e.currentTarget.scrollWidth !== this.state.width) {
            this.setState({width: e.currentTarget.scrollWidth});
        }

        if (e.currentTarget.scrollHeight !== this.state.height) {
            this.setState({height: e.currentTarget.scrollHeight});
        }


    }

    private toggleMax = (e: React.MouseEvent<HTMLSpanElement>): void => {

        if (!this.state.max) {
            this.setState({x: 0, y: 24, initX: this.state.x, initY: this.state.y, 
                max: true, width: window.innerWidth, height: window.innerHeight, winWidth: this.state.width, winHeight: this.state.height});
        } else {
            this.setState({x: this.state.initX, y: this.state.initY, max: false, width: this.state.winWidth, height: this.state.winHeight});
        }

    }

    public render() {
        return (
            <div onClick={this.windowClick} style={{top: this.state.y, left: this.state.x, width: this.state.width, height: this.state.height}} className={styles.main}>
                <header>
                    <h1 onMouseDown={this.windowDrag} onMouseMove={this.windowDrag} onMouseUp={this.windowDrag} onMouseLeave={this.windowDrag}>{this.state.title}</h1>
                    <nav className={styles.nav}>
                        <span onClick={this.toggleMax}>&#9633;</span>
                        <span onClick={this.toggleMax}>x</span>
                    </nav>
                </header>
                <div className={styles.body}>
                    {this.props.children}
                </div>
            </div>
        );
    }

}