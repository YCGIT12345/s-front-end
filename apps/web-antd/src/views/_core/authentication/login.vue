<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';

import { computed } from 'vue';

import { AuthenticationLogin, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { useAuthStore } from '#/store';

defineOptions({ name: 'Login' });

const authStore = useAuthStore();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      defaultValue: '18888888888',
      componentProps: {
        maxLength: 11,
        placeholder: $t('authentication.usernameTip'),
      },
      fieldName: 'username',
      label: $t('authentication.username'),
      rules: z.string().min(1, { message: $t('authentication.usernameTip') }).max(11, '用户名最大长度不能超过11位'),
    },
    {
      component: 'VbenInputPassword',
      defaultValue: 'admin123',
      componentProps: {
        maxLength: 20,
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
  ];
});
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="authStore.loginLoading"
    :show-register="false"
    :show-forget-password="false"
    :show-qrcode-login="false"
    :show-code-login="false"
    :show-third-party-login="false"
    @submit="authStore.authLogin"
  />
</template>
