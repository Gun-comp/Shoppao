<template>
  <q-page class="q-pb-xl">
    <div class="sp-container q-pt-lg">
      <div class="text-h5 text-weight-bold q-mb-md">
        รายการที่ถูกใจ
        <span class="text-caption text-grey-6">({{ items.length }} รายการ)</span>
      </div>

      <div v-if="items.length" class="row q-col-gutter-md">
        <div v-for="p in items" :key="p.id" class="col-6 col-sm-4 col-md-3">
          <ProductCard :product="p" />
        </div>
      </div>

      <div v-else class="sp-card text-center q-py-xl">
        <q-icon name="favorite_border" size="72px" color="grey-5" />
        <div class="text-h6 q-mt-md">ยังไม่มีสินค้าที่ถูกใจ</div>
        <div class="text-grey-6">กดรูปหัวใจที่สินค้าเพื่อเก็บไว้ดูทีหลัง</div>
        <q-btn unelevated rounded class="sp-gradient-btn q-mt-lg" label="ไปเลือกสินค้า" to="/" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import { getProductById } from '../stores/product'
import { useWishlistStore } from '../stores/wishlist'

const wishlist = useWishlistStore()
const items = computed(() => wishlist.ids.map((id) => getProductById(id)).filter(Boolean))
</script>
