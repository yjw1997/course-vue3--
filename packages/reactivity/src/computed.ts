import { isFunction } from '@vue/shared'
import { ReactiveEffect, trackEffects, triggerEffect } from './effect'

class ComutedRefImpl {
  public effect
  public _dirty = true // 应该取值的时候进行计算
  public __v_isReadonly = true
  public __v_isRef = true
  public _value
  public dep
  constructor(getter, public setter) {
    //  将用户的getter放在effect放在effect中,自动收集里面响应式数据
    this.effect = new ReactiveEffect(getter, () => {
      // 稍后这个依赖的属性变化会执行此调度函数
      if (!this._dirty) {
        this._dirty = true
        //  实现触发更新
        triggerEffect(this.dep)
      }
    })
  }

  get value() {
    // 做依赖收集 收集外层effect
    trackEffects(this.dep || (this.dep = new Set()))
    if (this._dirty) {
      //  说明值是脏的
      this._dirty = false
      this._value = this.effect.run()
    }
    return this._value
  }
  set value(newValue) {
    if (newValue !== this._value) {
      this.setter(newValue)
    }
  }
}

export const computed = (gettersOrOptions) => {
  //  传入值为函数代表只有一个getter
  let onlyGetter = isFunction(gettersOrOptions)
  let getter
  let setter
  if (onlyGetter) {
    getter = gettersOrOptions
    setter = () => {
      console.warn('no set')
    }
  } else {
    getter = gettersOrOptions.get
    setter = gettersOrOptions.set
  }
  return new ComutedRefImpl(getter, setter)
}
