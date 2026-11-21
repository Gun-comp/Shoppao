<template>
  <q-page class="q-pb-xl">
    <div class="sp-container q-pt-lg">
      <div v-if="!shopStore.loaded" class="text-center q-py-xl"><q-spinner color="primary" size="40px" /></div>

      <div v-else-if="shop">
        <div class="shop-hero" :style="heroStyle">
          <div class="row items-center no-wrap" style="position: relative; z-index: 1">
            <q-avatar size="88px" color="white" text-color="primary" class="text-h3 text-weight-bold logo-ring">
              <img v-if="shop.logo" :src="shop.logo" />
              <span v-else>{{ shop.name.charAt(0).toUpperCase() }}</span>
            </q-avatar>
            <div class="q-ml-lg">
              <div class="text-h5 text-weight-bold">{{ shop.name }}</div>
              <div style="opacity: 0.95">{{ shop.description }}</div>
              <div class="row q-gutter-md q-mt-sm text-caption">
                <span><q-icon name="inventory_2" /> สินค้า {{ list.length }} รายการ</span>
                <span><q-icon name="event" /> เปิดร้านเมื่อ {{ opened }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="row items-center justify-between q-mt-xl q-mb-md">
          <div class="text-h6 text-weight-bold">สินค้าทั้งหมดของร้าน</div>
          <q-select v-model="sortBy" :options="sortOptions" emit-value map-options dense outlined rounded style="min-width: 170px" />
        </div>

        <div v-if="sorted.length" class="row q-col-gutter-md">
          <div v-for="p in sorted" :key="p.id" class="col-6 col-sm-4 col-md-3">
            <ProductCard :product="p" />
          </div>
        </div>
        <div v-else class="text-center q-py-xl text-grey-6">
          <q-icon name="inventory_2" size="64px" />
          <div class="q-mt-sm">ร้านนี้ยังไม่มีสินค้า</div>
        </div>
      </div>

      <div v-else class="text-center q-py-xl text-grey-6">
        <q-icon name="storefront" size="64px" />
        <div class="q-mt-sm">ไม่พบร้านค้านี้ หรือร้านถูกปิดแล้ว</div>
        <q-btn flat color="primary" label="กลับหน้าแรก" to="/" class="q-mt-md" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import { useShopStore } from '../stores/shop'
import { useProductStore } from '../stores/product'

const route = useRoute()
const shopStore = useShopStore()
const productStore = useProductStore()

const sortBy = ref('new')
const sortOptions = [
  { label: 'ล่าสุด', value: 'new' },
  { label: 'ยอดนิยม', value: 'popular' },
  { label: 'ราคาต่ำ → สูง', value: 'priceAsc' },
  { label: 'ราคาสูง → ต่ำ', value: 'priceDesc' },
]

const shop = computed(() => shopStore.approved.find((s) => s.id === route.params.id) || null)
const opened = computed(() => new Date(shop.value.createdAt).toLocaleDateString('th-TH', { dateStyle: 'medium' }))
const list = computed(() => (shop.value ? productStore.byShop(shop.value.id) : []))

// มีภาพปกให้ซ้อนชั้นมืดเพื่อให้อ่านตัวอักษรออก
const heroStyle = computed(() =>
  shop.value?.cover
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.55)), url(${shop.value.cover})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {},
)

const sorted = computed(() => {
  const l = [...list.value]
  if (sortBy.value === 'popular') l.sort((a, b) => b.sold - a.sold)
  if (sortBy.value === 'priceAsc') l.sort((a, b) => a.price - b.price)
  if (sortBy.value === 'priceDesc') l.sort((a, b) => b.price - a.price)
  return l
})
</script>

<style lang="scss" scoped>
.shop-hero {
  position: relative;
  overflow: hidden;
  background: var(--sp-gradient);
  color: white;
  border-radius: 28px;
  padding: 56px 40px;
  box-shadow: 0 16px 40px rgba(255, 77, 109, 0.25);
}

.logo-ring {
  border: 4px solid rgba(255, 255, 255, 0.9);
}

@media (max-width: 600px) {
  .shop-hero {
    padding: 32px 24px;
  }
}
</style>
