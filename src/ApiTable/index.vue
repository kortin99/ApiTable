<template>
  <div :class="['api-table-wrapper', { 'full-height': props.responsive }]">
    <main ref="tableContainer">
      <a-table
        v-bind="$attrs"
        :columns="props.columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="frontendPagination && paginationController"
        :scroll="{ ...tableScroll, ...props.scroll }"
        v-on="$attrs"
        @resize-column="handleResizeColumn"
      >
        <template v-for="(_, name) in $slots" #[name]="scopeData">
          <slot :name="name" v-bind="scopeData || {}"></slot>
        </template>
      </a-table>
    </main>
    <footer v-show="shoulShowFooterBar" class="footer">
      <div>
        <slot name="customFooter"></slot>
      </div>
      <a-pagination
        v-show="!frontendPagination && pagination"
        v-bind="pagination"
        :current="paginationController.current"
        :page-size="paginationController.pageSize"
        :total="paginationController.total"
        :responsive="true"
        :show-total="(total: number) => `共${total}条`"
        :show-size-changer="true"
        @change="onPaginationChange"
      />
    </footer>
  </div>
</template>

<script setup lang="ts">
import type {
  TableColumnType,
  TablePaginationConfig,
  TableProps,
} from 'ant-design-vue';
import { setReactive, isFunction, debounce } from '../utils';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRaw,
  unref,
  useSlots,
} from 'vue';

export interface TableScrollProp {
  scrollToFirstRowOnChange: Boolean;
  x: string | number | true;
  y: string | number;
}

export type ApiFunction = (...args: any[]) => Promise<any>;
export type ApiPropType =
  | ApiFunction
  | {
      request: ApiFunction;
      params: object;
    };

export interface FiledNames {
  total: string;
  data: string;
  pageIndex: string;
  pageSize: string;
}

export interface Props extends Omit<TableProps, 'pagination'> {
  api: ApiPropType;
  columns: TableColumnType[];
  pagination?:
    | (TablePaginationConfig & { mode: 'frontend' | 'backend' })
    | false;
  frontendPagination?: boolean;
  fieldNames?: Partial<FiledNames>;
  scroll?: TableProps['scroll'];
  responsive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  fieldNames: () => ({
    total: 'totalElement',
    data: 'items',
    pageIndex: 'page',
    pageSize: 'size',
  }),
  scroll: () => ({}),
  pagination: () => ({
    mode: 'backend',
  }),
  frontendPagination: false, // 是否前端分页
});

const emit = defineEmits(['resize-column']);

const $slots = useSlots();

const dataSource = ref<any[]>([]);

/**
 * 表格滚动条动态高度
 */
const tableContainer = ref<HTMLDivElement>();
const tableScroll = reactive<TableScrollProp>({
  scrollToFirstRowOnChange: true,
  x: '100%', // 可以设置为像素值，百分比，true 和 'max-content'
  y: '100px', // 可以设置为像素值
});

function resetTableScroll() {
  nextTick(() => {
    if (tableContainer.value) {
      const height = tableContainer.value.clientHeight;
      const width = tableContainer.value.clientWidth;
      // 如果用户没有设置scrollX，则使用容器最大宽度
      if (!props.scroll.x) {
        tableScroll.x = width - 16;
      }
      const hasFooterSlot = $slots.footer;
      if (hasFooterSlot) {
        // TODO: footer不一定是54像素
        tableScroll.y = height - 55 - 54;
      } else {
        tableScroll.y = height - 55;
      }
    }
  });
}

const resetTableScrollLazy = debounce(resetTableScroll, 500);

const loading = ref(false);
/**
 * 加载表格数据
 * @param customParams 覆盖参数
 */
async function loadData(customParams: any = {}) {
  if (!props.api) {
    console.error('[ApiTable] 没有可用的API调用');
    return;
  }

  loading.value = true;

  const paginationParams = getPaginationParam();

  let data: any;
  if (isFunction(props.api)) {
    // api直接是一个函数
    const res = await props.api({
      ...paginationParams,
      ...customParams,
    });
    data = res.data;
  } else if (isFunction(props.api?.request)) {
    // api拥有初始参数
    const propParams = toRaw(props.api.params);
    const res = await props.api.request({
      ...paginationParams,
      ...propParams,
      ...customParams,
    });
    data = res.data;
  } else {
    console.error('[ApiTable] 没有可用的API方法调用');
    return;
  }

  // 取值
  dataSource.value = data[getFieldName('dataSource')];
  paginationController.total =
    props.pagination === false
      ? unref(dataSource).length
      : data[getFieldName('total')];
  loading.value = false;
}

// 获取字段映射
type FieldKey = 'total' | 'dataSource' | 'pageIndex' | 'pageSize';
function getFieldName(key: FieldKey): string;
function getFieldName(): Record<FieldKey, string>;
function getFieldName(key?: FieldKey) {
  const map: Record<FieldKey, string> = {
    total: props.fieldNames.total || 'totalElement',
    dataSource: props.fieldNames.data || 'items',
    pageIndex: props.fieldNames.pageIndex || 'page',
    pageSize: props.fieldNames.pageSize || 'size',
  };
  if (key) return map[key];
  return map;
}

/**
 * 分页器
 */
const paginationController = reactive({
  current: 1,
  pageSize: 20,
  total: 0,
  pageSizeOptions: ['10', '20', '50', '100'],
});

function initPagination() {
  if (props.pagination) {
    setReactive(paginationController, toRaw(props.pagination));
  }
}

// 获取请求时分页参数
function getPaginationParam(): object {
  // 如果不展示分页 或者 由前端控制分页，不需要给后端分页的参数
  console.log('props.pagination: ', props.pagination);
  if (
    props.pagination === false ||
    props.frontendPagination ||
    props.pagination.mode === 'frontend'
  ) {
    return {};
  }

  const page = paginationController.current;
  const size = paginationController.pageSize;

  return {
    [getFieldName('pageIndex')]: page,
    [getFieldName('pageSize')]: size,
  };
}

function onPaginationChange(page: number, size: number) {
  paginationController.current = page;
  paginationController.pageSize = size;
  loadData({ page, size });
}

function resetPagination() {
  if (props.pagination) {
    paginationController.current = 1;
    paginationController.pageSize = props.pagination.pageSize || 20;
  }
}

/**
 * 是否展示底栏
 */
const shoulShowFooterBar = computed(() => {
  if (props.frontendPagination && !$slots.footer) {
    return false;
  }
  return props.pagination !== false || !!$slots.footer;
});

/**
 * 表格调整列宽
 */
function handleResizeColumn(width: number, column: TableColumnType) {
  column.width = width;
  emit('resize-column', width, column);
}

onMounted(() => {
  initPagination();
  resetTableScroll();
  window.addEventListener('resize', resetTableScrollLazy);
  loadData();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resetTableScrollLazy);
});

/**
 * 暴露内部方法
 */
defineExpose({
  refresh: (params?: object) => loadData(params),
  search: (params?: object) => {
    paginationController.current = 1;
    loadData(params);
  },
});
</script>

<style scoped>
.api-table-wrapper {
  background-color: #fff;
  display: flex;
  flex-direction: column;
}

.api-table-wrapper.full-height {
  flex: 1;
  min-height: 0; // 解决flex布局从大到小resize问题
}

.api-table-wrapper > main {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.api-table-wrapper > footer {
  background-color: #fafafa;
  height: 50px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.api-table-wrapper :deep(.ant-table-filter-column) {
  // justify-content: unset;
}

.api-table-wrapper :deep(.ant-table-column-title) {
  flex: unset;
}
</style>
