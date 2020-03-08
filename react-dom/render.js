import {
  Component
} from "../react/index.js"
import diff from './diff.js'

// 设置元素属性
export const setAttribute = (dom, name, value) => {
  if (name === 'className') name = 'class'

  if (/on\w+/.test(name)) {
    name = name.toLowerCase()
    dom[name] = value || ''
  } else if (name === 'style') {
    if (!value || typeof value === 'string') {
      dom.style.cssText = value || ''
    } else if (typeof value === 'object') {
      for (let name in value) {
        dom.style[name] = typeof value === 'number' ? value + 'px' : value
      }
    }
  } else {
    if (name in dom) dom[name] = value || ''
    if (value) {
      dom.setAttribute(name, value || '')
    } else {
      dom.removeAttribute(name)
    }
  }
}

// 创建 组件
export const createComponent = (component, props) => {
  let init
  if (component.prototype && component.prototype.render) { // 类组件
    init = new component(props)
  } else {

    // 函数组件构建为类组件
    init = new Component(props)
    init.constructor = component
    init.render = function () {
      return this.constructor(props)
    }
  }

  return init
}

// 设置组件 props
export const setComponentProps = (component, props) => {
  if (!component.base) {
    component.componentWillMount && component.componentWillMount()
  } else if (component.componentWillReceiveProps) {
    component.componentWillReceiveProps()
  }

  component.props = props

  renderComponent(component)
}

export const renderComponent = component => {
  let base
  const renderer = component.render() // 这里执行返回内部的虚拟或者真实 DOM
  if (component.base && component.componentWillUpdate) {
    console.log('组件需要更新')
    component.componentWillUpdate()
  }
  base = diff(component.base, renderer)
  if (!component.base && component.componentDidMount) component.componentDidMount()
  if (component.base && component.componentDidUpdate) component.componentDidUpdate()

  component.base = base
  base._component = component
}

const _render = vnode => {
  if (typeof vnode.tag === 'function') {
    const component = createComponent(vnode.tag, vnode.attrs)
    setComponentProps(component, vnode.attrs)
    return component.base
  }
  if (!vnode || typeof vnode === 'boolean') vnode = ''
  if (typeof vnode === 'number') vnode = String(vnode)
  if (typeof vnode === 'string') {
    let textNode = document.createTextNode(vnode)
    return textNode
  }

  const dom = document.createElement(vnode.tag)

  if (vnode.attrs) {
    let attrs = vnode.attrs
    Object.keys(attrs).forEach(item => {
      setAttribute(dom, item, attrs[item])
    })
  }

  if (vnode.children) {
    vnode.children.forEach(item => {
      dom.appendChild(_render(item))
    })
  }
  return dom
}

function render(vnode, container, dom) {
  return diff(dom, vnode, container)
}


export default render