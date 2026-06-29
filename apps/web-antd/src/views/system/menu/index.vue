<script lang="ts" setup>
import type { MenuBrief } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createMenuApi,
  deleteMenuApi,
  getAllMenusForAssignApi,
  updateMenuApi,
} from '#/api/core/role';

defineOptions({ name: 'MenuList' });

const loading = ref(false);
const treeData = ref<MenuBrief[]>([]);

const modalVisible = ref(false);
const modalTitle = ref('新增菜单');
const modalLoading = ref(false);
const editingId = ref<number | null>(null);

const formData = reactive({
  parent_id: 0,
  menu_name: '',
  menu_type: 1,
  path: '',
  perms: '',
  icon: '',
  sort: 0,
  visible: 1,
  status: 1,
});

const columns = [
  { title: '菜单名称', dataIndex: 'menu_name', key: 'menu_name' },
  {
    title: '类型',
    dataIndex: 'menu_type',
    key: 'menu_type',
    width: 80,
  },
  { title: '路径', dataIndex: 'path', key: 'path' },
  { title: '权限标识', dataIndex: 'perms', key: 'perms' },
  { title: '图标', dataIndex: 'icon', key: 'icon', width: 80 },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 60 },
  {
    title: '状态',
    key: 'status',
    width: 80,
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    fixed: 'right',
  },
];

const menuTypeOptions = [
  { label: '目录', value: 1 },
  { label: '菜单', value: 2 },
  { label: '按钮', value: 3 },
];

async function fetchTree() {
  loading.value = true;
  try {
    const res = await getAllMenusForAssignApi();
    treeData.value = res ?? [];
  } finally {
    loading.value = false;
  }
}

function flattenTree(nodes: MenuBrief[]): MenuBrief[] {
  const result: MenuBrief[] = [];
  function walk(list: MenuBrief[]) {
    for (const node of list) {
      result.push(node);
      if (node.children && node.children.length > 0) {
        walk(node.children);
      }
    }
  }
  walk(nodes);
  return result;
}

function getParentOptions(): { label: string; value: number }[] {
  const options: { label: string; value: number }[] = [{ label: '根节点', value: 0 }];
  const flat = flattenTree(treeData.value);
  for (const node of flat) {
    if (node.menu_type !== 3) {
      options.push({
        label: `${'　'.repeat(getDepth(node))}${node.menu_name}`,
        value: node.id,
      });
    }
  }
  return options;
}

function getDepth(node: MenuBrief, depth = 0): number {
  // Simple approach: use tree structure to determine depth
  function findDepth(nodes: MenuBrief[], targetId: number, d: number): number {
    for (const n of nodes) {
      if (n.id === targetId) return d;
      if (n.children) {
        const found = findDepth(n.children, targetId, d + 1);
        if (found >= 0) return found;
      }
    }
    return -1;
  }
  return findDepth(treeData.value, node.id, 0);
}

function openCreateModal(parentId = 0) {
  editingId.value = null;
  modalTitle.value = '新增菜单';
  Object.assign(formData, {
    parent_id: parentId,
    menu_name: '',
    menu_type: 1,
    path: '',
    perms: '',
    icon: '',
    sort: 0,
    visible: 1,
    status: 1,
  });
  modalVisible.value = true;
}

function openEditModal(record: MenuBrief) {
  editingId.value = record.id;
  modalTitle.value = '编辑菜单';
  Object.assign(formData, {
    parent_id: record.parent_id,
    menu_name: record.menu_name,
    menu_type: record.menu_type,
    path: record.path ?? '',
    perms: record.perms ?? '',
    icon: record.icon ?? '',
    sort: record.sort,
    visible: record.visible,
    status: record.status,
  });
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formData.menu_name) {
    message.error('菜单名称不能为空');
    return;
  }
  if (formData.menu_type !== 3 && !formData.path) {
    message.error('目录/菜单类型必须填写路径');
    return;
  }
  modalLoading.value = true;
  try {
    if (editingId.value) {
      await updateMenuApi(editingId.value, { ...formData });
      message.success('更新成功');
    } else {
      await createMenuApi({ ...formData });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchTree();
  } finally {
    modalLoading.value = false;
  }
}

async function handleDelete(id: number) {
  await deleteMenuApi(id);
  message.success('删除成功');
  fetchTree();
}

onMounted(fetchTree);
</script>

<template>
  <Page title="菜单管理">
    <div class="mb-4">
      <Space>
        <Button type="primary" @click="openCreateModal(0)">新增根菜单</Button>
      </Space>
    </div>

    <Table
      :columns="columns"
      :data-source="treeData"
      :loading="loading"
      :pagination="false"
      :default-expand-all-rows="true"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'menu_type'">
          <Tag
            :color="
              record.menu_type === 1
                ? 'blue'
                : record.menu_type === 2
                  ? 'green'
                  : 'orange'
            "
          >
            {{
              record.menu_type === 1
                ? '目录'
                : record.menu_type === 2
                  ? '菜单'
                  : '按钮'
            }}
          </Tag>
        </template>
        <template v-if="column.key === 'status'">
          <Tag :color="record.status === 1 ? 'green' : 'red'">
            {{ record.status === 1 ? '启用' : '禁用' }}
          </Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button size="small" type="link" @click="openEditModal(record)">
              编辑
            </Button>
            <Button
              v-if="record.menu_type !== 3"
              size="small"
              type="link"
              @click="openCreateModal(record.id)"
            >
              添加子级
            </Button>
            <Popconfirm
              title="确定删除该菜单？"
              @confirm="handleDelete(record.id)"
            >
              <Button size="small" danger type="link">删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <Modal
      v-model:open="modalVisible"
      :confirm-loading="modalLoading"
      :title="modalTitle"
      @ok="handleSubmit"
    >
      <Form :model="formData" layout="vertical">
        <Form.Item label="上级菜单">
          <Select v-model:value="formData.parent_id">
            <Select.Option
              v-for="opt in getParentOptions()"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="菜单名称" required>
          <Input
            v-model:value="formData.menu_name"
            placeholder="请输入菜单名称"
          />
        </Form.Item>
        <Form.Item label="菜单类型" required>
          <Select v-model:value="formData.menu_type">
            <Select.Option
              v-for="opt in menuTypeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </Select.Option>
          </Select>
        </Form.Item>
        <Form.Item v-if="formData.menu_type !== 3" label="路由路径">
          <Input v-model:value="formData.path" placeholder="如：/system/user" />
        </Form.Item>
        <Form.Item v-if="formData.menu_type === 3" label="权限标识">
          <Input
            v-model:value="formData.perms"
            placeholder="如：system:user:create"
          />
        </Form.Item>
        <Form.Item label="图标">
          <Input v-model:value="formData.icon" placeholder="如：lucide:user" />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber v-model:value="formData.sort" :min="0" style="width: 100%" />
        </Form.Item>
        <Form.Item label="状态">
          <Select v-model:value="formData.status">
            <Select.Option :value="1">启用</Select.Option>
            <Select.Option :value="0">禁用</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="是否可见">
          <Select v-model:value="formData.visible">
            <Select.Option :value="1">显示</Select.Option>
            <Select.Option :value="0">隐藏</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
