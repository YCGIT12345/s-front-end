import type { RouteRecordStringComponent } from '@vben/types';

import { baseRequestClient, requestClient } from '#/api/request';

import type { BackendMenuItem } from './menu';
import { transformMenuToRoute } from './menu';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值（后端返回 access_token + user） */
  export interface LoginResult {
    access_token: string;
    token_type: string;
    user: any;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }

  /** nav 接口返回值 */
  export interface NavResult {
    menuTree: BackendMenuItem[];
    permission: string[];
  }
}

/** nav 接口响应缓存 */
let cachedNavResult: AuthApi.NavResult | null = null;

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout');
}

/**
 * 获取导航菜单和权限
 */
export async function getNavApi() {
  const nav = await requestClient.post<AuthApi.NavResult>('/auth/nav');
  cachedNavResult = nav;
  return nav;
}

/**
 * 获取缓存的菜单树（由 getNavApi 或 getAccessCodesApi 调用后缓存）
 * 将后端原始菜单数据转换为 generateRoutesByBackend 需要的 RouteRecordStringComponent 格式
 * 若缓存不存在则主动请求
 */
export async function getCachedMenuTree(): Promise<
  RouteRecordStringComponent[]
> {
  if (!cachedNavResult) {
    await getNavApi();
  }
  return transformMenuToRoute(cachedNavResult!.menuTree);
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  // 若已缓存则直接返回，避免重复请求
  if (cachedNavResult) {
    return cachedNavResult.permission ?? [];
  }
  const nav = await getNavApi();
  return nav.permission ?? [];
}

/**
 * 清除 nav 缓存（退出登录时调用）
 */
export function clearNavCache() {
  cachedNavResult = null;
}
