<template>
  <q-page class="auth-page flex flex-center q-pa-md">
    <div class="auth-card row no-wrap">
      <!-- ฝั่งซ้าย: แบรนด์ -->
      <div class="brand-panel gt-xs col-5">
        <div class="circle c1"></div>
        <div class="circle c2"></div>
        <div class="circle c3"></div>

        <div class="brand-content">
          <div class="row items-center q-mb-xl">
            <q-icon name="storefront" size="36px" />
            <span class="text-h5 text-weight-bold q-ml-sm">Shoppao</span>
          </div>

          <div class="brand-title">
            {{ tab === 'login' ? 'ยินดีต้อนรับกลับมา!' : 'เริ่มต้นช้อปกับเรา' }}
          </div>
          <div class="brand-sub q-mt-sm">
            {{
              tab === 'login'
                ? 'เข้าสู่ระบบเพื่อดูตะกร้า รายการที่ถูกใจ และคำสั่งซื้อของคุณ'
                : 'สมัครฟรีใน 1 นาที แล้วเปิดร้านของคุณเองได้ทุกเมื่อ'
            }}
          </div>

          <div class="q-mt-xl column q-gutter-md">
            <div v-for="f in features" :key="f.text" class="row items-center no-wrap">
              <div class="feature-icon">
                <q-icon :name="f.icon" size="20px" />
              </div>
              <span class="q-ml-md">{{ f.text }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ฝั่งขวา: ฟอร์ม -->
      <div class="form-panel col-12 col-sm-7">
        <div class="lt-sm text-center q-mb-md">
          <q-icon name="storefront" size="44px" color="primary" />
          <div class="text-h6 text-weight-bold">Shoppao</div>
        </div>

        <div class="text-h5 text-weight-bold">
          {{ tab === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่' }}
        </div>
        <div class="text-grey-6 q-mb-lg">
          {{ tab === 'login' ? 'กรอกอีเมลและรหัสผ่านของคุณ' : 'กรอกข้อมูลด้านล่างเพื่อสมัครสมาชิก' }}
        </div>

        <div class="segmented q-mb-lg">
          <div class="seg-slider" :class="{ right: tab === 'register' }"></div>
          <button type="button" class="seg-btn" :class="{ active: tab === 'login' }" @click="tab = 'login'">
            เข้าสู่ระบบ
          </button>
          <button type="button" class="seg-btn" :class="{ active: tab === 'register' }" @click="tab = 'register'">
            สมัครสมาชิก
          </button>
        </div>

        <transition name="fade" mode="out-in">
          <!-- เข้าสู่ระบบ -->
          <q-form v-if="tab === 'login'" key="login" class="q-gutter-y-md" @submit.prevent="onLogin">
            <q-input
              v-model="loginForm.email"
              outlined
              rounded
              type="email"
              label="อีเมล"
              :rules="[req]"
              hide-bottom-space
            >
              <template #prepend><q-icon name="mail_outline" color="primary" /></template>
            </q-input>

            <q-input
              v-model="loginForm.password"
              outlined
              rounded
              :type="showPw ? 'text' : 'password'"
              label="รหัสผ่าน"
              :rules="[req]"
              hide-bottom-space
            >
              <template #prepend><q-icon name="lock_outline" color="primary" /></template>
              <template #append>
                <q-icon
                  :name="showPw ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPw = !showPw"
                />
              </template>
            </q-input>

            <q-btn
              type="submit"
              unelevated
              rounded
              size="lg"
              class="sp-gradient-btn full-width submit-btn"
              label="เข้าสู่ระบบ"
              :loading="loading"
            />

            <div class="text-center text-grey-6 text-body2">
              ยังไม่มีบัญชี?
              <a class="link" @click="tab = 'register'">สมัครสมาชิกเลย</a>
            </div>
          </q-form>

          <!-- สมัครสมาชิก -->
          <q-form v-else key="register" class="q-gutter-y-md" @submit.prevent="onRegister">
            <q-input v-model="regForm.name" outlined rounded label="ชื่อที่แสดง" :rules="[req]" hide-bottom-space>
              <template #prepend><q-icon name="person_outline" color="primary" /></template>
            </q-input>

            <q-input
              v-model="regForm.email"
              outlined
              rounded
              type="email"
              label="อีเมล"
              :rules="[req, (v) => /.+@.+\..+/.test(v) || 'รูปแบบอีเมลไม่ถูกต้อง']"
              hide-bottom-space
            >
              <template #prepend><q-icon name="mail_outline" color="primary" /></template>
            </q-input>

            <q-input
              v-model="regForm.password"
              outlined
              rounded
              :type="showPw ? 'text' : 'password'"
              label="รหัสผ่าน (อย่างน้อย 6 ตัว)"
              :rules="[req, (v) => v.length >= 6 || 'รหัสผ่านสั้นเกินไป']"
              hide-bottom-space
            >
              <template #prepend><q-icon name="lock_outline" color="primary" /></template>
              <template #append>
                <q-icon
                  :name="showPw ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPw = !showPw"
                />
              </template>
            </q-input>

            <q-input
              v-model="regForm.confirm"
              outlined
              rounded
              :type="showPw ? 'text' : 'password'"
              label="ยืนยันรหัสผ่าน"
              :rules="[req, (v) => v === regForm.password || 'รหัสผ่านไม่ตรงกัน']"
              hide-bottom-space
            >
              <template #prepend><q-icon name="verified_user" color="primary" /></template>
            </q-input>

            <q-btn
              type="submit"
              unelevated
              rounded
              size="lg"
              class="sp-gradient-btn full-width submit-btn"
              label="สมัครสมาชิก"
              :loading="loading"
            />

            <div class="text-center text-grey-6 text-body2">
              มีบัญชีอยู่แล้ว?
              <a class="link" @click="tab = 'login'">เข้าสู่ระบบ</a>
            </div>
          </q-form>
        </transition>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar, Notify } from 'quasar'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()

const tab = ref(route.path === '/register' ? 'register' : 'login')
const showPw = ref(false)
const loading = ref(false)
const loginForm = reactive({ email: '', password: '' })
const regForm = reactive({ name: '', email: '', password: '', confirm: '' })

const features = [
  { icon: 'favorite', text: 'เก็บสินค้าที่ถูกใจไว้ดูทีหลัง' },
  { icon: 'local_shipping', text: 'สั่งซื้อง่าย ติดตามออเดอร์ได้' },
  { icon: 'storefront', text: 'เปิดร้านของคุณเองได้ฟรี' },
]

const req = (v) => !!v || 'กรุณากรอกข้อมูล'

function showPopup(opts) {
  if (typeof $q.notify === 'function') {
    $q.notify(opts)
  } else if (typeof Notify?.create === 'function') {
    Notify.create(opts)
  } else {
    alert(opts.message)
  }
}

function fail(message) {
  showPopup({ message, icon: 'error', color: 'negative', position: 'top', timeout: 2500 })
}

async function onLogin() {
  loading.value = true
  try {
    const res = await auth.login(loginForm)
    if (!res.ok) {
      fail(res.message)
      return
    }

    showPopup({
      message: `ยินดีต้อนรับกลับมา ${auth.user?.name || ''}`,
      icon: 'check_circle',
      color: 'positive',
      position: 'top',
      timeout: 1500,
    })

    const target = route.query.redirect?.toString() || (auth.isAdmin ? '/admin' : '/')
    await router.push(target)
  } catch (err) {
    console.error('LOGIN ERROR:', err)
    fail('เกิดข้อผิดพลาด: ' + err.message)
  } finally {
    loading.value = false
  }
}

async function onRegister() {
  loading.value = true
  try {
    const res = await auth.register(regForm)
    if (!res.ok) {
      fail(res.message)
      return
    }

    showPopup({
      message: 'สมัครสำเร็จ! กรุณาเข้าสู่ระบบ',
      icon: 'check_circle',
      color: 'positive',
      position: 'top',
      timeout: 2000,
    })

    loginForm.email = regForm.email.trim().toLowerCase()
    loginForm.password = ''
    Object.assign(regForm, { name: '', email: '', password: '', confirm: '' })
    tab.value = 'login'
  } catch (err) {
    console.error('REGISTER ERROR:', err)
    fail('เกิดข้อผิดพลาด: ' + err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.auth-page {
  min-height: calc(100vh - 84px);
  background: transparent;
}

.auth-card {
  width: 100%;
  max-width: 900px;
  min-height: 620px;
  background: var(--sp-card, #ffffff);
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid rgba(255, 122, 69, 0.14);
  box-shadow: 0 20px 50px rgba(255, 122, 69, 0.16);
}

.brand-panel {
  position: relative;
  background: var(--sp-gradient);
  color: white;
  padding: 48px 36px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.brand-content {
  position: relative;
  z-index: 2;
}

.brand-title {
  font-size: 30px;
  font-weight: 700;
  line-height: 1.3;
}

.brand-sub {
  opacity: 0.9;
  line-height: 1.6;
}

.feature-icon {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.14);
  animation: float 7s ease-in-out infinite;
}
.c1 {
  width: 220px;
  height: 220px;
  top: -70px;
  right: -70px;
}
.c2 {
  width: 150px;
  height: 150px;
  bottom: 40px;
  left: -50px;
  animation-delay: -2s;
}
.c3 {
  width: 90px;
  height: 90px;
  bottom: -20px;
  right: 50px;
  animation-delay: -4s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-18px);
  }
}

.form-panel {
  padding: 56px 44px 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.segmented {
  position: relative;
  display: flex;
  background: rgba(255, 122, 69, 0.1);
  border-radius: 999px;
  padding: 4px;
}

.seg-slider {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: var(--sp-gradient);
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(255, 122, 69, 0.4);
  transition: transform 0.3s ease;

  &.right {
    transform: translateX(100%);
  }
}

.seg-btn {
  position: relative;
  z-index: 1;
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 0;
  font-family: 'Prompt', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #888;
  cursor: pointer;
  transition: color 0.3s ease;

  &.active {
    color: white;
  }
}

.submit-btn {
  box-shadow: 0 8px 20px rgba(255, 77, 109, 0.3);
}

.link {
  color: var(--q-primary);
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

@media (max-width: 599px) {
  .auth-page {
    min-height: calc(100vh - 128px);
  }
}

@media (max-width: 600px) {
  .auth-card {
    border-radius: 24px;
    min-height: auto;
  }
  .form-panel {
    padding: 32px 24px;
  }
}
</style>