<script lang="ts" setup>
import type { UserFormData, UserItem } from '#/api';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createUserApi,
  deleteUserApi,
  getUserListApi,
  updateUserApi,
} from '#/api';

defineOptions({ name: 'UserList' });

const loading = ref(false);
const list = ref<UserItem[]>([]);
const total = ref(0);
const searchKeyword = ref('');
const pagination = reactive({ current: 1, pageSize: 10 });

const modalVisible = ref(false);
const modalTitle = ref('新增用户');
const modalLoading = ref(false);
const editingId = ref<number | null>(null);

const formData = reactive<UserFormData>({
  username: '',
  real_name: '',
  email: '',
  phone: '',
  status: 1,
  account_id: null,
  password: '',
  confirm_password: '',
});

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '姓名', dataIndex: 'real_name', key: 'real_name' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { title: '手机号', dataIndex: 'phone', key: 'phone' },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
  },
  {
    title: '最后登录',
    dataIndex: 'last_login_at',
    key: 'last_login_at',
    width: 170,
  },
  {
    title: '操作',
    key: 'action',
    width: 160,
    fixed: 'right',
  },
];

async function fetchList() {
  loading.value = true;
  try {
    const res = await getUserListApi({
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
  modalTitle.value = '新增用户';
  Object.assign(formData, {
    username: '',
    real_name: '',
    email: '',
    phone: '',
    status: 1,
    account_id: null,
    password: '',
    confirm_password: '',
  });
  modalVisible.value = true;
}

function openEditModal(record: UserItem) {
  editingId.value = record.id;
  modalTitle.value = '编辑用户';
  Object.assign(formData, {
    username: record.username,
    real_name: record.real_name,
    email: record.email,
    phone: record.phone,
    status: record.status,
    account_id: record.account_id,
    password: '',
    confirm_password: '',
  });
  modalVisible.value = true;
}

async function handleSubmit() {
  modalLoading.value = true;
  try {
    if (editingId.value) {
      await updateUserApi(editingId.value, {
        real_name: formData.real_name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        account_id: formData.account_id,
      });
      message.success('更新成功');
    } else {
      if (!formData.username || !formData.password) {
        message.error('用户名和密码不能为空');
        return;
      }
      await createUserApi({
        username: formData.username,
        real_name: formData.real_name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        account_id: formData.account_id,
        password: formData.password,
        confirm_password: formData.confirm_password,
      });
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchList();
  } finally {
    modalLoading.value = false;
  }
}

async function handleDelete(id: number) {
  await deleteUserApi(id);
  message.success('删除成功');
  fetchList();
}

onMounted(fetchList);
</script>

<template>
  <Page title="用户管理">
    <div class="mb-4 flex items-center gap-2">
      <Input
        v-model:value="searchKeyword"
        placeholder="搜索用户名/姓名/邮箱/手机号"
        style="width: 280px"
        allow-clear
        @press-enter="handleSearch"
      />
      <Button type="primary" @click="handleSearch">搜索</Button>
      <Button type="primary" @click="openCreateModal">新增用户</Button>
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
            <Popconfirm
              title="确定删除该用户？"
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
        <Form.Item label="用户名" required>
          <Input
            v-model:value="formData.username"
            :disabled="!!editingId"
            placeholder="请输入用户名"
          />
        </Form.Item>
        <Form.Item label="姓名">
          <Input v-model:value="formData.real_name" placeholder="请输入姓名" />
        </Form.Item>
        <Form.Item label="邮箱">
          <Input v-model:value="formData.email" placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item label="手机号">
          <Input v-model:value="formData.phone" placeholder="请输入手机号" />
        </Form.Item>
        <Form.Item v-if="!editingId" label="密码" required>
          <Input.Password
            v-model:value="formData.password"
            placeholder="请输入密码"
          />
        </Form.Item>
        <Form.Item v-if="!editingId" label="确认密码" required>
          <Input.Password
            v-model:value="formData.confirm_password"
            placeholder="请确认密码"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select v-model:value="formData.status">
            <Select.Option :value="1">启用</Select.Option>
            <Select.Option :value="0">禁用</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
