import render, {
  renderComponent
} from '../react-dom/render.js'

const setStateQueue = [],
  renderQueue = []

const defer = f => Promise.resolve().then(f)


const flash = () => {
  let item, component
  while (item = setStateQueue.shift()) {
    const {
      newState,
      component
    } = item
    if (!component.prevState) {
      component.prevState = Object.assign({}, component.state) // 浅拷贝
    }

    if (typeof newState === 'function') {
      Object.assign(component.state, newState(component.prevState, component.props))
    } else {
      Object.assign(component.state, newState)
    }

    component.prevState = component.state
  }


  while (component = renderQueue.shift()) {
    renderComponent(component)
  }
}


const enqueueState = (newState, component) => {
  if (setStateQueue.length === 0) {
    defer(flash)
  }

  setStateQueue.push({
    newState,
    component
  })

  if (!renderQueue.some(item => item === component)) {
    renderQueue.push(component)
  }
}

export default enqueueState