<script lang="ts" setup>
import type { AccountFormData, AccountItem } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Checkbox,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createAccountApi,
  deleteAccountApi,
  getAccountListApi,
  getAccountRolesApi,
  getAllMenusForAssignApi,
  setAccountRolesApi,
  updateAccountApi,
} from '#/api';
import { getRoleListApi } from '#/api/core/role';

defineOptions({ name: 'AccountList' });

const loading = ref(false);
const list = ref<AccountItem[]>([]);
const total = ref(0);
const searchKeyword = ref('');
const pagination = reactive({ current: 1, pageSize: 10 });

const modalVisible = ref(false);
const modalTitle = ref('新增账户');
const modalLoading = ref(false);
const editingId = ref<number | null>(null);

const formData = reactive<AccountFormData>({
  account_name: '',
  password: '',
  confirm_password: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  address: '',
  status: 1,
  expire_at: null,
});

const roleModalVisible = ref(false);
const roleLoading = ref(false);
const allRoles = ref<any[]>([]);
const selectedRoleIds = ref<number[]>([]);
const currentAccountId = ref<number | null>(null);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '账户名称', dataIndex: 'account_name', key: 'account_name' },
  { title: '联系人', dataIndex: 'contact_person', key: 'contact_person' },
  { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone' },
  { title: '联系邮箱', dataIndex: 'contact_email', key: 'contact_email' },
  { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
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
    const res = await getAccountListApi({
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
  modalTitle.value = '新增账户';
  Object.assign(formData, {
    account_name: '',
    password: '',
    confirm_password: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    status: 1,
    expire_at: null,
  });
  modalVisible.value = true;
}

function openEditModal(record: AccountItem) {
  editingId.value = record.id;
  modalTitle.value = '编辑账户';
  Object.assign(formData, {
    account_name: record.account_name,
    password: '',
    confirm_password: '',
    contact_person: record.contact_person,
    contact_phone: record.contact_phone,
    contact_email: record.contact_email,
    address: record.address,
    status: record.status,
    expire_at: record.expire_at,
  });
  modalVisible.value = true;
}

async function handleSubmit() {
  if (!formData.account_name) {
    message.error('账户名称不能为空');
    return;
  }
  if (!editingId.value && !formData.password) {
    message.error('新增账户时密码不能为空');
    return;
  }
  if (formData.password && formData.password !== formData.confirm_password) {
    message.error('两次输入的密码不一致');
    return;
  }
  modalLoading.value = true;
  try {
    const submitData = { ...formData };
    // 编辑时如未填写密码则不发送密码字段
    if (editingId.value && !submitData.password) {
      delete submitData.password;
      delete submitData.confirm_password;
    }
    if (editingId.value) {
      await updateAccountApi(editingId.value, submitData);
      message.success('更新成功');
    } else {
      await createAccountApi(submitData);
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchList();
  } finally {
    modalLoading.value = false;
  }
}

async function handleDelete(id: number) {
  await deleteAccountApi(id);
  message.success('删除成功');
  fetchList();
}

async function openRoleModal(record: AccountItem) {
  currentAccountId.value = record.id;
  roleModalVisible.value = true;
  roleLoading.value = true;
  try {
    const [rolesRes, accountRolesRes] = await Promise.all([
      getRoleListApi({ page: 1, page_size: 100 }),
      getAccountRolesApi(record.id),
    ]);
    allRoles.value = rolesRes.items ?? [];
    selectedRoleIds.value = (accountRolesRes ?? []).map((r: any) => r.id);
  } finally {
    roleLoading.value = false;
  }
}

async function handleSaveRoles() {
  if (currentAccountId.value === null) return;
  roleLoading.value = true;
  try {
    await setAccountRolesApi(currentAccountId.value, selectedRoleIds.value);
    message.success('角色分配成功');
    roleModalVisible.value = false;
  } finally {
    roleLoading.value = false;
  }
}

onMounted(fetchList);
</script>

<template>
  <Page title="账户管理">
    <div class="mb-4 flex items-center gap-2">
      <Input
        v-model:value="searchKeyword"
        placeholder="搜索账户名称/联系人/邮箱"
        style="width: 280px"
        allow-clear
        @press-enter="handleSearch"
      />
      <Button type="primary" @click="handleSearch">搜索</Button>
      <Button type="primary" @click="openCreateModal">新增账户</Button>
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
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'id'">
          {{ (pagination.current - 1) * pagination.pageSize + index + 1 }}
        </template>
        <template v-if="column.key === 'status'">
          <Tag :color="record.status === 1 ? 'green' : 'red'">
            {{ record.status === 1 ? '启用' : '禁用' }}
          </Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button size="small" v-if="record.id !== 1" type="link" @click="openEditModal(record)">
              编辑
            </Button>
            <Button size="small" v-if="record.id !== 1" type="link" @click="openRoleModal(record)">
              角色
            </Button>
            <Popconfirm
              title="确定删除该账户？"
              @confirm="handleDelete(record.id)"
            >
              <Button size="small" v-if="record.id !== 1" danger type="link">删除</Button>
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
        <Form.Item label="账户名称" required>
          <Input
            v-model:value="formData.account_name"
            placeholder="请输入账户名称"
          />
        </Form.Item>
        <Form.Item label="密码">
          <Input.Password
            v-model:value="formData.password"
            placeholder="请输入密码（留空则不修改）"
          />
        </Form.Item>
        <Form.Item label="确认密码">
          <Input.Password
            v-model:value="formData.confirm_password"
            placeholder="请再次输入密码"
          />
        </Form.Item>
        <Form.Item label="联系人">
          <Input
            v-model:value="formData.contact_person"
            placeholder="请输入联系人"
          />
        </Form.Item>
        <Form.Item label="联系电话">
          <Input
            v-model:value="formData.contact_phone"
            placeholder="请输入联系电话"
          />
        </Form.Item>
        <Form.Item label="联系邮箱">
          <Input
            v-model:value="formData.contact_email"
            placeholder="请输入联系邮箱"
          />
        </Form.Item>
        <Form.Item label="地址">
          <Input v-model:value="formData.address" placeholder="请输入地址" />
        </Form.Item>
        <Form.Item label="状态">
          <Select v-model:value="formData.status">
            <Select.Option :value="1">启用</Select.Option>
            <Select.Option :value="0">禁用</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>

    <!-- 角色分配弹窗 -->
    <Modal
      v-model:open="roleModalVisible"
      :confirm-loading="roleLoading"
      title="分配角色"
      @ok="handleSaveRoles"
    >
      <Spin :spinning="roleLoading">
        <Checkbox.Group v-model:value="selectedRoleIds">
          <div v-for="role in allRoles" :key="role.id" class="mb-2">
            <Checkbox :value="role.id">
              {{ role.role_name }}
              <span class="text-gray-400">({{ role.role_code }})</span>
            </Checkbox>
          </div>
        </Checkbox.Group>
        <div v-if="allRoles.length === 0" class="text-center text-gray-400">
          暂无角色数据
        </div>
      </Spin>
    </Modal>
  </Page>
</template>
