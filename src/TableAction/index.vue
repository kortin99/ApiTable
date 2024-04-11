<template>
  <div>
    <template v-for="(action, index) in actions" :key="`${action.label}` + index">
      <a-popconfirm v-if="!!action.popConfirm" v-bind="action.popConfirm || {}" @confirm="onConfirm(action)">
        <a-button
          type="link"
          :href="action.href || undefined"
          :danger="action.type === 'danger'"
          :disabled="action.type === 'disabled'"
          :class="['action-btn', action.type]"
          @click="(e: MouseEvent) => onBtnClick(action, e)"
        >
          {{ action.label }}
        </a-button>
      </a-popconfirm>
      <a-button
        v-else
        type="link"
        :href="action.href || undefined"
        :disabled="action.type === 'disabled'"
        :class="['action-btn', action.type]"
        @click="(e: MouseEvent) => onBtnClick(action, e)"
      >
        {{ action.label }}
      </a-button>
      <a-divider v-if="index < actions.length - 1" type="vertical" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { toRaw } from 'vue'
import { isFunction } from '../utils'

import type { TableActionItem } from './types'

const props = defineProps<{
  rowRecord: any
  actions: TableActionItem[]
}>()

const emit = defineEmits(['trigger'])

function onBtnClick(action: TableActionItem, event: MouseEvent) {
  // 禁用状态，不允许href跳转，也不执行onClick方法
  if (action.type === 'disabled') {
    event.preventDefault()
    return
  }
  // 如果有popConfirm，不直接执行方法
  if (action.popConfirm) return
  emit('trigger', action, toRaw(props.rowRecord), event)
  callFn(action, event)
}

function onConfirm(action: TableActionItem) {
  emit('trigger', action)
  callFn(action)
}

function callFn(action: TableActionItem, event?: MouseEvent) {
  if (action.onClick && isFunction(action.onClick)) {
    action.onClick(props.rowRecord, event)
  }
}
</script>

<style scoped>
a {
  user-select: none;
}

a[disabled] {
  cursor: pointer;
}

a[disabled='true'] {
  color: rgba(0, 0, 0, 0.25);
  cursor: not-allowed;
}

.action-btn {
  padding: 0;
  // color: var(--primary-color);

  // &.default {
  //   color: #0091fb;
  // }

  // &.danger {
  //   color: #ff4c54;
  // }

  // &.disabled {
  //   color: rgba(0, 0, 0, 0.25);
  // }
}
</style>
