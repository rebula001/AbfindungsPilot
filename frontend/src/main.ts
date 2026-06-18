// 应用入口：注册 PrimeVue（自定义 Aura 主题）、vue-i18n（默认德语），并挂载根组件
import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Tooltip from 'primevue/tooltip';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import 'primeicons/primeicons.css';
import './style.css';
import App from './App.vue';
import { i18n } from './i18n';

const appTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{sky.50}',
      100: '{sky.100}',
      200: '{sky.200}',
      300: '{sky.300}',
      400: '{sky.400}',
      500: '{sky.500}',
      600: '{sky.600}',
      700: '{sky.700}',
      800: '{sky.800}',
      900: '{sky.900}',
      950: '{sky.950}'
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{neutral.50}',
          100: '{neutral.100}',
          200: '{neutral.200}',
          300: '{neutral.300}',
          400: '{neutral.400}',
          500: '{neutral.500}',
          600: '{neutral.600}',
          700: '{neutral.700}',
          800: '{neutral.800}',
          900: '{neutral.900}',
          950: '{neutral.950}'
        }
      },
      dark: {
        surface: {
          0: '{neutral.950}',
          50: '{neutral.900}',
          100: '{neutral.800}',
          200: '{neutral.700}',
          300: '{neutral.600}',
          400: '{neutral.500}',
          500: '{neutral.400}',
          600: '{neutral.300}',
          700: '{neutral.200}',
          800: '{neutral.100}',
          900: '{neutral.50}',
          950: '#ffffff'
        }
      }
    }
  }
});

createApp(App)
  .use(i18n)
  .use(PrimeVue, {
    theme: {
      preset: appTheme,
      options: {
        cssLayer: {
          name: 'primevue',
          order: 'theme, base, primevue, utilities'
        }
      }
    }
  })
  .use(ToastService)
  .directive('tooltip', Tooltip)
  .mount('#app');
