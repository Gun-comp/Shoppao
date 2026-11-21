import { route } from 'quasar/wrappers'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router'
import routes from './routes'

export default route(function (/* { store, ssrContext } */) {
  // เปลี่ยนมาเช็คผ่าน import.meta.env แทน process.env
  const isServer = typeof window === 'undefined'
  const routerMode = import.meta.env.VITE_ROUTER_MODE || 'hash'
  const routerBase = import.meta.env.VITE_ROUTER_BASE || '/'

  const createHistory = isServer
    ? createMemoryHistory
    : (routerMode === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    history: createHistory(routerBase)
  })

  return Router
})