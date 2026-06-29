import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息（从 login 响应中提取，此处作为备用）
 */
export async function getUserInfoApi() {
  // 后端无单独的用户信息接口，从 login/nav 获取
  return requestClient.post<UserInfo>('/auth/nav');
}
