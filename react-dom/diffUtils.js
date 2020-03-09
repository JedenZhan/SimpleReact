// 三个方法, 删除节点, 取消挂载组件, 判断节点类型是否相同

export const removeNode = node => {
  if (node && node.parentNode) {
    node.parentNode.removeChild(node)
  }
}

export const unMountComponent = component => {
  if (component.componentWillUnmount) component.componentWillUnmount() // 执行删除组件生命周期函数
  removeNode(component.base)
}

export const isSameNodeType = (dom, vnode) => { // 是不是一样的节点
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return dom.nodeType === 3
  }

  if (typeof vnode.tag === 'string') {
    return dom.nodeName.toLowerCase() === vnode.tag.toLowerCase()
  }

  return dom && dom._component && dom._component.constructor === vnode.tag
}