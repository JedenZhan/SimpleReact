import {
  Component
} from '../react/index.js'
import {
  setAttribute,
  setComponentProps,
  createComponent
} from './render.js'

const removeNode = node => {
  if (node && node.parentNode) {
    node.parentNode.removeChild(node)
  }
}

const unMountComponent = component => {
  if (component.componentWillUnmount) component.componentWillUnmount() // 执行删除组件生命周期函数
  removeNode(component.base)
}

const isSameNodeType = (dom, vnode) => { // 是不是一样的节点
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return dom.nodeType === 3
  }

  if (typeof vnode.tag === 'string') {
    return dom.nodeName.toLowerCase() === vnode.tag.toLowerCase()
  }

  return dom && dom._component && dom._component.constructor === vnode.tag
}


const diffComponent = (dom, vnode) => {
  let c = dom && dom._component || {}
  let oldDom = dom
  if (c.constructor === vnode.tag) { // 说明组件类型未变化
    setComponentProps(c, vnode.attrs)
    dom = c.base
  } else { // 如果组件类型不同, 删除原来的组件, 替换新的组件
    if (c) {
      unMountComponent(c)
      oldDom = null
    }

    c = createComponent(vnode.tag, vnode.attrs) // 创建新的组件
    setComponentProps(c, vnode.attrs)
    dom = c.base

    if (oldDom && dom !== oldDom) {
      oldDom._component = null
      removeNode(oldDom)
    }
  }
  return dom
}

const diffChildren = (dom, vchildren) => {
  // 对比子节点的时候, key 就有用啦
  const domChildren = dom.childNodes,
    children = [],
    keyed = {},
    len = domChildren.length

  if (len > 0) {
    for (let i = 0; i < len; i++) {
      let item = domChildren[i]
      let key = item.key
      if (key) {
        keyed[key] = item // 保存有key的item
      } else {
        children.push(item)
      }
    }
  }
  if (vchildren && vchildren.length > 0) {
    let min = 0,
      childrenLen = children.length
    for (let i = 0, len = vchildren.length; i < len; i++) {
      const vitem = vchildren[i]
      const key = vitem.key
      let child
      if (key) {
        if (keyed[key]) {
          child = keyed[key]
          delete keyed[key]
        }
      } else if (min < childrenLen) {
        // 如果没有 key, 优先寻找类型相同的元素
        for (let j = min; j < childrenLen; j++) {
          let c = children[j]
          if (c && isSameNodeType(c, vitem)) {
            child = c
            children[j] = undefined
            if (j === childrenLen - 1) childrenLen--
            if (j === min) min++
            break
          }
        }
      }

      child = diffNode(child, vitem)

      const f = domChildren[i]
      if (child && child !== dom && child !== f) {
        if (!f) {
          dom.appendChild(child)
        } else if (child === f.nextSibling) {
          removeNode(f)
        } else {
          dom.insertBefore(child, f)
        }
      }
    }
  }
}

const diffAttributes = (dom, vnode) => {
  const old = {} // 当前DOM的属性
  const attrs = vnode.attrs // 虚拟DOM的属性

  for (let i = 0; i < dom.attributes.length; i++) {
    const attr = dom.attributes[i]
    old[attr.name] = attr.value
  }

  // 如果原来的属性不在新的属性当中，则将其移除掉（属性值设为undefined）
  for (let name in old) {
    if (name === 'class') name = 'className'
    if (/on\w+/.test(name)) name = name.toLowerCase()
    if (!(name in attrs)) {
      setAttribute(dom, name, undefined)
    }

  }

  // 更新新的属性值
  for (let name in attrs) {
    if (old[name] !== attrs[name]) {
      setAttribute(dom, name, attrs[name])
    }
  }
}

const diffNode = (dom, vnode) => {
  let out = dom // 基于原始dom进行修改
  if (!vnode || typeof vnode === 'boolean') vnode = ''
  if (typeof vnode === 'number') vnode = String(vnode)
  if (typeof vnode === 'string') {
    if (dom && dom.nodeType === 3) { // 如果原生节点是文本节点, 比较完直接替换
      (dom.textContent !== vnode) && (dom.textContent = vnode)
    } else {
      out = document.createTextNode(vnode)
      if (dom && dom.parentNode) {
        dom.parentNode.replaceChild(out, dom)
      }
    }
    return out
  }

  if (typeof vnode.tag === 'function') { // diff 组件
    return diffComponent(dom, vnode)
  }

  if (!dom || !isSameNodeType(dom, vnode)) { // 没有初始 dom, 当做第一次挂载
    out = document.createElement(vnode.tag)
    if (dom) {
      [...dom.childNodes].forEach(out.appendChild) // 这个操作有点骚....将dom节点的子元素转移到新节点里面
      if (dom.parentNode) dom.parentNode.replaceChild(out, dom)
    }
  }

  if (vnode.children && vnode.children.length > 0 || out.childNodes && out.childNodes.length > 0) {
    diffChildren(out, vnode.children)
  }

  diffAttributes(out, vnode)

  return out
}


//拿到真实DOM与虚拟DOM对比
function diff(dom, vnode, container) {
  const ret = diffNode(dom, vnode)
  if (container && ret.parentNode !== container) {
    container.appendChild(ret)
  }
  return ret
}

export default diff