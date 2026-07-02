import { requestClient } from '#/api/request';

/** 账户列表查询参数 */
export interface AccountListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  include_disabled?: boolean;
}

/** 账户创建/更新参数 */
export interface AccountFormData {
  account_name?: string;
  password?: string;
  confirm_password?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  status?: number;
  expire_at?: string | null;
  role_ids?: number[];
}

/** 账户列表项 */
export interface AccountItem {
  id: number;
  account_name: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  status: number;
  expire_at: string | null;
  roles?: RoleBrief[];
  created_at: string;
  updated_at: string;
}

/** 分页响应 */
export interface AccountListResult {
  items: AccountItem[];
  total: number;
  page: number;
  page_size: number;
}

/** 角色简要信息 */
export interface RoleBrief {
  id: number;
  role_name: string;
  role_code: string;
  description: string;
  status: number;
  sort: number;
}

/**
 * 获取账户列表
 */
export async function getAccountListApi(params: AccountListParams) {
  return requestClient.post<AccountListResult>('/accounts/list', params);
}

/**
 * 创建账户
 */
export async function createAccountApi(data: AccountFormData) {
  return requestClient.post<AccountItem>('/accounts/create', data);
}

/**
 * 更新账户
 */
export async function updateAccountApi(id: number, data: AccountFormData) {
  return requestClient.post<AccountItem>('/accounts/update', { id, ...data });
}

/**
 * 删除账户
 */
export async function deleteAccountApi(id: number) {
  return requestClient.post('/accounts/delete', { id });
}

/**
 * 获取账户已分配的角色
 */
export async function getAccountRolesApi(accountId: number) {
  return requestClient.post<RoleBrief[]>('/accounts/roles', {
    account_id: accountId,
  });
}

/**
 * 设置账户角色
 */
export async function setAccountRolesApi(accountId: number, roleIds: number[]) {
  return requestClient.post<RoleBrief[]>('/accounts/roles/update', {
    account_id: accountId,
    role_ids: roleIds,
  });
}
