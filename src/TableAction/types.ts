import type { PopconfirmProps } from 'ant-design-vue'
import type { VNode } from 'vue'

export interface TableActionItem {
  label?: string
  type?: 'default' | 'danger' | 'disabled'
  icon?: VNode
  href?: string
  // disabled?: boolean;
  popConfirm?: PopconfirmProps
  onClick?: (rowRecord: any, event?: MouseEvent) => any
}

export interface TableActionProps<RecordType = any> {
  actions: ActionItem[]
  rowRecord: RecordType
}
