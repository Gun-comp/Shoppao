import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from '../stores/auth'

export function useRequireLogin() {
  const auth = useAuthStore()
  const router = useRouter()
  const route = useRoute()
  const $q = useQuasar()

  return function requireLogin(message = 'กรุณาเข้าสู่ระบบก่อนนะ') {
    if (auth.isLoggedIn) return true
    $q.notify({ message, icon: 'lock', color: 'warning', textColor: 'dark', position: 'top', timeout: 1800 })
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return false
  }
}
