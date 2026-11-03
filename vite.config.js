import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import cronDaily from './api/cron-daily.js'
import letusCalendar from './api/letus-calendar.js'
import mailInbound from './api/mail-inbound.js'
import mailSubmissions from './api/mail-submissions.js'
import pushPublicKey from './api/push-public-key.js'
import pushSubscribe from './api/push-subscribe.js'
import pushTest from './api/push-test.js'
import pushUnsubscribe from './api/push-unsubscribe.js'

// 自分のPCで動かすとき（npm run dev）も、Vercel と同じように /api/〇〇 を使えるようにする
const API_ROUTES = {
  'letus-calendar': letusCalendar,
  'push-public-key': pushPublicKey,
  'push-subscribe': pushSubscribe,
  'push-unsubscribe': pushUnsubscribe,
  'push-test': pushTest,
  'cron-daily': cronDaily,
  'mail-inbound': mailInbound,
  'mail-submissions': mailSubmissions,
}

const localApi = {
  name: 'local-api',
  configureServer(server) {
    server.middlewares.use('/api', (req, res, next) => {
      const handler = API_ROUTES[req.url.split('?')[0].replace(/^\//, '')]
      if (!handler) return next()
      return handler(req, res)
    })
  },
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 自分のPCで試すとき、.env.local の鍵などをサーバー側の処理から読めるようにする
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [
      react(),
      localApi,
      // PWA：ホーム画面からアプリとして開ける・通知を受け取れるようにする
      VitePWA({
        strategies: 'injectManifest', // サービスワーカーは自分で書いたもの（src/sw.js）を使う
        srcDir: 'src',
        filename: 'sw.js',
        injectRegister: false, // 登録は main.jsx で行う
        injectManifest: {
          rollupFormat: 'iife', // どのブラウザでも動く形にまとめる
          globPatterns: ['**/*.{js,css,html,svg,png}'],
        },
        manifest: {
          name: '課題管理',
          short_name: '課題管理',
          description: 'LETUSの課題と口頭の課題をまとめて管理し、いつ始めるかまで示すアプリ',
          lang: 'ja',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#f6f7f9',
          theme_color: '#2f6fde',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: { enabled: true, type: 'module' },
      }),
    ],
  }
})
