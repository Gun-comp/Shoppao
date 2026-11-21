import { useAuthStore } from '../stores/auth'

const toLogin = (to) => ({ path: '/login', query: { redirect: to.fullPath } })

const ready = async () => {
  const auth = useAuthStore()
  await auth.init()
  return auth
}

const requireAuth = async (to) => {
  const auth = await ready()
  if (!auth.isLoggedIn) return toLogin(to)
  return true
}

const requireSeller = async (to) => {
  const auth = await ready()
  if (!auth.isLoggedIn) return toLogin(to)
  await auth.refreshProfile()
  if (auth.isAdmin) return '/admin'
  if (!auth.isSeller) return '/seller/open'
  return true
}

const requireNotSeller = async (to) => {
  const auth = await ready()
  if (!auth.isLoggedIn) return toLogin(to)
  await auth.refreshProfile()
  if (auth.isAdmin) return '/admin'
  if (auth.isSeller) return '/seller'
  return true
}

const requireAdmin = async (to) => {
  const auth = await ready()
  if (!auth.isLoggedIn) return toLogin(to)
  if (!auth.isAdmin) return '/'
  return true
}

const guestOnly = async () => {
  const auth = await ready()
  if (auth.isLoggedIn) return auth.isAdmin ? '/admin' : '/'
  return true
}

const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    beforeEnter: async () => {
      await ready()
      return true
    },
    children: [
      { path: '', component: () => import('../pages/IndexPage.vue') },
      { path: 'product/:id', component: () => import('../pages/ProductPage.vue') },
      { path: 'shop/:id', component: () => import('../pages/ShopPage.vue') },

      { path: 'login', component: () => import('../pages/AuthPage.vue'), beforeEnter: guestOnly },
      { path: 'register', component: () => import('../pages/AuthPage.vue'), beforeEnter: guestOnly },

      { path: 'profile', component: () => import('../pages/ProfilePage.vue'), beforeEnter: requireAuth },
      { path: 'cart', component: () => import('../pages/CartPage.vue'), beforeEnter: requireAuth },
      { path: 'wishlist', component: () => import('../pages/WishlistPage.vue'), beforeEnter: requireAuth },
      { path: 'checkout', component: () => import('../pages/CheckoutPage.vue'), beforeEnter: requireAuth },
      { path: 'success/:id', component: () => import('../pages/SuccessPage.vue'), beforeEnter: requireAuth },
      { path: 'orders', component: () => import('../pages/OrdersPage.vue'), beforeEnter: requireAuth },

      { path: 'seller', component: () => import('../pages/SellerPage.vue'), beforeEnter: requireSeller },
      { path: 'seller/open', component: () => import('../pages/OpenShopPage.vue'), beforeEnter: requireNotSeller },

      { path: 'admin', component: () => import('../pages/AdminPage.vue'), beforeEnter: requireAdmin },
    ],
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue'),
  },
]

export default routes
