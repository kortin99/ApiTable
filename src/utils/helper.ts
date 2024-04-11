import { toRaw } from "vue";

/**
 * 给Reactive对象赋值
 * @param target {any} reactive对象
 * @param value {object} 用于覆盖target的值，是一个对象
 */
export function setReactive(target: any, value: object) {
  Object.entries(toRaw(value)).forEach(([key, value]) => {
    (target as any)[key] = value;
  });
}

/**
 * 实现一个简单的 debounce 函数
 */
export function debounce(func: Function, wait: number) {
  let timeout: number;
  return function (this: any, ...args: any[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}
