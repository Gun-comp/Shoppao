<template>
  <q-page class="q-pb-xl">
    <div class="sp-container q-pt-lg">
      <div v-if="!productStore.loaded" class="text-center q-py-xl">
        <q-spinner color="primary" size="40px" />
      </div>

      <div v-else-if="product">
        <q-breadcrumbs class="q-mb-md text-grey-7">
          <q-breadcrumbs-el label="หน้าแรก" to="/" />
          <q-breadcrumbs-el :label="categoryName" />
          <q-breadcrumbs-el :label="product.name" />
        </q-breadcrumbs>

        <div class="sp-card q-pa-md q-pa-lg-lg">
          <div class="row q-col-gutter-xl">
            <!-- แกลเลอรี -->
            <div class="col-12 col-md-5">
              <div class="gallery-main">
                <q-img :key="current" :src="current" :ratio="1" style="border-radius: 20px">
                  <template #loading>
                    <q-skeleton width="100%" height="100%" square />
                  </template>
                </q-img>
                <template v-if="gallery.length > 1">
                  <q-btn round dense unelevated color="white" text-color="primary" icon="chevron_left" class="nav-btn left" @click="prev" />
                  <q-btn round dense unelevated color="white" text-color="primary" icon="chevron_right" class="nav-btn right" @click="next" />
                  <div class="counter">{{ idx + 1 }} / {{ gallery.length }}</div>
                </template>
              </div>

              <div v-if="gallery.length > 1" class="row q-gutter-sm q-mt-sm">
                <div
                  v-for="(g, i) in gallery"
                  :key="g"
                  class="thumb cursor-pointer"
                  :class="{ active: i === idx }"
                  @click="idx = i"
                >
                  <q-img :src="g" :ratio="1" style="border-radius: 10px" />
                </div>
              </div>
            </div>

            <div class="col-12 col-md-7">
              <div class="text-h5 text-weight-bold">{{ product.name }}</div>

              <div class="row items-center q-mt-sm text-grey-7">
                <q-rating :model-value="product.rating" readonly size="18px" color="warning" />
                <span class="q-ml-sm">{{ product.rating || 'ยังไม่มีรีวิว' }}</span>
                <span v-if="product.reviewCount" class="q-ml-xs">({{ product.reviewCount }} รีวิว)</span>
                <span class="q-mx-sm">|</span>
                <span>ขายแล้ว {{ product.sold.toLocaleString() }} ชิ้น</span>
              </div>

              <div class="price-box q-mt-md">
                <span class="price">฿{{ product.price.toLocaleString() }}</span>
                <span v-if="product.oldPrice" class="old-price q-ml-md">
                  ฿{{ product.oldPrice.toLocaleString() }}
                </span>
                <q-chip v-if="discount" dense color="accent" text-color="white" class="q-ml-md">
                  ลด {{ discount }}%
                </q-chip>
              </div>

              <div class="q-mt-lg text-grey-8" style="line-height: 1.7">
                {{ product.description }}
              </div>

              <div class="row items-center q-mt-lg">
                <div class="text-grey-7 q-mr-md">จำนวน</div>
                <div class="qty-box row items-center">
                  <q-btn flat round dense icon="remove" :disable="soldOut" @click="qty > 1 && qty--" />
                  <div class="qty-num">{{ soldOut ? 0 : qty }}</div>
                  <q-btn flat round dense icon="add" :disable="soldOut || qty >= product.stock" @click="qty++" />
                </div>
                <div class="text-caption q-ml-md" :class="soldOut ? 'text-negative' : 'text-grey-6'">
                  {{ soldOut ? 'สินค้าหมด' : `มีสินค้า ${product.stock} ชิ้น` }}
                </div>
              </div>

              <div class="row q-gutter-md q-mt-lg">
                <q-btn
                  unelevated
                  rounded
                  size="lg"
                  icon="add_shopping_cart"
                  label="ใส่ตะกร้า"
                  color="primary"
                  outline
                  :disable="soldOut"
                  @click="addToCart"
                />
                <q-btn
                  unelevated
                  rounded
                  size="lg"
                  label="ซื้อเลย"
                  class="sp-gradient-btn"
                  :disable="soldOut"
                  @click="buyNow"
                />
                <q-btn
                  round
                  outline
                  size="lg"
                  :color="liked ? 'accent' : 'grey-5'"
                  :icon="liked ? 'favorite' : 'favorite_border'"
                  @click="toggleLike"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- ร้านค้า -->
        <div v-if="shop" class="sp-card q-pa-md q-mt-md">
          <div class="row items-center no-wrap">
            <q-avatar size="56px" class="sp-gradient-btn text-h6 text-weight-bold">
              <img v-if="shop.logo" :src="shop.logo" />
              <span v-else>{{ shop.name.charAt(0).toUpperCase() }}</span>
            </q-avatar>
            <div class="col q-px-md">
              <div class="text-weight-bold">{{ shop.name }}</div>
              <div class="text-caption text-grey-6 ellipsis">{{ shop.description }}</div>
            </div>
            <q-btn outline rounded color="primary" icon="storefront" label="ดูร้านค้า" :to="`/shop/${shop.id}`" />
          </div>
        </div>

        <!-- รีวิว -->
        <div class="sp-card q-pa-lg q-mt-md">
          <div class="text-h6 text-weight-bold q-mb-md">รีวิวจากผู้ซื้อ</div>

          <div v-if="stats.count" class="row q-col-gutter-lg items-center q-mb-md">
            <div class="col-12 col-sm-4 text-center">
              <div class="avg">{{ stats.avg }}</div>
              <q-rating :model-value="stats.avg" readonly size="22px" color="warning" />
              <div class="text-caption text-grey-6 q-mt-xs">{{ stats.count }} รีวิว</div>
            </div>
            <div class="col-12 col-sm-8">
              <div v-for="n in [5, 4, 3, 2, 1]" :key="n" class="row items-center no-wrap q-mb-xs">
                <span class="text-caption" style="width: 40px">{{ n }} ดาว</span>
                <q-linear-progress
                  :value="stats.count ? stats.dist[n] / stats.count : 0"
                  color="warning"
                  rounded
                  size="8px"
                  class="col q-mx-sm"
                />
                <span class="text-caption text-grey-6" style="width: 28px; text-align: right">{{ stats.dist[n] }}</span>
              </div>
            </div>
          </div>

          <div v-if="stats.count" class="q-mb-md">
            <q-btn-toggle
              v-model="starFilter"
              no-caps
              rounded
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              :options="filterOptions"
            />
          </div>

          <div v-if="shownReviews.length">
            <div v-for="r in shownReviews" :key="r.id" class="review q-py-md">
              <div class="row items-center no-wrap">
                <q-avatar size="38px" color="primary" text-color="white">
                  <img v-if="r.userAvatar" :src="r.userAvatar" />
                  <span v-else>{{ r.userName.charAt(0).toUpperCase() }}</span>
                </q-avatar>
                <div class="q-pl-sm">
                  <div class="text-weight-medium text-body2">{{ maskName(r.userName) }}</div>
                  <div class="row items-center">
                    <q-rating :model-value="r.rating" readonly size="14px" color="warning" />
                    <span class="text-caption text-grey-6 q-ml-sm">{{ fmt(r.createdAt) }}</span>
                  </div>
                </div>
              </div>
              <div v-if="r.comment" class="q-mt-sm" style="line-height: 1.6">{{ r.comment }}</div>

              <div v-if="r.reply" class="reply q-mt-sm q-pa-sm">
                <div class="text-caption text-weight-bold text-primary">
                  <q-icon name="storefront" /> การตอบกลับจากร้านค้า
                </div>
                <div class="text-body2">{{ r.reply }}</div>
              </div>

              <div v-if="canReply" class="q-mt-sm">
                <q-btn
                  flat
                  dense
                  no-caps
                  color="primary"
                  icon="reply"
                  :label="r.reply ? 'แก้ไขการตอบกลับ' : 'ตอบกลับรีวิว'"
                  @click="openReply(r)"
                />
              </div>
              <q-separator class="q-mt-md" />
            </div>
          </div>
          <div v-else class="text-center q-py-lg text-grey-6">
            <q-icon name="rate_review" size="48px" />
            <div class="q-mt-sm">
              {{ stats.count ? 'ไม่มีรีวิวในระดับดาวนี้' : 'ยังไม่มีรีวิว ซื้อสินค้าแล้วมารีวิวเป็นคนแรกได้เลย' }}
            </div>
          </div>
        </div>

        <!-- สินค้าจากร้านเดียวกัน -->
        <div v-if="fromShop.length" class="q-mt-xl">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6 text-weight-bold">สินค้าอื่นจากร้านเดียวกัน</div>
            <q-btn flat no-caps color="primary" label="ดูทั้งหมด" :to="`/shop/${product.shopId}`" />
          </div>
          <div class="row q-col-gutter-md">
            <div v-for="p in fromShop" :key="p.id" class="col-6 col-sm-4 col-md-3">
              <ProductCard :product="p" />
            </div>
          </div>
        </div>

        <!-- สินค้าใกล้เคียง -->
        <div v-if="similar.length" class="q-mt-xl">
          <div class="text-h6 text-weight-bold q-mb-md">สินค้าใกล้เคียง</div>
          <div class="row q-col-gutter-md">
            <div v-for="p in similar" :key="p.id" class="col-6 col-sm-4 col-md-3">
              <ProductCard :product="p" />
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center q-py-xl text-grey-6">
        <q-icon name="sentiment_dissatisfied" size="64px" />
        <div class="q-mt-sm">ไม่พบสินค้านี้</div>
        <q-btn flat color="primary" label="กลับหน้าแรก" to="/" class="q-mt-md" />
      </div>
    </div>

    <!-- ตอบกลับรีวิว -->
    <q-dialog v-model="replyOpen">
      <q-card style="width: 460px; max-width: 94vw; border-radius: 24px">
        <q-card-section>
          <div class="text-h6 text-weight-bold">ตอบกลับรีวิว</div>
          <q-input
            v-model="replyText"
            outlined
            type="textarea"
            rows="3"
            maxlength="300"
            counter
            class="q-mt-md"
            label="ข้อความตอบกลับ"
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat rounded label="ยกเลิก" @click="replyOpen = false" />
          <q-btn unelevated rounded class="sp-gradient-btn" label="ส่งตอบกลับ" :loading="replying" @click="sendReply" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import ProductCard from '../components/ProductCard.vue'
import { categories } from '../data/categories'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useWishlistStore } from '../stores/wishlist'
import { useReviewStore } from '../stores/review'
import { useProductStore, getShop } from '../stores/product'
import { useRequireLogin } from '../composables/useRequireLogin'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const reviewStore = useReviewStore()
const productStore = useProductStore()
const requireLogin = useRequireLogin()

const qty = ref(1)
const starFilter = ref(0)
const idx = ref(0)

const product = computed(() => productStore.byId(route.params.id))
const soldOut = computed(() => (product.value?.stock ?? 0) <= 0)
const shop = computed(() => (product.value ? getShop(product.value.shopId) : null))

// ----- แกลเลอรี -----
const gallery = computed(() => product.value?.gallery || [])
const current = computed(() => gallery.value[idx.value] || gallery.value[0] || '')
const next = () => (idx.value = (idx.value + 1) % gallery.value.length)
const prev = () => (idx.value = (idx.value - 1 + gallery.value.length) % gallery.value.length)

const categoryName = computed(
  () => categories.find((c) => c.id === product.value?.category)?.name || '',
)

const discount = computed(() => {
  if (!product.value?.oldPrice) return 0
  const { price, oldPrice } = product.value
  return Math.round(((oldPrice - price) / oldPrice) * 100)
})

const liked = computed(() => product.value && wishlist.has(product.value.id))

// ----- สินค้าที่เกี่ยวข้อง -----
const fromShop = computed(() =>
  product.value
    ? productStore.byShop(product.value.shopId).filter((p) => p.id !== product.value.id).slice(0, 4)
    : [],
)
const similar = computed(() => {
  const shopIds = new Set(fromShop.value.map((p) => p.id))
  return productStore.similar(product.value, 12).filter((p) => !shopIds.has(p.id)).slice(0, 4)
})

// ----- รีวิว -----
const stats = computed(() => reviewStore.stats(route.params.id))
const filterOptions = [
  { label: 'ทั้งหมด', value: 0 },
  { label: '5 ดาว', value: 5 },
  { label: '4 ดาว', value: 4 },
  { label: '3 ดาว', value: 3 },
  { label: '2 ดาว', value: 2 },
  { label: '1 ดาว', value: 1 },
]
const shownReviews = computed(() => {
  const list = reviewStore.byProduct(route.params.id)
  return starFilter.value ? list.filter((r) => r.rating === starFilter.value) : list
})
const fmt = (iso) => new Date(iso).toLocaleDateString('th-TH', { dateStyle: 'medium' })
const maskName = (n) => (n.length <= 2 ? n : n.charAt(0) + '*'.repeat(Math.min(n.length - 2, 5)) + n.slice(-1))

const canReply = computed(() => !!auth.user && !!shop.value && shop.value.ownerId === auth.user.id)
const replyOpen = ref(false)
const replying = ref(false)
const replyText = ref('')
const replyTarget = ref(null)

function openReply(r) {
  replyTarget.value = r
  replyText.value = r.reply || ''
  replyOpen.value = true
}

async function sendReply() {
  if (!replyText.value.trim()) return
  replying.value = true
  const res = await reviewStore.reply(replyTarget.value.id, replyText.value)
  replying.value = false
  if (!res.ok) {
    $q.notify({ message: 'ตอบกลับไม่สำเร็จ: ' + res.message, color: 'negative', position: 'top' })
    return
  }
  replyOpen.value = false
  $q.notify({ message: 'ตอบกลับรีวิวแล้ว', icon: 'check_circle', color: 'positive', position: 'top' })
}

watch(
  () => route.params.id,
  () => {
    qty.value = 1
    idx.value = 0
    starFilter.value = 0
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
)

function tryAdd() {
  const res = cart.add(product.value.id, qty.value)
  if (!res.ok) {
    $q.notify({ message: res.message, icon: 'error', color: 'negative', position: 'top', timeout: 2000 })
  }
  return res.ok
}

function addToCart() {
  if (!requireLogin('เข้าสู่ระบบก่อนใส่ตะกร้านะ')) return
  if (!tryAdd()) return
  $q.notify({
    message: 'ใส่ตะกร้าเรียบร้อย',
    caption: `${product.value.name} x${qty.value}`,
    icon: 'check_circle',
    color: 'positive',
    position: 'top',
    timeout: 1500,
  })
}

function buyNow() {
  if (!requireLogin('เข้าสู่ระบบก่อนสั่งซื้อนะ')) return
  if (!tryAdd()) return
  router.push('/cart')
}

function toggleLike() {
  if (!requireLogin('เข้าสู่ระบบก่อนกดถูกใจนะ')) return
  const added = wishlist.toggle(product.value.id)
  $q.notify({
    message: added ? 'เพิ่มในรายการที่ถูกใจแล้ว' : 'นำออกจากรายการที่ถูกใจแล้ว',
    icon: added ? 'favorite' : 'heart_broken',
    color: added ? 'accent' : 'grey-8',
    position: 'top',
    timeout: 1200,
  })
}
</script>

<style lang="scss" scoped>
.price {
  font-size: 32px;
  font-weight: 700;
  color: var(--q-primary);
}

.old-price {
  font-size: 16px;
  color: #aaa;
  text-decoration: line-through;
}

.price-box {
  background: rgba(255, 122, 69, 0.08);
  padding: 16px 20px;
  border-radius: 16px;
}

.qty-box {
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 999px;
  padding: 2px 6px;
}

.qty-num {
  min-width: 40px;
  text-align: center;
  font-weight: 600;
}

.avg {
  font-size: 48px;
  font-weight: 700;
  color: var(--q-primary);
  line-height: 1;
}

.reply {
  background: rgba(255, 122, 69, 0.08);
  border-radius: 12px;
  border-left: 3px solid var(--q-primary);
}

.gallery-main {
  position: relative;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.9;

  &.left {
    left: 10px;
  }
  &.right {
    right: 10px;
  }
}

.counter {
  position: absolute;
  right: 12px;
  bottom: 12px;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 999px;
}

.thumb {
  width: 64px;
  padding: 2px;
  border: 2px solid transparent;
  border-radius: 12px;
  opacity: 0.7;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
  }

  &.active {
    border-color: var(--q-primary);
    opacity: 1;
  }
}
</style>
