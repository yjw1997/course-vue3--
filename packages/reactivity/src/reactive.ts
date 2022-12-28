import { isObject } from '@vue/shared'
import { mutableHandlers, ReactiveFlags } from './baseHandler'

//  设置映射防止重复代理
const reactiveMap = new WeakMap()

//  防止嵌套代理
//  const enum ReactiveFlags {
//   IS_REACTIVE = '__v_isReactive',
// }

//  如果是一个proxy,那一定被代理过就会走get
export function isReactive(value) {
  return value && value[ReactiveFlags.IS_REACTIVE]
}

export function reactive(target) {
  let exisitingProxy = reactiveMap.get(target)
  if (exisitingProxy) {
    return exisitingProxy
  }

  if (isReactive(target)) {
    return target
  }

  //  将数据转换成响应式数据,只能做对象的代理
  if (!isObject(target)) return
  const proxy = new Proxy(target, mutableHandlers)
  reactiveMap.set(target, proxy)
  return proxy
}
