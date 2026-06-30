<script lang="ts" setup>
import { computed } from 'vue';

import { Fallback } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

defineOptions({ name: 'Fallback404Demo' });

const accessStore = useAccessStore();

function getFirstAccessiblePath(menus: any[]): string {
  for (const menu of menus) {
    if (menu.children?.length) {
      const childPath = getFirstAccessiblePath(menu.children);
      if (childPath) return childPath;
    }
    if (menu.path && menu.path !== '/') return menu.path;
  }
  return '/';
}

const homePath = computed(() =>
  getFirstAccessiblePath(accessStore.accessMenus),
);
</script>

<template>
  <Fallback status="404" :home-path="homePath" />
</template>
