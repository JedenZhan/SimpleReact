import render from '../react-dom/render.js'
import setStateQueue from './setStateQueue.js'

export class Component {
    constructor(props = {}) {
        this.isReactComponent = true;

        this.state = {};
        this.props = props;
    }

    setState(newState) {
        setStateQueue(newState, this)
    }
}

function createElement(tag, attrs, ...children) {
    attrs = attrs || {};
    return {
        tag,
        attrs,
        children,
        key: attrs.key || null
    }
}


export default {
    Component,
    createElement
}