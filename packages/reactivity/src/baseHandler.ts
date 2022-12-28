import { activeEffect, track, trigger } from './effect'
import { isObject } from '@vue/shared'
import { reactive } from './reactive'
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
}

export const mutableHandlers = {
  get(target, key, receiver) {
    //  第一次代理是普通对象,我们会通过new Proxy代理一次
    //  下一次你传递的是proxy 我们可以看下他有没有被代理过,如果访问这个proxy有get方法说明就访问过了
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    //  依赖收集
    track(target, 'get', key)

    let res = Reflect.get(target, key, receiver)
    if (isObject(res)) {
      return reactive(res) //  深度代理
    }
    return res
  },
  set(target, key, value, reveiver) {
    //  去代理上设置值 执行set
    let oldValue = target[key]
    let result = Reflect.set(target, key, value, reveiver)
    if (oldValue !== value) {
      //  更新
      trigger(target, 'set', key, value, oldValue)
    }
    return result
  },
}
