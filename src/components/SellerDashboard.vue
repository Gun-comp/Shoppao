<template>
  <div>
    <div class="row items-center q-mb-md">
      <div class="text-subtitle1 text-weight-bold">ภาพรวมร้านค้า</div>
      <q-space />
      <q-btn flat round icon="refresh" color="primary" :loading="loading" @click="reload">
        <q-tooltip>รีเฟรชข้อมูล</q-tooltip>
      </q-btn>
    </div>

    <div class="text-caption text-grey-6 q-mb-md">
      รายได้นับทุกออเดอร์ที่ชำระเงินแล้วและยังไม่ยกเลิก (ยอดสินค้า ไม่รวมค่าส่ง)
    </div>

    <!-- การ์ดสรุป -->
    <div class="row q-col-gutter-md q-mb-md">
      <div v-for="c in cards" :key="c.label" class="col-6 col-md-3">
        <div class="stat-card q-pa-md">
          <div class="row items-center no-wrap">
            <q-avatar size="38px" :color="c.color" text-color="white" :icon="c.icon" />
            <div class="q-ml-sm ellipsis">
              <div class="text-caption text-grey-6 ellipsis">{{ c.label }}</div>
              <div class="text-h6 text-weight-bold">{{ c.value }}</div>
            </div>
          </div>
          <div v-if="c.sub" class="text-caption text-grey-6 q-mt-xs">{{ c.sub }}</div>
        </div>
      </div>
    </div>

    <!-- ข้อสังเกต -->
    <div v-if="insights.length" class="q-mb-md">
      <q-banner v-for="t in insights" :key="t.text" rounded dense class="insight q-mb-xs">
        <template #avatar><q-icon :name="t.icon" :color="t.color" /></template>
        {{ t.text }}
      </q-banner>
    </div>

    <!-- กราฟ -->
    <div class="box q-pa-md q-mb-md">
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle2 text-weight-bold">ยอดขายตามช่วงเวลา</div>
        <q-space />
        <q-btn-toggle
          v-model="range"
          no-caps
          rounded
          unelevated
          dense
          toggle-color="primary"
          color="grey-3"
          text-color="grey-8"
          :options="rangeOptions"
        />
      </div>

      <div class="row q-gutter-md text-caption q-mb-xs">
        <span><span class="dot rev"></span> รายได้ (฿{{ rangeRevenue.toLocaleString() }})</span>
        <span><span class="dot can"></span> ถูกยกเลิก (฿{{ rangeCancelled.toLocaleString() }})</span>
        <span class="text-grey-6">{{ rangeCount }} ออเดอร์</span>
      </div>

      <div class="chart-wrap">
        <svg :viewBox="`0 0 ${W} ${H}`" class="chart" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ff7a45" />
              <stop offset="100%" stop-color="#ff4d6d" />
            </linearGradient>
          </defs>

          <g v-for="t in ticks" :key="t.v">
            <line :x1="L" :x2="W - R" :y1="t.y" :y2="t.y" stroke="currentColor" opacity="0.12" />
            <text :x="L - 8" :y="t.y + 4" text-anchor="end" font-size="11" fill="currentColor" opacity="0.6">
              {{ shortMoney(t.v) }}
            </text>
          </g>

          <g v-for="(b, i) in bars" :key="i">
            <rect :x="b.revX" :y="b.revY" :width="barW" :height="b.revH" rx="4" fill="url(#revGrad)">
              <title>{{ b.label }}: รายได้ ฿{{ b.rev.toLocaleString() }} ({{ b.count }} ออเดอร์)</title>
            </rect>
            <rect :x="b.canX" :y="b.canY" :width="barW" :height="b.canH" rx="4" fill="#f0506e" opacity="0.4">
              <title>{{ b.label }}: ยกเลิก ฿{{ b.can.toLocaleString() }}</title>
            </rect>
            <text
              v-if="b.showLabel"
              :x="b.cx"
              :y="H - 8"
              text-anchor="middle"
              font-size="11"
              fill="currentColor"
              opacity="0.6"
            >
              {{ b.label }}
            </text>
          </g>
        </svg>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <!-- สถานะออเดอร์ -->
      <div class="col-12 col-md-6">
        <div class="box q-pa-md full-height">
          <div class="text-subtitle2 text-weight-bold q-mb-sm">สถานะออเดอร์ทั้งหมด ({{ orders.length }})</div>
          <div v-if="orders.length">
            <div class="stack">
              <div
                v-for="s in statusRows"
                v-show="s.count"
                :key="s.key"
                class="stack-seg"
                :style="{ flex: s.count, background: s.hex }"
              >
                <q-tooltip>{{ s.label }} {{ s.count }}</q-tooltip>
              </div>
            </div>
            <div v-for="s in statusRows" :key="s.key" class="row items-center q-mt-sm">
              <span class="dot" :style="{ background: s.hex }"></span>
              <span class="q-ml-sm">{{ s.label }}</span>
              <q-space />
              <span class="text-weight-bold">{{ s.count }}</span>
              <span class="text-caption text-grey-6 q-ml-sm" style="width: 44px; text-align: right">
                {{ percent(s.count, orders.length) }}%
              </span>
            </div>
          </div>
          <div v-else class="text-grey-6 text-center q-py-lg">ยังไม่มีออเดอร์</div>
        </div>
      </div>

      <!-- สินค้าขายดี -->
      <div class="col-12 col-md-6">
        <div class="box q-pa-md full-height">
          <div class="text-subtitle2 text-weight-bold q-mb-sm">
            <q-icon name="emoji_events" color="warning" /> สินค้าขายดี 5 อันดับ
          </div>
          <div v-if="topSellers.length">
            <div v-for="(p, i) in topSellers" :key="p.id" class="row items-center no-wrap q-py-xs">
              <div class="rank">{{ i + 1 }}</div>
              <q-img :src="p.image" :ratio="1" class="q-mx-sm" style="width: 40px; min-width: 40px; border-radius: 8px" />
              <div class="col ellipsis text-body2">{{ p.name }}</div>
              <div class="text-right">
                <div class="text-weight-bold text-body2">{{ p.qty }} ชิ้น</div>
                <div class="text-caption text-grey-6">฿{{ p.revenue.toLocaleString() }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-grey-6 text-center q-py-lg">ยังไม่มียอดขาย</div>
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <!-- ยังไม่เคยขาย -->
      <div class="col-12 col-md-6">
        <div class="box q-pa-md full-height">
          <div class="row items-center q-mb-sm">
            <div class="text-subtitle2 text-weight-bold">
              <q-icon name="hourglass_empty" color="grey-6" /> สินค้าที่ยังไม่เคยขายได้
              <q-badge v-if="unsold.length" color="grey-6" rounded class="q-ml-xs">{{ unsold.length }}</q-badge>
            </div>
            <q-space />
            <q-btn v-if="unsold.length" flat dense no-caps color="primary" label="ไปแก้สินค้า" @click="$emit('goto', 'products')" />
          </div>
          <div v-if="unsold.length">
            <div v-for="p in unsold.slice(0, 6)" :key="p.id" class="row items-center no-wrap q-py-xs">
              <q-img :src="p.image" :ratio="1" style="width: 40px; min-width: 40px; border-radius: 8px" />
              <div class="col q-px-sm ellipsis text-body2">{{ p.name }}</div>
              <div class="text-caption text-grey-6">เหลือ {{ p.stock }} · ฿{{ p.price.toLocaleString() }}</div>
            </div>
            <div v-if="unsold.length > 6" class="text-caption text-grey-6 q-mt-xs">และอีก {{ unsold.length - 6 }} รายการ</div>
            <div class="text-caption text-grey-6 q-mt-sm">
              ลองปรับราคา เพิ่มรูป หรือแก้รายละเอียดให้น่าสนใจขึ้น
            </div>
          </div>
          <div v-else class="text-grey-6 text-center q-py-lg">
            {{ products.length ? 'สินค้าทุกชิ้นเคยขายได้แล้ว ' : 'ยังไม่มีสินค้า' }}
          </div>
        </div>
      </div>

      <!-- ถูกยกเลิกบ่อย -->
      <div class="col-12 col-md-6">
        <div class="box q-pa-md full-height">
          <div class="text-subtitle2 text-weight-bold q-mb-sm">
            <q-icon name="remove_shopping_cart" color="negative" /> สินค้าที่ถูกยกเลิกบ่อย
          </div>
          <div v-if="topCancelled.length">
            <div v-for="p in topCancelled" :key="p.id" class="row items-center no-wrap q-py-xs">
              <q-img :src="p.image" :ratio="1" style="width: 40px; min-width: 40px; border-radius: 8px" />
              <div class="col q-px-sm ellipsis text-body2">{{ p.name }}</div>
              <div class="text-right">
                <div class="text-weight-bold text-body2 text-negative">{{ p.qty }} ชิ้น</div>
                <div class="text-caption text-grey-6">฿{{ p.revenue.toLocaleString() }}</div>
              </div>
            </div>
          </div>
          <div v-else class="text-grey-6 text-center q-py-lg">ยังไม่มีการยกเลิก</div>
        </div>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- สต็อกใกล้หมด -->
      <div class="col-12 col-md-6">
        <div class="box q-pa-md full-height">
          <div class="row items-center q-mb-sm">
            <div class="text-subtitle2 text-weight-bold">
              <q-icon name="warning" color="warning" /> สต็อกใกล้หมด (5 ชิ้นหรือน้อยกว่า)
            </div>
            <q-space />
            <q-btn v-if="lowStock.length" flat dense no-caps color="primary" label="ไปเติมสต็อก" @click="$emit('goto', 'products')" />
          </div>
          <div v-if="lowStock.length">
            <div v-for="p in lowStock" :key="p.id" class="row items-center no-wrap q-py-xs">
              <q-img :src="p.image" :ratio="1" style="width: 40px; min-width: 40px; border-radius: 8px" />
              <div class="col q-px-sm ellipsis text-body2">{{ p.name }}</div>
              <q-chip v-if="p.stock <= 0" dense color="negative" text-color="white">หมด</q-chip>
              <q-chip v-else dense color="warning" text-color="dark">เหลือ {{ p.stock }}</q-chip>
            </div>
          </div>
          <div v-else class="text-grey-6 text-center q-py-lg">สต็อกทุกรายการยังเพียงพอ</div>
        </div>
      </div>

      <!-- รีวิวล่าสุด -->
      <div class="col-12 col-md-6">
        <div class="box q-pa-md full-height">
          <div class="text-subtitle2 text-weight-bold q-mb-sm">
            <q-icon name="rate_review" color="primary" /> รีวิวล่าสุดของร้าน
          </div>
          <div v-if="recentReviews.length">
            <div v-for="r in recentReviews" :key="r.id" class="q-py-xs">
              <div class="row items-center no-wrap">
                <q-rating :model-value="r.rating" readonly size="14px" color="warning" />
                <span class="text-caption text-grey-6 q-ml-sm ellipsis">{{ productName(r.productId) }}</span>
                <q-space />
                <q-btn flat dense no-caps size="sm" color="primary" :label="r.reply ? 'ดู' : 'ตอบกลับ'" :to="`/product/${r.productId}`" />
              </div>
              <div v-if="r.comment" class="text-body2 ellipsis-2-lines">{{ r.comment }}</div>
              <q-separator class="q-mt-xs" />
            </div>
          </div>
          <div v-else class="text-grey-6 text-center q-py-lg">ยังไม่มีรีวิว</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useOrderStore, STATUS } from '../stores/order'
import { useProductStore } from '../stores/product'
import { useReviewStore } from '../stores/review'

const props = defineProps({ shopId: { type: String, required: true } })
defineEmits(['goto'])

const orderStore = useOrderStore()
const productStore = useProductStore()
const reviewStore = useReviewStore()

const loading = ref(false)
async function reload() {
  loading.value = true
  await Promise.all([orderStore.load(), productStore.load()])
  loading.value = false
}

const money = (n) => '฿' + Math.round(n).toLocaleString()
const shortMoney = (n) => (n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0) + 'k' : String(n))
const percent = (a, b) => (b ? Math.round((a / b) * 100) : 0)

// ----- ข้อมูลพื้นฐาน -----
const orders = computed(() => orderStore.byShop(props.shopId).filter((o) => STATUS[o.status]))
const sold = computed(() => orders.value.filter((o) => o.status !== 'cancelled'))
const cancelled = computed(() => orders.value.filter((o) => o.status === 'cancelled'))
const products = computed(() => productStore.byShop(props.shopId))

const revenue = computed(() => sold.value.reduce((s, o) => s + o.subtotal, 0))
const cancelledValue = computed(() => cancelled.value.reduce((s, o) => s + o.subtotal, 0))
const deliveredValue = computed(() =>
  orders.value.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.subtotal, 0),
)
const waitingValue = computed(() => revenue.value - deliveredValue.value)
const avgOrder = computed(() => (sold.value.length ? revenue.value / sold.value.length : 0))
const cancelRate = computed(() => percent(cancelled.value.length, orders.value.length))

// ----- รีวิว -----
const productIds = computed(() => new Set(products.value.map((p) => p.id)))
const shopReviews = computed(() => reviewStore.reviews.filter((r) => productIds.value.has(r.productId)))
const avgRating = computed(() =>
  shopReviews.value.length
    ? shopReviews.value.reduce((s, r) => s + r.rating, 0) / shopReviews.value.length
    : 0,
)
const recentReviews = computed(() => shopReviews.value.slice(0, 5))
const productName = (id) => products.value.find((p) => p.id === id)?.name || 'สินค้า'

// ----- สินค้า -----
function tally(list) {
  const map = new Map()
  for (const o of list) {
    for (const it of o.items) {
      const cur = map.get(it.id) || { id: it.id, name: it.name, image: it.image, qty: 0, revenue: 0 }
      cur.qty += it.qty
      cur.revenue += it.price * it.qty
      map.set(it.id, cur)
    }
  }
  return map
}
const soldMap = computed(() => tally(sold.value))
const cancelMap = computed(() => tally(cancelled.value))

const topSellers = computed(() => [...soldMap.value.values()].sort((a, b) => b.qty - a.qty).slice(0, 5))
const topCancelled = computed(() => [...cancelMap.value.values()].sort((a, b) => b.qty - a.qty).slice(0, 5))
const unsold = computed(() => products.value.filter((p) => !soldMap.value.has(p.id)))
const lowStock = computed(() => products.value.filter((p) => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 8))

// ----- สถานะ -----
const statusHex = {
  paid: '#4aa8ff',
  preparing: '#ffc145',
  shipping: '#ff7a45',
  delivered: '#3dbb7e',
  cancelled: '#9e9e9e',
}
const statusRows = computed(() =>
  Object.keys(STATUS).map((k) => ({
    key: k,
    label: STATUS[k].label,
    hex: statusHex[k],
    count: orders.value.filter((o) => o.status === k).length,
  })),
)

// ----- การ์ดสรุป -----
const cards = computed(() => [
  { icon: 'payments', color: 'primary', label: 'รายได้รวม', value: money(revenue.value), sub: `${sold.value.length} ออเดอร์ที่ขายได้` },
  { icon: 'receipt_long', color: 'info', label: 'ยอดเฉลี่ยต่อออเดอร์', value: money(avgOrder.value) },
  {
    icon: 'star',
    color: 'warning',
    label: 'คะแนนรีวิวเฉลี่ย',
    value: shopReviews.value.length ? avgRating.value.toFixed(1) : '-',
    sub: `${shopReviews.value.length} รีวิว`,
  },
  { icon: 'hourglass_top', color: 'orange', label: 'รอรับเงินจริง', value: money(waitingValue.value), sub: 'ยังไม่ถึงขั้นผู้ซื้อรับของ' },
  { icon: 'check_circle', color: 'positive', label: 'ผู้ซื้อรับของแล้ว', value: money(deliveredValue.value) },
  { icon: 'cancel', color: 'negative', label: 'ยอดที่ถูกยกเลิก', value: money(cancelledValue.value), sub: `${cancelled.value.length} ออเดอร์` },
  { icon: 'percent', color: cancelRate.value > 20 ? 'negative' : 'grey-7', label: 'อัตรายกเลิก', value: cancelRate.value + '%' },
  { icon: 'inventory_2', color: 'grey-7', label: 'ยังไม่เคยขายได้', value: unsold.value.length + ' รายการ', sub: `จากสินค้า ${products.value.length} รายการ` },
])

const insights = computed(() => {
  const t = []
  if (orders.value.length >= 5 && cancelRate.value > 20)
    t.push({ icon: 'warning', color: 'negative', text: `อัตรายกเลิกสูง (${cancelRate.value}%) ลองตรวจสต็อกและการตอบรับออเดอร์ให้เร็วขึ้น` })
  const out = products.value.filter((p) => p.stock <= 0).length
  if (out) t.push({ icon: 'remove_shopping_cart', color: 'warning', text: `มีสินค้าหมด ${out} รายการ เสียโอกาสขาย รีบเติมสต็อกนะ` })
  if (products.value.length && unsold.value.length === products.value.length && orders.value.length)
    t.push({ icon: 'info', color: 'info', text: 'ยังไม่มีสินค้าไหนขายได้เลย ลองเพิ่มรูปและปรับราคาให้น่าสนใจขึ้น' })
  return t
})

// ----- กราฟ -----
const range = ref('7')
const rangeOptions = [
  { label: '7 วัน', value: '7' },
  { label: '30 วัน', value: '30' },
  { label: '12 เดือน', value: '12m' },
]

const keyOf = (d) =>
  range.value === '12m' ? `${d.getFullYear()}-${d.getMonth()}` : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

const buckets = computed(() => {
  const now = new Date()
  const list = []
  if (range.value === '12m') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      list.push({ key: keyOf(d), label: d.toLocaleDateString('th-TH', { month: 'short' }), rev: 0, can: 0, count: 0 })
    }
  } else {
    const n = Number(range.value)
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      list.push({ key: keyOf(d), label: `${d.getDate()}/${d.getMonth() + 1}`, rev: 0, can: 0, count: 0 })
    }
  }
  const map = new Map(list.map((b) => [b.key, b]))
  for (const o of orders.value) {
    const b = map.get(keyOf(new Date(o.createdAt)))
    if (!b) continue
    if (o.status === 'cancelled') b.can += o.subtotal
    else {
      b.rev += o.subtotal
      b.count++
    }
  }
  return list
})

const rangeRevenue = computed(() => buckets.value.reduce((s, b) => s + b.rev, 0))
const rangeCancelled = computed(() => buckets.value.reduce((s, b) => s + b.can, 0))
const rangeCount = computed(() => buckets.value.reduce((s, b) => s + b.count, 0))

const W = 700
const H = 250
const L = 52
const R = 10
const T = 14
const B = 30
const plotW = W - L - R
const plotH = H - T - B

const maxVal = computed(() => {
  const m = Math.max(0, ...buckets.value.map((b) => Math.max(b.rev, b.can)))
  if (m === 0) return 100
  const pow = 10 ** Math.floor(Math.log10(m))
  return Math.ceil(m / pow) * pow
})

const ticks = computed(() =>
  [0, 1, 2, 3, 4].map((i) => {
    const v = (maxVal.value / 4) * i
    return { v, y: T + plotH - (v / maxVal.value) * plotH }
  }),
)

const barW = computed(() => Math.min((plotW / buckets.value.length) * 0.36, 22))

const bars = computed(() => {
  const n = buckets.value.length
  const slot = plotW / n
  const step = n > 14 ? Math.ceil(n / 10) : 1
  const h = (v) => (v / maxVal.value) * plotH
  return buckets.value.map((b, i) => {
    const cx = L + slot * i + slot / 2
    const revH = h(b.rev)
    const canH = h(b.can)
    return {
      ...b,
      cx,
      revX: cx - barW.value - 1,
      canX: cx + 1,
      revH,
      canH,
      revY: T + plotH - revH,
      canY: T + plotH - canH,
      showLabel: i % step === 0 || i === n - 1,
    }
  })
})
</script>

<style lang="scss" scoped>
.stat-card,
.box {
  border: 1.5px solid rgba(255, 122, 69, 0.22);
  border-radius: 18px;
}

.insight {
  background: rgba(255, 193, 69, 0.14);
  border-radius: 12px;
}

.chart-wrap {
  overflow-x: auto;
}
.chart {
  width: 100%;
  min-width: 520px;
  height: auto;
  color: inherit;
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  vertical-align: middle;

  &.rev {
    background: linear-gradient(135deg, #ff7a45, #ff4d6d);
  }
  &.can {
    background: #f0506e;
    opacity: 0.45;
  }
}

.stack {
  display: flex;
  height: 14px;
  border-radius: 999px;
  overflow: hidden;
  gap: 2px;
}
.stack-seg {
  min-width: 6px;
}

.rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--sp-gradient);
  color: white;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
