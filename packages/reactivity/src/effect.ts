export let activeEffect = undefined

//  解除effect重新收集依赖
function cleanUpEffect(effect) {
  const { deps } = effect
  for (let i = 0; i <= deps.length - 1; i++) {
    deps[i].delete(effect)
  }
  effect.deps.length = 0
}

export class ReactiveEffect {
  //这里表示在实例上新增active属性  如果是响应式数据就激活
  public active = true //  默认激活状态
  public parent = null // 嵌套effect parent解决方案
  public deps = [] //  effect记录他依赖的数据,双向记录

  //用户传递参数也会在this上 this.fn = fn
  constructor(public fn, public scheduler) {}
  run() {
    //  run就是执行effect
    if (!this.active) {
      return this.fn()
    } //  如果非激活状态只需要执行函数不需要依赖收集

    //  这里依赖收集 核心就是将当前的effect和稍后的渲染的属性关联在一起
    try {
      this.parent = activeEffect
      activeEffect = this

      //  清空之前收集的依赖防止分支切换不必要渲染
      cleanUpEffect(this)
      return this.fn() //  当稍后调用取值操作的时候  就可以获取到全局的activeEffect
    } finally {
      activeEffect = this.parent
    }
  }
  // 处理掉当前作用域内的所有 effect
  stop() {
    this.active = false
    cleanUpEffect(this)
  }
}

//  用户传入回调函数 当函数运行是可以进行依赖收集
export function effect(fn, options: any = {}) {
  //  这里fn可以根据状态变化重新执行,effect可以嵌套执行
  const _effect = new ReactiveEffect(fn, options.scheduler) // 创建响应式effect
  _effect.run() //默认先执行一次

  const runner = _effect.run.bind(_effect)
  runner.effect = _effect
  return runner
}

//  一个effect对应多个属性  一个属性对应多个effect
// 结论多对多关系
const targetMap = new WeakMap()
//  依赖收集
export function track(target, type, key) {
  if (!activeEffect) return //  不是在effect中不收集
  let depsMap = targetMap.get(target) //  第一次没有
  if (!depsMap) targetMap.set(target, (depsMap = new Map()))
  let dep = depsMap.get(key)
  if (!dep) depsMap.set(key, (dep = new Set()))
  trackEffects(dep)
  //单向指的是  属性记录过effect,方向记录,应该让effect也记录他被哪些属性收集过,这么做是为了可以清理
  // 对象 某个属性 => 多个effect
  // weakMap{对象: {Map{name: Set}}}
  //  {对象:{name:[]}}
}

export function trackEffects(dep) {
  if (!activeEffect) return
  let shouldTrack = !dep.has(activeEffect)
  if (shouldTrack) {
    dep.add(activeEffect)
    activeEffect.deps.push(dep) //让effect记录对应的dep,稍后清理的时候会用到
  }
}

//  值变化时促发更新
export function trigger(target, type, key, value, oldValue) {
  const depsMap = targetMap.get(target)
  if (!depsMap) return //  触发的值不在模板中使用
  let effects = depsMap.get(key)
  triggerEffect(effects)
}

export function triggerEffect(effects) {
  if (effects) {
    effects = [...effects]
    effects.forEach((effect) => {
      // 在effect修改响应式数据会递归死循环
      //effect !== activeEffect  防止递归死循环

      if (effect !== activeEffect) {
        effect.scheduler && effect.scheduler() //  如果用户传入调度函数,则执行自己的调度函数
        effect.run()
      }
    })
  }
}

/**
 * 1. 先生成一个响应式数据new proxy
 * 2. effect数据变化要能更新,我们先将正在执行的effect作为全局变量(activeEffect) ,在渲染时(取值),在get中进行依赖收集(targetMap)
 * 3.  weakmap(对象:map(属性:set(effect)))
 * 4. 稍后用户在数据发生变化,会通过属性来找到对应的effect(targetMap)集合,找到effect全部执行
 */
