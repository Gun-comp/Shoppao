<template>
  <q-page class="q-pb-xl">
    <div class="sp-container q-pt-lg">
      <div class="row items-center q-mb-md">
        <div class="text-h5 text-weight-bold">คำสั่งซื้อของฉัน</div>
        <q-space />
        <q-btn flat round icon="refresh" color="primary" :loading="refreshing" @click="refresh">
          <q-tooltip>รีเฟรชสถานะ</q-tooltip>
        </q-btn>
      </div>

      <q-tabs
        v-model="tab"
        dense
        no-caps
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="sp-card q-mb-md"
        outside-arrows
        mobile-arrows
      >
        <q-tab v-for="t in tabs" :key="t.name" :name="t.name" :label="t.label">
          <q-badge v-if="count(t) && t.name !== 'all'" color="accent" rounded floating>{{ count(t) }}</q-badge>
        </q-tab>
      </q-tabs>

      <div v-if="!orderStore.loaded" class="text-center q-py-xl"><q-spinner color="primary" size="40px" /></div>

      <div v-else-if="shown.length">
        <div
          v-for="(o, idx) in shown"
          :key="o.id"
          class="sp-card q-pa-md q-mb-md fade-up"
          :style="{ '--i': idx }"
        >
          <div class="row items-center justify-between q-mb-sm">
            <div class="row items-center cursor-pointer" @click="$router.push(`/shop/${o.shopId}`)">
              <q-icon name="storefront" color="primary" />
              <span class="q-ml-sm text-weight-bold">{{ shopName(o.shopId) }}</span>
              <q-icon name="chevron_right" color="grey-6" />
            </div>
            <transition name="chip" mode="out-in">
              <q-chip
                :key="o.status"
                dense
                :color="STATUS[o.status].color"
                text-color="white"
                :icon="STATUS[o.status].icon"
              >
                {{ STATUS[o.status].label }}
              </q-chip>
            </transition>
          </div>

          <div class="text-caption text-grey-6">#{{ o.code }} · {{ fmt(o.createdAt) }}</div>

          <div v-if="o.status !== 'cancelled'" class="steps q-my-md">
            <div
              v-for="(s, i) in steps"
              :key="s"
              class="step"
              :style="{ '--i': i }"
              :class="{ done: i <= stepIndex(o), current: i === stepIndex(o) }"
            >
              <div class="dot"><q-icon :name="STATUS[s].icon" size="16px" /></div>
              <div class="step-label">{{ STATUS[s].label }}</div>
              <div class="step-time">{{ timeOf(o, s) }}</div>
            </div>
          </div>
          <div v-else class="text-caption text-grey-7 q-my-sm">
            ยกเลิกเมื่อ {{ timeOf(o, 'cancelled') }} · สินค้าถูกคืนเข้าสต็อกแล้ว
          </div>

          <transition name="slide-down">
            <div v-if="o.tracking" class="tracking q-mb-sm">
              <q-icon name="local_shipping" color="primary" />
              เลขพัสดุ <span class="text-weight-bold">{{ o.tracking }}</span>
            </div>
          </transition>

          <q-separator class="q-mb-sm" />

          <div v-for="i in o.items" :key="i.id" class="row items-center no-wrap q-py-xs">
            <q-img :src="i.image" :ratio="1" style="width: 56px; min-width: 56px; border-radius: 10px" />
            <div class="col q-px-md">
              <div class="text-body2">{{ i.name }}</div>
              <div class="text-caption text-grey-6">x{{ i.qty }}</div>
            </div>
            <div class="column items-end">
              <div class="text-body2">฿{{ (i.price * i.qty).toLocaleString() }}</div>
              <template v-if="o.status === 'delivered'">
                <q-chip v-if="reviews.hasReviewed(o.id, i.id)" dense color="grey-3" text-color="grey-7" icon="check">
                  รีวิวแล้ว
                </q-chip>
                <q-btn
                  v-else
                  flat
                  dense
                  no-caps
                  color="primary"
                  icon="star_border"
                  label="รีวิวสินค้า"
                  @click="openReview(o, i)"
                />
              </template>
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <div class="row justify-between items-center">
            <span class="text-caption text-grey-6">{{ o.payment }} · ค่าส่ง ฿{{ o.shipping }}</span>
            <span>
              ยอดรวม
              <span class="text-primary text-weight-bold text-subtitle1">฿{{ o.total.toLocaleString() }}</span>
            </span>
          </div>

          <div class="row justify-end q-gutter-sm q-mt-sm">
            <q-btn
              v-if="o.status === 'paid'"
              outline
              rounded
              no-caps
              color="negative"
              label="ยกเลิกคำสั่งซื้อ"
              :loading="busy === o.id"
              @click="cancel(o)"
            />
            <q-btn
              v-if="o.status === 'shipping'"
              unelevated
              rounded
              no-caps
              class="sp-gradient-btn"
              icon="inventory"
              label="ฉันได้รับสินค้าแล้ว"
              :loading="busy === o.id"
              @click="received(o)"
            />
            <q-btn
              v-if="o.status === 'delivered' || o.status === 'cancelled'"
              outline
              rounded
              no-caps
              color="primary"
              label="ซื้ออีกครั้ง"
              @click="buyAgain(o)"
            />
          </div>
        </div>
      </div>

      <div v-else class="sp-card text-center q-py-xl fade-up">
        <q-icon name="receipt_long" size="72px" color="grey-5" />
        <div class="text-h6 q-mt-md">ยังไม่มีคำสั่งซื้อในหมวดนี้</div>
        <q-btn unelevated rounded class="sp-gradient-btn q-mt-lg" label="เริ่มช้อปเลย" to="/" />
      </div>
    </div>

    <ReviewDialog v-model="reviewOpen" :item="reviewItem" :order-id="reviewOrderId" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import ReviewDialog from '../components/ReviewDialog.vue'
import { useOrderStore, STATUS } from '../stores/order'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import { useReviewStore } from '../stores/review'
import { useProductStore, getShop } from '../stores/product'

const $q = useQuasar()
const router = useRouter()
const orderStore = useOrderStore()
const auth = useAuthStore()
const cart = useCartStore()
const reviews = useReviewStore()
const productStore = useProductStore()

const tab = ref('all')
const busy = ref('')
const refreshing = ref(false)
const steps = ['paid', 'preparing', 'shipping', 'delivered']

const tabs = [
  { name: 'all', label: 'ทั้งหมด', statuses: null },
  { name: 'toship', label: 'ที่ต้องจัดส่ง', statuses: ['paid', 'preparing'] },
  { name: 'toreceive', label: 'ที่ต้องได้รับ', statuses: ['shipping'] },
  { name: 'done', label: 'สำเร็จแล้ว', statuses: ['delivered'] },
  { name: 'cancelled', label: 'ยกเลิก', statuses: ['cancelled'] },
]

onMounted(() => orderStore.load())

async function refresh() {
  refreshing.value = true
  await orderStore.load()
  refreshing.value = false
}

const shopName = (id) => getShop(id)?.name || 'ร้านค้า'

const myOrders = computed(() => orderStore.byUser(auth.user?.id).filter((o) => STATUS[o.status]))
const inTab = (t) => (t.statuses ? myOrders.value.filter((o) => t.statuses.includes(o.status)) : myOrders.value)
const count = (t) => inTab(t).length
const shown = computed(() => inTab(tabs.find((t) => t.name === tab.value)))

const fmt = (iso) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
const stepIndex = (o) => steps.indexOf(o.status)
const timeOf = (o, s) => {
  const t = o.timeline?.find((x) => x.status === s)
  return t ? fmt(t.at) : ''
}

// ----- รีวิว -----
const reviewOpen = ref(false)
const reviewItem = ref(null)
const reviewOrderId = ref('')
function openReview(o, i) {
  reviewItem.value = i
  reviewOrderId.value = o.id
  reviewOpen.value = true
}

async function cancel(o) {
  if (!window.confirm(`ยกเลิกคำสั่งซื้อ #${o.code} ใช่ไหม`)) return
  busy.value = o.id
  const res = await orderStore.cancel(o.id)
  busy.value = ''
  if (res.ok) {
    await productStore.load()
    $q.notify({ message: 'ยกเลิกคำสั่งซื้อแล้ว', icon: 'cancel', color: 'grey-8', position: 'top' })
  } else {
    $q.notify({ message: 'ยกเลิกไม่ได้: ' + res.message, color: 'negative', position: 'top' })
  }
}

async function received(o) {
  busy.value = o.id
  const res = await orderStore.confirmReceived(o.id)
  busy.value = ''
  if (res.ok) {
    await productStore.load()
    $q.notify({
      message: 'ขอบคุณที่ช้อปกับเรา! อย่าลืมรีวิวสินค้านะ',
      icon: 'check_circle',
      color: 'positive',
      position: 'top',
    })
  } else {
    $q.notify({ message: 'ทำรายการไม่สำเร็จ: ' + res.message, color: 'negative', position: 'top' })
  }
}

function buyAgain(o) {
  let added = 0
  o.items.forEach((i) => {
    if (cart.add(i.id, i.qty).ok) added++
  })
  $q.notify({
    message: added ? `ใส่ตะกร้าแล้ว ${added} รายการ` : 'สินค้าหมดหรือไม่มีขายแล้ว',
    color: added ? 'positive' : 'warning',
    textColor: added ? 'white' : 'dark',
    position: 'top',
  })
  if (added) router.push('/cart')
}
</script>

<style lang="scss" scoped>
.steps {
  display: flex;
}

.step {
  flex: 1;
  position: relative;
  text-align: center;
  color: #aaa;
  transition: color 0.5s ease;

  &::before {
    content: '';
    position: absolute;
    top: 15px;
    left: -50%;
    width: 100%;
    height: 3px;
    background: rgba(0, 0, 0, 0.1);
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 15px;
    left: -50%;
    width: 100%;
    height: 3px;
    background: var(--sp-gradient);
    transform: scaleX(0);
    transform-origin: left;
    z-index: 0;
  }

  &:first-child::before,
  &:first-child::after {
    display: none;
  }

  &.done {
    color: var(--q-primary);

    &::after {
      animation: line-fill 0.5s var(--ease) forwards;
      animation-delay: calc(var(--i) * 0.25s);
    }

    .dot {
      background: var(--sp-gradient);
      color: white;
      animation: dot-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
      animation-delay: calc(var(--i) * 0.25s + 0.35s);
    }
  }

  &.current .dot::after {
    content: '';
    position: absolute;
    inset: -5px;
    border-radius: 50%;
    border: 2px solid rgba(255, 122, 69, 0.55);
    animation: ring 1.8s ease-out infinite;
    animation-delay: calc(var(--i) * 0.25s + 0.8s);
  }
}

.dot {
  position: relative;
  z-index: 1;
  width: 32px;
  height: 32px;
  margin: 0 auto;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-label {
  margin-top: 6px;
  font-size: 11.5px;
  line-height: 1.3;
}

.step-time {
  font-size: 10px;
  opacity: 0.7;
  min-height: 14px;
}

.tracking {
  background: rgba(255, 122, 69, 0.08);
  padding: 8px 14px;
  border-radius: 12px;
  font-size: 13px;
}

@keyframes line-fill {
  to {
    transform: scaleX(1);
  }
}
@keyframes dot-pop {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}
@keyframes ring {
  0% {
    transform: scale(0.85);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.chip-enter-active {
  transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.chip-leave-active {
  transition: opacity 0.15s ease;
}
.chip-enter-from {
  opacity: 0;
  transform: scale(0.6);
}
.chip-leave-to {
  opacity: 0;
}

.slide-down-enter-active {
  transition: all 0.5s var(--ease);
}
.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
