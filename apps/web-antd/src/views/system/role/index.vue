<script lang="ts" setup>
import type { RoleFormData, RoleItem } from '#/api';

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
  Spin,
  Table,
  Tag,
  Tree,
} from 'ant-design-vue';

import {
  createRoleApi,
  deleteRoleApi,
  getAllMenusForAssignApi,
  getRoleListApi,
  getRoleMenusApi,
  setRoleMenusApi,
  updateRoleApi,
} from '#/api';

defineOptions({ name: 'RoleList' });

const loading = ref(false);
const list = ref<RoleItem[]>([]);
const total = ref(0);
const searchKeyword = ref('');
const pagination = reactive({ current: 1, pageSize: 10 });

const modalVisible = ref(false);
const modalTitle = ref('新增角色');
const modalLoading = ref(false);
const editingId = ref<number | null>(null);

const formData = reactive<RoleFormData>({
  role_name: '',
  role_code: '',
  description: '',
  status: 1,
  sort: 0,
});

const menuModalVisible = ref(false);
const menuLoading = ref(false);
const menuTree = ref<any[]>([]);
const checkedMenuIds = ref<number[]>([]);
const currentRoleId = ref<number | null>(null);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '角色名称', dataIndex: 'role_name', key: 'role_name' },
  { title: '角色编码', dataIndex: 'role_code', key: 'role_code' },
  { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 60 },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
  },
  {
    title: '操作',
    key: 'action',
    width: 220,
    fixed: 'right',
  },
];

async function fetchList() {
  loading.value = true;
  try {
    const res = await getRoleListApi({
      page: pagination.current,
      page_size: pagination.pageSize,
      keyword: searchKeyword.value || undefined,
    });
    list.value = res.items ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.current = 1;
  fetchList();
}

function handleTableChange(pag: { current: number; pageSize: number }) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  fetchList();
}

function openCreateModal() {
  editingId.value = null;
  modalTitle.value = '新增角色';
  Object.assign(formData, {
    role_name: '',
    role_code: '',
    description: '',
    status: 1,
    sort: 0,
  });
  modalVisible.value = true;
}

function openEditModal(record: RoleItem) {
  editingId.value = record.id;
  modalTitle.value = '编辑角色';
  Object.assign(formData, {
    role_name: record.role_name,
    role_code: record.role_code,
    description: record.description,
    status: record.status,
    sort: record.sort,
  });
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formData.role_name || !formData.role_code) {
    message.error('角色名称和编码不能为空');
    return;
  }
  modalLoading.value = true;
  try {
    if (editingId.value) {
      await updateRoleApi(editingId.value, { ...formData });
      message.success('更新成功');
    } else {
      await createRoleApi({ ...formData });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchList();
  } finally {
    modalLoading.value = false;
  }
}

async function handleDelete(id: number) {
  await deleteRoleApi(id);
  message.success('删除成功');
  fetchList();
}

async function openMenuModal(record: RoleItem) {
  currentRoleId.value = record.id;
  menuModalVisible.value = true;
  menuLoading.value = true;
  try {
    const [menusRes, roleMenusRes] = await Promise.all([
      getAllMenusForAssignApi(),
      getRoleMenusApi(record.id),
    ]);
    menuTree.value = buildMenuTree(menusRes ?? []);
    checkedMenuIds.value = (roleMenusRes ?? []).map((m: any) => m.id);
  } finally {
    menuLoading.value = false;
  }
}

function buildMenuTree(menus: any[]): any[] {
  return menus
    .filter((m: any) => m.menu_type !== 3)
    .map((menu: any) => ({
      key: menu.id,
      title: `${menu.menu_name}${menu.menu_type === 1 ? ' (目录)' : ''}${menu.path ? ` - ${menu.path}` : ''}`,
      children: menu.children ? buildMenuTree(menu.children) : [],
    }));
}

function getAllLeafKeys(tree: any[]): number[] {
  const keys: number[] = [];
  function walk(nodes: any[]) {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        walk(node.children);
      } else {
        keys.push(node.key);
      }
    }
  }
  walk(tree);
  return keys;
}

async function handleSaveMenus() {
  if (currentRoleId.value === null) return;
  menuLoading.value = true;
  try {
    await setRoleMenusApi(currentRoleId.value, checkedMenuIds.value);
    message.success('菜单分配成功');
    menuModalVisible.value = false;
  } finally {
    menuLoading.value = false;
  }
}

onMounted(fetchList);
</script>

<template>
  <Page title="角色管理">
    <div class="mb-4 flex items-center gap-2">
      <Input
        v-model:value="searchKeyword"
        placeholder="搜索角色名称/编码"
        style="width: 280px"
        allow-clear
        @press-enter="handleSearch"
      />
      <Button type="primary" @click="handleSearch">搜索</Button>
      <Button type="primary" @click="openCreateModal">新增角色</Button>
    </div>

    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total,
        showSizeChanger: true,
        showTotal: (t: number) => `共 ${t} 条`,
      }"
      row-key="id"
      size="small"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
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
            <Button size="small" type="link" @click="openMenuModal(record)">
              菜单权限
            </Button>
            <Popconfirm
              title="确定删除该角色？"
              @confirm="handleDelete(record.id)"
            >
              <Button size="small" danger type="link">删除</Button>
            </Popconfirm>
          </Space>
        </template>
      </template>
    </Table>

    <!-- 编辑/新增弹窗 -->
    <Modal
      v-model:open="modalVisible"
      :confirm-loading="modalLoading"
      :title="modalTitle"
      @ok="handleSubmit"
    >
      <Form :model="formData" layout="vertical">
        <Form.Item label="角色名称" required>
          <Input v-model:value="formData.role_name" placeholder="请输入角色名称" />
        </Form.Item>
        <Form.Item label="角色编码" required>
          <Input
            v-model:value="formData.role_code"
            :disabled="!!editingId"
            placeholder="请输入角色编码"
          />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea
            v-model:value="formData.description"
            placeholder="请输入描述"
          />
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
      </Form>
    </Modal>

    <!-- 菜单权限分配弹窗 -->
    <Modal
      v-model:open="menuModalVisible"
      :confirm-loading="menuLoading"
      title="分配菜单权限"
      width="560px"
      @ok="handleSaveMenus"
    >
      <Spin :spinning="menuLoading">
        <div v-if="menuTree.length === 0" class="text-center text-gray-400 py-8">
          暂无菜单数据
        </div>
        <Tree
          v-else
          v-model:checkedKeys="checkedMenuIds"
          :tree-data="menuTree"
          checkable
          default-expand-all
          :check-strictly="false"
        />
      </Spin>
    </Modal>
  </Page>
</template>
