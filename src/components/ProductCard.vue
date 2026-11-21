<template>
  <div class="sp-card product-card cursor-pointer" @click="openDetail">
    <div class="img-wrap">
      <q-img :src="product.image" :ratio="1" class="product-img" :class="{ dim: soldOut }">
        <template #loading>
          <q-skeleton width="100%" height="100%" square />
        </template>
      </q-img>

      <q-chip v-if="discount && !soldOut" dense color="accent" text-color="white" class="discount-chip">
        -{{ discount }}%
      </q-chip>

      <div v-if="soldOut" class="soldout-badge">สินค้าหมด</div>

      <q-btn
        round
        dense
        unelevated
        class="heart-btn"
        :class="{ 'is-liked': liked }"
        :icon="liked ? 'favorite' : 'favorite_border'"
        @click.stop="toggleLike"
      />
    </div>

    <div class="q-pa-md">
      <div class="product-name">{{ product.name }}</div>

      <div class="row items-center q-mt-xs text-caption text-grey-7">
        <q-icon name="star" color="warning" size="16px" />
        <span class="q-ml-xs">{{ product.rating || 'ใหม่' }}</span>
        <span class="q-mx-xs">·</span>
        <span>ขายแล้ว {{ product.sold.toLocaleString() }}</span>
      </div>

      <div class="row items-end justify-between q-mt-sm">
        <div>
          <div class="price">฿{{ product.price.toLocaleString() }}</div>
          <div v-if="product.oldPrice" class="old-price">฿{{ product.oldPrice.toLocaleString() }}</div>
        </div>

        <q-btn
          round
          unelevated
          icon="add_shopping_cart"
          class="sp-gradient-btn"
          :disable="soldOut"
          @click.stop="addToCart"
        >
          <q-tooltip>{{ soldOut ? 'สินค้าหมด' : 'ใส่ตะกร้า' }}</q-tooltip>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { useRequireLogin } from '../composables/useRequireLogin'

const props = defineProps({
  product: { type: Object, required: true },
})

const $q = useQuasar()
const router = useRouter()
const cart = useCartStore()
const wishlist = useWishlistStore()
const requireLogin = useRequireLogin()

const liked = computed(() => wishlist.has(props.product.id))
const soldOut = computed(() => (props.product.stock ?? 1) <= 0)

const discount = computed(() => {
  const { price, oldPrice } = props.product
  return oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0
})

function openDetail() {
  router.push(`/product/${props.product.id}`)
}

function toggleLike() {
  if (!requireLogin('เข้าสู่ระบบก่อนกดถูกใจนะ')) return
  const added = wishlist.toggle(props.product.id)
  $q.notify({
    message: added ? 'เพิ่มในรายการที่ถูกใจแล้ว' : 'นำออกจากรายการที่ถูกใจแล้ว',
    icon: added ? 'favorite' : 'heart_broken',
    color: added ? 'accent' : 'grey-8',
    position: 'top',
    timeout: 1200,
  })
}

function addToCart() {
  if (!requireLogin('เข้าสู่ระบบก่อนใส่ตะกร้านะ')) return
  const res = cart.add(props.product.id)
  if (!res.ok) {
    $q.notify({ message: res.message, icon: 'error', color: 'negative', position: 'top', timeout: 1800 })
    return
  }
  $q.notify({
    message: 'ใส่ตะกร้าเรียบร้อย',
    caption: props.product.name,
    icon: 'check_circle',
    color: 'positive',
    position: 'top',
    timeout: 1500,
  })
}
</script>

<style lang="scss" scoped>
.product-card {
  overflow: hidden;
  animation: card-in 0.5s var(--ease) backwards;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.img-wrap {
  position: relative;
  overflow: hidden;
}

.product-img {
  transition: transform 0.4s ease;

  &.dim {
    filter: grayscale(0.8) brightness(0.8);
  }
}

.product-card:hover .product-img {
  transform: scale(1.06);
}

.discount-chip {
  position: absolute;
  top: 10px;
  left: 6px;
  font-weight: 600;
}

.soldout-badge {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 20px;
  border-radius: 999px;
  font-weight: 600;
  pointer-events: none;
}

.heart-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: #999;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.15);
  }

  &.is-liked {
    color: #ff4d6d;
    animation: pop 0.35s ease;
  }
}

@keyframes pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.4); }
  100% { transform: scale(1); }
}

.product-name {
  font-weight: 500;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.price {
  font-size: 20px;
  font-weight: 700;
  color: var(--q-primary);
}

.old-price {
  font-size: 12px;
  color: #aaa;
  text-decoration: line-through;
}
</style>
