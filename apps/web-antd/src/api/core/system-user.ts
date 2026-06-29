import { requestClient } from '#/api/request';

/** 用户列表查询参数 */
export interface UserListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  include_disabled?: boolean;
}

/** 用户创建/更新参数 */
export interface UserFormData {
  username?: string;
  real_name?: string;
  email?: string;
  phone?: string;
  status?: number;
  account_id?: number | null;
  password?: string;
  confirm_password?: string;
}

/** 用户列表项 */
export interface UserItem {
  id: number;
  username: string;
  real_name: string;
  email: string;
  phone: string;
  avatar: string | null;
  status: number;
  account_id: number | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 分页响应 */
export interface UserListResult {
  items: UserItem[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * 获取用户列表
 */
export async function getUserListApi(params: UserListParams) {
  return requestClient.get<UserListResult>('/users', { params });
}

/**
 * 创建用户
 */
export async function createUserApi(data: UserFormData) {
  return requestClient.post<UserItem>('/users', data);
}

/**
 * 更新用户
 */
export async function updateUserApi(id: number, data: UserFormData) {
  return requestClient.put<UserItem>(`/users/${id}`, data);
}

/**
 * 删除用户
 */
export async function deleteUserApi(id: number) {
  return requestClient.delete(`/users/${id}`);
}
