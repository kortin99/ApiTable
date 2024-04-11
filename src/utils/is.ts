import { MaybeRef, unref } from "vue";

export function isFunction(value: MaybeRef<unknown>): value is Function {
  return typeof unref(value) === 'function';
}