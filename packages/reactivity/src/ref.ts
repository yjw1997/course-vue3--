import { isObject, isArray } from '@vue/shared'
import { trackEffects, triggerEffect } from './effect'
import { reactive } from './reactive'
function toReactive(value) {
  return isObject(value) ? reactive(value) : value
}

class RefImpl {
  public _value
  public dep
  public __v_isRef = true
  constructor(public rawValue) {
    this._value = toReactive(rawValue)
  }
  get value() {
    trackEffects(this.dep || (this.dep = new Set()))

    return this._value
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this._value = toReactive(newValue)
      this.rawValue = newValue
      triggerEffect(this.dep)
    }
  }
}

export function ref(value) {
  return new RefImpl(value)
}

class ObjectRefImpl {
  constructor(public object, public key) {}

  get value() {
    return this.object[this.key]
  }
  set value(newValue) {
    this.object[this.key] = newValue
  }
}

function toRef(object, key) {
  return new ObjectRefImpl(object, key)
}

export function toRefs(object) {
  const result = isArray(object) ? new Array(object.length) : {}
  for (let key in object) {
    result[key] = toRef(object, key)
  }
  return result
}
