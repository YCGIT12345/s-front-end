import { requestClient } from '#/api/request';

/** 角色列表查询参数 */
export interface RoleListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  include_disabled?: boolean;
}

/** 角色创建/更新参数 */
export interface RoleFormData {
  role_name?: string;
  role_code?: string;
  description?: string;
  status?: number;
  sort?: number;
}

/** 角色列表项 */
export interface RoleItem {
  id: number;
  role_name: string;
  role_code: string;
  description: string;
  status: number;
  sort: number;
  created_at: string;
  updated_at: string;
}

/** 分页响应 */
export interface RoleListResult {
  items: RoleItem[];
  total: number;
  page: number;
  page_size: number;
}

/** 菜单简要信息 */
export interface MenuBrief {
  id: number;
  parent_id: number;
  menu_name: string;
  menu_type: number;
  path: string;
  perms: string;
  icon: string;
  sort: number;
  visible: number;
  status: number;
  children: MenuBrief[];
}

/**
 * 获取角色列表
 */
export async function getRoleListApi(params: RoleListParams) {
  return requestClient.get<RoleListResult>('/roles', { params });
}

/**
 * 创建角色
 */
export async function createRoleApi(data: RoleFormData) {
  return requestClient.post<RoleItem>('/roles', data);
}

/**
 * 更新角色
 */
export async function updateRoleApi(id: number, data: RoleFormData) {
  return requestClient.put<RoleItem>(`/roles/${id}`, data);
}

/**
 * 删除角色
 */
export async function deleteRoleApi(id: number) {
  return requestClient.delete(`/roles/${id}`);
}

/**
 * 获取角色已分配的菜单
 */
export async function getRoleMenusApi(roleId: number) {
  return requestClient.get<MenuBrief[]>(`/roles/${roleId}/menus`);
}

/**
 * 设置角色菜单
 */
export async function setRoleMenusApi(roleId: number, menuIds: number[]) {
  return requestClient.put<MenuBrief[]>(`/roles/${roleId}/menus`, {
    menu_ids: menuIds,
  });
}

/**
 * 获取所有菜单（用于角色分配）
 */
export async function getAllMenusForAssignApi() {
  return requestClient.get<MenuBrief[]>('/menus');
}

// --- 菜单管理 CRUD ---

/** 菜单创建/更新参数 */
export interface MenuFormData {
  parent_id?: number;
  menu_name?: string;
  menu_type?: number;
  path?: string;
  perms?: string;
  icon?: string;
  sort?: number;
  visible?: number;
  status?: number;
}

/**
 * 创建菜单
 */
export async function createMenuApi(data: MenuFormData) {
  return requestClient.post<MenuBrief>('/menus', data);
}

/**
 * 更新菜单
 */
export async function updateMenuApi(id: number, data: MenuFormData) {
  return requestClient.put<MenuBrief>(`/menus/${id}`, data);
}

/**
 * 删除菜单
 */
export async function deleteMenuApi(id: number) {
  return requestClient.delete(`/menus/${id}`);
}
