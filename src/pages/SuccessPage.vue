<template>
  <q-page class="q-pb-xl">
    <div class="sp-container q-pt-xl" style="max-width: 560px">
      <div v-if="!orderStore.loaded" class="text-center q-py-xl"><q-spinner color="primary" size="40px" /></div>

      <div v-else-if="orders.length" class="sp-card q-pa-xl text-center">
        <q-icon name="check_circle" color="positive" size="96px" class="pop" />
        <div class="text-h5 text-weight-bold q-mt-md">สั่งซื้อสำเร็จ!</div>
        <div class="text-grey-6 q-mt-xs">ขอบคุณที่ช้อปกับ Shoppao</div>

        <div class="info q-mt-lg text-left">
          <div v-for="o in orders" :key="o.id" class="q-mb-md">
            <div class="row justify-between">
              <span class="text-weight-bold">{{ shopName(o.shopId) }}</span>
              <span class="text-primary text-weight-bold">฿{{ o.total.toLocaleString() }}</span>
            </div>
            <div class="text-caption text-grey-7">เลขที่ {{ o.code }}</div>
          </div>

          <q-separator class="q-my-sm" />
          <div class="row justify-between q-mb-xs">
            <span class="text-grey-7">ชำระโดย</span>
            <span>{{ orders[0].payment }}</span>
          </div>
          <div class="row justify-between q-mb-xs">
            <span class="text-grey-7">ยอดรวมทั้งหมด</span>
            <span class="text-primary text-weight-bold">฿{{ grand.toLocaleString() }}</span>
          </div>
          <div class="row justify-between">
            <span class="text-grey-7">จัดส่งถึง</span>
            <span class="text-right" style="max-width: 60%">{{ orders[0].address.name }}</span>
          </div>
        </div>

        <div class="row q-gutter-md justify-center q-mt-xl">
          <q-btn outline rounded color="primary" label="ติดตามคำสั่งซื้อ" to="/orders" />
          <q-btn unelevated rounded class="sp-gradient-btn" label="ช้อปต่อ" to="/" />
        </div>
      </div>

      <div v-else class="text-center q-py-xl text-grey-6">
        <q-icon name="search_off" size="64px" />
        <div class="q-mt-sm">ไม่พบคำสั่งซื้อนี้</div>
        <q-btn flat color="primary" label="กลับหน้าแรก" to="/" class="q-mt-md" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useOrderStore } from '../stores/order'
import { getShop } from '../stores/product'

const route = useRoute()
const orderStore = useOrderStore()

onMounted(() => {
  if (!orderStore.loaded) orderStore.load()
})

const shopName = (id) => getShop(id)?.name || 'ร้านค้า'

const orders = computed(() => {
  const ids = String(route.params.id).split('_')
  return ids.map((id) => orderStore.orders.find((o) => o.id === id)).filter(Boolean)
})
const grand = computed(() => orders.value.reduce((s, o) => s + o.total, 0))
</script>

<style lang="scss" scoped>
.info {
  background: rgba(255, 122, 69, 0.08);
  border-radius: 16px;
  padding: 16px 20px;
}

.pop {
  animation: pop 0.5s ease;
}

@keyframes pop {
  0% { transform: scale(0); }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>
