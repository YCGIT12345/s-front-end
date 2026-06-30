import type { RouteRecordStringComponent } from '@vben/types';

/** 后端返回的原始菜单节点 */
export interface BackendMenuItem {
  children?: BackendMenuItem[];
  icon?: null | string;
  id: number;
  menu_name: string;
  menu_type: number; // 1=目录, 2=菜单, 3=按钮
  parent_id: number;
  path?: null | string;
  perms?: null | string;
  sort: number;
}

/**
 * 将后端菜单树转换为 generateRoutesByBackend 需要的格式
 * - 目录（menu_type=1）：不加 component，只递归处理子节点
 * - 菜单（menu_type=2）：根据 path 生成 component
 * - 按钮（menu_type=3）：过滤掉
 */
export function transformMenuToRoute(
  menus: BackendMenuItem[],
  parentPath = '',
): RouteRecordStringComponent[] {
  return menus
    .filter((item) => item.menu_type !== 3)
    .map((item) => {
      const isMenu = item.menu_type === 2;
      const hasChildren = !!(item.children && item.children.length > 0);

      // 带子菜单的菜单（含一级菜单）：把自身 path 累加到 parentPath 上，传给子节点递归
      const currentAccPath = hasChildren && item.path
        ? `${parentPath}${item.path}`
        : parentPath;
      // 叶子菜单：用累积的祖先路径 + 自身 path 生成 component
      const component = isMenu && !hasChildren && item.path
        ? `views${currentAccPath}${item.path.replace(/\/list$/, '')}/index.vue`
        : '';

      // 叶子菜单：path 也累积祖先路径，保证路由唯一
      const fullPath = isMenu && !hasChildren && item.path
        ? `${currentAccPath}${item.path}`
        : item.path ?? '';

      return {
        children: hasChildren
          ? transformMenuToRoute(item.children!, currentAccPath)
          : undefined,
        component,
        menu_name: item.menu_name,
        meta: {
          icon: item.icon || undefined,
          order: item.sort,
          title: item.menu_name,
        },
        path: fullPath,
      } as RouteRecordStringComponent;
    });
}
