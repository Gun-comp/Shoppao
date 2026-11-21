<template>
  <q-layout view="hHh lpR fFf">
    <q-header class="sp-header" height-hint="64">
      <div class="sp-container">
        <q-toolbar class="q-px-none" style="min-height: 68px">
          <router-link to="/" class="sp-logo">
            <q-icon name="storefront" size="30px" />
            <span>Shoppao</span>
          </router-link>

          <q-input
            v-model="search"
            dense
            rounded
            outlined
            bg-color="white"
            input-class="text-grey-9"
            placeholder="ค้นหาสินค้าที่คุณชอบ..."
            class="sp-search gt-xs"
            @keyup.enter="goSearch"
          >
            <template #append>
              <q-icon
                v-if="search"
                name="close"
                size="18px"
                class="cursor-pointer q-mr-xs text-grey-6"
                @click="search = ''; goSearch()"
              />
              <q-icon name="search" class="cursor-pointer" color="primary" @click="goSearch" />
            </template>
          </q-input>

          <q-space />

          <q-btn flat round dense icon="favorite_border" to="/wishlist" class="q-mr-xs">
            <q-badge v-if="wishlist.count" color="white" text-color="primary" floating rounded>
              {{ wishlist.count }}
            </q-badge>
            <q-tooltip>รายการที่ถูกใจ</q-tooltip>
          </q-btn>

          <q-btn flat round dense icon="shopping_bag" to="/cart" class="q-mr-xs">
            <q-badge v-if="cart.totalQty" color="white" text-color="primary" floating rounded>
              {{ cart.totalQty }}
            </q-badge>
            <q-tooltip>ตะกร้าสินค้า</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
            @click="$q.dark.toggle()"
          >
            <q-tooltip>สลับโหมดสว่าง/มืด</q-tooltip>
          </q-btn>

          <q-btn
            v-if="!auth.isLoggedIn"
            unelevated
            rounded
            color="white"
            text-color="primary"
            label="เข้าสู่ระบบ"
            to="/login"
            class="q-ml-sm"
          />

          <q-btn v-else flat round dense class="q-ml-sm">
            <q-avatar size="34px" color="white" text-color="primary" class="text-weight-bold">
              <img v-if="auth.user.avatar" :src="auth.user.avatar" />
              <span v-else>{{ auth.user.name.charAt(0).toUpperCase() }}</span>
            </q-avatar>

            <q-menu anchor="bottom right" self="top right" style="border-radius: 16px">
              <q-list style="min-width: 240px">
                <q-item>
                  <q-item-section>
                    <q-item-label class="text-weight-bold">{{ auth.user.name }}</q-item-label>
                    <q-item-label caption>{{ auth.user.email }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-chip dense :color="roleInfo.color" text-color="white">
                      {{ roleInfo.label }}
                    </q-chip>
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item v-close-popup clickable to="/profile">
                  <q-item-section avatar><q-icon name="account_circle" color="primary" /></q-item-section>
                  <q-item-section>โปรไฟล์ของฉัน</q-item-section>
                </q-item>

                <q-item v-close-popup clickable to="/orders">
                  <q-item-section avatar><q-icon name="receipt_long" /></q-item-section>
                  <q-item-section>คำสั่งซื้อของฉัน</q-item-section>
                </q-item>

                <q-item v-if="auth.isAdmin" v-close-popup clickable to="/admin">
                  <q-item-section avatar><q-icon name="admin_panel_settings" color="primary" /></q-item-section>
                  <q-item-section>แผงควบคุมแอดมิน</q-item-section>
                </q-item>
                <q-item v-else-if="auth.isSeller" v-close-popup clickable to="/seller">
                  <q-item-section avatar><q-icon name="storefront" color="primary" /></q-item-section>
                  <q-item-section>ร้านค้าของฉัน</q-item-section>
                </q-item>
                <q-item v-else v-close-popup clickable to="/seller/open">
                  <q-item-section avatar><q-icon name="add_business" color="primary" /></q-item-section>
                  <q-item-section>
                    {{ myShop?.status === 'pending' ? 'คำขอเปิดร้าน (รออนุมัติ)' : 'สมัครเปิดร้านค้า' }}
                  </q-item-section>
                </q-item>

                <q-separator />

                <q-item v-close-popup clickable @click="logout">
                  <q-item-section avatar><q-icon name="logout" color="negative" /></q-item-section>
                  <q-item-section class="text-negative">ออกจากระบบ</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </q-toolbar>

        <div class="lt-sm q-pb-sm">
          <q-input
            v-model="search"
            dense
            rounded
            outlined
            bg-color="white"
            input-class="text-grey-9"
            placeholder="ค้นหาสินค้า..."
            @keyup.enter="goSearch"
          >
            <template #append>
              <q-icon name="search" color="primary" @click="goSearch" />
            </template>
          </q-input>
        </div>
      </div>
    </q-header>

    <q-page-container>
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </q-page-container>

    <footer class="sp-footer">
      <div class="sp-container text-center">
        <div class="text-h6 text-weight-bold">Shoppao</div>
        <div class="text-caption q-mt-xs" style="opacity: 0.7">
          เว็บไซต์ตัวอย่างเพื่อการศึกษา ไม่มีการซื้อขายจริง
        </div>
      </div>
    </footer>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { useAuthStore } from '../stores/auth'
import { useShopStore } from '../stores/shop'
import { useProductStore } from '../stores/product'
import { useOrderStore } from '../stores/order'

const router = useRouter()
const $q = useQuasar()
const cart = useCartStore()
const wishlist = useWishlistStore()
const auth = useAuthStore()
const shopStore = useShopStore()
const productStore = useProductStore()
const orderStore = useOrderStore()
const search = ref('')

const myShop = computed(() => shopStore.byOwner(auth.user?.id))

const roleInfo = computed(() => {
  if (auth.isAdmin) return { label: 'แอดมิน', color: 'negative' }
  if (auth.isSeller) return { label: 'ผู้ขาย', color: 'accent' }
  return { label: 'ผู้ซื้อ', color: 'grey-6' }
})

watch(
  () => auth.currentId,
  async (id) => {
    if (id) await auth.refreshProfile()
    await Promise.all([
      shopStore.load(),
      productStore.load(),
      cart.load(),
      wishlist.load(),
      orderStore.load(),
    ])
  },
  { immediate: true },
)

function goSearch() {
  router.push({ path: '/', query: search.value ? { q: search.value } : {} })
}

async function logout() {
  await auth.logout()
  $q.notify?.({
    message: 'ออกจากระบบแล้ว',
    icon: 'logout',
    color: 'grey-8',
    position: 'top',
    timeout: 1200,
  })
  router.push('/')
}
</script>

<style lang="scss" scoped>
.sp-header {
  background: var(--sp-gradient);
  box-shadow: 0 4px 20px rgba(255, 122, 69, 0.3);
}

.sp-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  text-decoration: none;
  font-size: 24px;
  font-weight: 700;
  margin-right: 24px;
}

.sp-search {
  width: 100%;
  max-width: 480px;

  :deep(.q-field__control) {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  }
  :deep(.q-field__control:before),
  :deep(.q-field__control:after) {
    border: none !important;
  }
  :deep(input::placeholder) {
    color: #9e9e9e;
    opacity: 1;
  }
}

.sp-footer {
  margin-top: 64px;
  padding: 32px 0;
  background: #2b2320;
  color: white;
}
</style>