import { defineConfig } from '#q-app'
import { loadEnv } from 'vite'

export default defineConfig((/* ctx */) => {
  // อ่านค่าจากไฟล์ .env โดยตรง
  const env = loadEnv('development', process.cwd(), '')

  return {
    boot: ['pinia'],

    css: ['app.scss'],

    extras: ['roboto-font', 'material-icons'],

    build: {
      target: {},

      vueRouterMode: 'hash',

      // ฝังค่า .env ลงในโค้ดฝั่งเว็บ
      extendViteConf(viteConf) {
        viteConf.define = {
          ...(viteConf.define || {}),
          'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
          'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        }
      },

      vitePlugins: [
        [
          'vite-plugin-checker',
          {
            eslint: {
              lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{js,mjs,cjs,vue}"',
              useFlatConfig: true,
            },
          },
          { server: false },
        ],
      ],
    },

    devServer: {
      open: true,
    },

    framework: {
      config: {},
      plugins: ['Notify', 'Dialog'],
    },

    animations: [],

    ssr: {
      prodPort: 3000,
      middlewares: ['render'],
    },

    ssg: {},

    pwa: {
      workboxMode: 'GenerateSW',
    },

    cordova: {},

    capacitor: {
      hideSplashscreen: true,
    },

    electron: {
      preloadScripts: ['electron-preload'],
      inspectPort: 5858,
      bundler: 'packager',
      packager: {},
      builder: {
        appId: 'shoppao',
      },
    },

    bex: {
      extraScripts: [],
    },
  }
})