import { ReactiveEffect } from './effect'
import { isReactive } from './reactive'
import { isFunction, isObject } from '@vue/shared'

function traversal(value, set = new Set()) {
  //  考虑对象中循环引用问题
  //  不是对象就不再递归了
  if (!isObject(value)) return value
  if (set.has(value)) return value
  set.add(value)
  for (let key in value) {
    traversal(value[key], set)
  }
  return value
}

export function watch(source, cb) {
  let getter
  if (isReactive(source)) {
    //  对用户传入的数据进行递归循环(只要循环就会访问对象上属性,访问属性就会收集effect)
    getter = () => traversal(source)
  } else if (isFunction(source)) {
    getter = source
  }
  let cleanup
  const onCleanup = (fn) => {
    cleanup = fn
  }

  let oldValue
  //  调度函数
  const job = () => {
    cleanup && cleanup() //  下一个watch触发上一次清理  闭包原理
    const newValue = effect.run()
    cb(newValue, oldValue, onCleanup)
    oldValue = newValue
  }
  const effect = new ReactiveEffect(getter, job) //  监控自己构造的函数,变化重新执行job
  oldValue = effect.run()
  return effect
}
