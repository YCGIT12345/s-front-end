import { baseRequestClient, requestClient } from '#/api/request';

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
    menuList: string[];
    permission: string[];
  }
}

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
  return requestClient.post<AuthApi.NavResult>('/auth/nav');
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  const nav = await getNavApi();
  return nav.permission ?? [];
}
