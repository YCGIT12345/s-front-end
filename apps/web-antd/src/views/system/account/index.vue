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
  Table,
  Tag,
} from 'ant-design-vue';

import { useAccess } from '@vben/access';

import {
  createAccountApi,
  deleteAccountApi,
  getAccountListApi,
  getAccountRolesApi,
  updateAccountApi,
} from '#/api';
import { getRoleListApi } from '#/api/core/role';

defineOptions({ name: 'AccountList' });

const { hasAccessByCodes } = useAccess();

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
  role_ids: [],
});

// 角色选择相关
const allRoles = ref<any[]>([]);
const selectedRoleIds = ref<number[]>([]);
const roleLoading = ref(false);

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '账户名称', dataIndex: 'account_name', key: 'account_name' },
  {
    title: '绑定角色',
    dataIndex: 'bind_roles',
    key: 'bind_roles',
    width: 200,
  },
  { title: '联系人', dataIndex: 'contact_person', key: 'contact_person' },
  { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone' },
  { title: '联系邮箱', dataIndex: 'contact_email', key: 'contact_email' },
  { title: '联系地址', dataIndex: 'address', key: 'address', ellipsis: true },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 80,
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

async function openCreateModal() {
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
    role_ids: [],
  });
  selectedRoleIds.value = [];
  // 加载角色列表
  roleLoading.value = true;
  try {
    const res = await getRoleListApi({ page: 1, page_size: 100 });
    allRoles.value = res.items ?? [];
  } finally {
    roleLoading.value = false;
  }
  modalVisible.value = true;
}

async function openEditModal(record: AccountItem) {
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
    role_ids: [],
  });
  // 加载角色列表和账户已有角色
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
    const submitData = { ...formData, role_ids: selectedRoleIds.value };
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
      <Button type="primary" v-if="hasAccessByCodes(['account:add'])" @click="openCreateModal">新增账户</Button>
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
        <template v-if="column.key === 'roles'">
          <Space v-if="record.roles && record.roles.length > 0" wrap>
            <Tag v-for="role in record.roles" :key="role.id" color="blue">
              {{ role.role_name }}
            </Tag>
          </Space>
          <span v-else class="text-gray-400">-</span>
        </template>
        <template v-if="column.key === 'action'">
          <Space>
            <Button size="small" v-if="hasAccessByCodes(['account:edit'])" type="link" @click="openEditModal(record)">
              编辑
            </Button>
            <Popconfirm
              title="确定删除该账户？"
              @confirm="handleDelete(record.id)"
            >
              <Button size="small" v-if="hasAccessByCodes(['account:delete'])" danger type="link">删除</Button>
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
        <Form.Item label="联系人" required>
          <Input
            v-model:value="formData.contact_person"
            placeholder="请输入联系人"
          />
        </Form.Item>
        <Form.Item label="联系电话" required>
          <Input
            v-model:value="formData.contact_phone"
            placeholder="请输入联系电话"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select v-model:value="formData.status">
            <Select.Option :value="1">启用</Select.Option>
            <Select.Option :value="0">禁用</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="角色" required>
          <Checkbox.Group v-model:value="selectedRoleIds">
            <div v-for="role in allRoles" :key="role.id" class="mb-1">
              <Checkbox :value="role.id">
                {{ role.role_name }}
                <span class="text-gray-400">({{ role.role_code }})</span>
              </Checkbox>
            </div>
          </Checkbox.Group>
          <div v-if="allRoles.length === 0" class="text-gray-400">
            暂无角色数据
          </div>
        </Form.Item>
      </Form>
    </Modal>

  </Page>
</template>
