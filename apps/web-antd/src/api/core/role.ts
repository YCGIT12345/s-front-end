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
  return requestClient.post<RoleListResult>('/roles/list', params);
}

/**
 * 创建角色
 */
export async function createRoleApi(data: RoleFormData) {
  return requestClient.post<RoleItem>('/roles/create', data);
}

/**
 * 更新角色
 */
export async function updateRoleApi(id: number, data: RoleFormData) {
  return requestClient.post<RoleItem>('/roles/update', { id, ...data });
}

/**
 * 删除角色
 */
export async function deleteRoleApi(id: number) {
  return requestClient.post('/roles/delete', { id });
}

/**
 * 获取角色已分配的菜单
 */
export async function getRoleMenusApi(roleId: number) {
  return requestClient.post<MenuBrief[]>('/roles/menus', {
    role_id: roleId,
  });
}

/**
 * 设置角色菜单
 */
export async function setRoleMenusApi(roleId: number, menuIds: number[]) {
  return requestClient.post<MenuBrief[]>('/roles/menus/update', {
    role_id: roleId,
    menu_ids: menuIds,
  });
}

/**
 * 获取所有菜单（用于角色分配）
 */
export async function getAllMenusForAssignApi() {
  return requestClient.post<MenuBrief[]>('/menus/list');
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
  return requestClient.post<MenuBrief>('/menus/create', data);
}

/**
 * 更新菜单
 */
export async function updateMenuApi(id: number, data: MenuFormData) {
  return requestClient.post<MenuBrief>('/menus/update', { id, ...data });
}

/**
 * 删除菜单
 */
export async function deleteMenuApi(id: number) {
  return requestClient.post('/menus/delete', { id });
}
