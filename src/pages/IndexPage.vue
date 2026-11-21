<template>
  <q-page class="q-pb-xl">
    <div class="sp-container">
      <!-- Banner -->
      <div v-if="!query" class="hero q-mt-lg">
        <div class="hero-text">
          <div class="text-overline">ยินดีต้อนรับสู่ Shoppao</div>
          <div class="hero-title">ช้อปง่าย สวยทุกมุม<br />ในที่เดียว</div>
          <div class="q-mt-sm" style="opacity: 0.9">คัดสินค้าน่ารัก ราคาโดนใจ ส่งตรงถึงบ้านคุณ</div>
          <q-btn
            unelevated
            rounded
            color="white"
            text-color="primary"
            label="เริ่มช้อปเลย"
            icon-right="arrow_forward"
            class="q-mt-lg"
            @click="scrollToProducts"
          />
        </div>
      </div>

      <!-- หมวดหมู่: ชิปไอคอนแนวนอน + แผงกระจกฝ้า -->
      <div class="cat-zone q-mt-lg">
        <div class="chip-scroll">
          <div
            v-for="(c, i) in allCategories"
            :key="c.id"
            class="cat-chip cursor-pointer"
            :class="{ active: selectedCat === c.id }"
            :style="{ animationDelay: i * 40 + 'ms' }"
            @click="pickCat(c)"
          >
            <div class="chip-icon" :style="{ background: gradients[i % gradients.length] }">
              <q-icon :name="c.icon" size="26px" />
            </div>
            <div class="chip-name">{{ c.name }}</div>
          </div>
        </div>

        <!-- แผงหมวดย่อย -->
        <q-slide-transition>
          <div v-if="currentCat && currentCat.subs.length" class="glass-panel q-mt-md">
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle2 text-weight-bold">
                <q-icon :name="currentCat.icon" color="primary" class="q-mr-xs" />
                {{ currentCat.name }}
              </div>
              <q-btn flat round dense size="sm" icon="close" @click="clearFilter" />
            </div>

            <div class="row q-gutter-sm">
              <div class="sub-chip cursor-pointer" :class="{ active: !selectedSub }" @click="pickSub(null)">
                ทั้งหมด
                <span class="sub-count">{{ catCount(currentCat.id) }}</span>
              </div>
              <div
                v-for="s in currentCat.subs"
                :key="s.id"
                class="sub-chip cursor-pointer"
                :class="{ active: selectedSub === s.id }"
                @click="pickSub(s)"
              >
                {{ s.name }}
                <span class="sub-count">{{ subCount(s.id) }}</span>
              </div>
            </div>
          </div>
        </q-slide-transition>

        <q-chip
          v-if="activeLabel"
          removable
          color="primary"
          text-color="white"
          icon="filter_alt"
          class="q-mt-sm q-ml-none"
          @remove="clearFilter"
        >
          {{ activeLabel }}
        </q-chip>
      </div>

      <!-- รายการสินค้า -->
      <div ref="productsEl" class="row items-center justify-between q-mt-xl q-mb-md">
        <div class="text-h6 text-weight-bold">
          {{ query ? `ผลการค้นหา "${query}"` : activeLabel || 'สินค้าแนะนำ' }}
          <span class="text-caption text-grey-6">({{ filtered.length }} รายการ)</span>
        </div>

        <q-select
          v-model="sortBy"
          :options="sortOptions"
          emit-value
          map-options
          dense
          outlined
          rounded
          style="min-width: 170px"
        />
      </div>

      <div v-if="filtered.length" class="row q-col-gutter-md">
        <div v-for="p in filtered" :key="p.id" class="col-6 col-sm-4 col-md-3">
          <ProductCard :product="p" />
        </div>
      </div>

      <div v-else class="text-center q-py-xl text-grey-6">
        <q-icon :name="activeLabel ? 'inventory_2' : 'search_off'" size="64px" />
        <div class="q-mt-sm">
          {{
            activeLabel && !query
              ? 'ยังไม่มีสินค้าในหมวดนี้ ร้านค้าจะมาเพิ่มเร็วๆ นี้'
              : 'ไม่พบสินค้าที่ค้นหา ลองใช้คำอื่นดูนะ'
          }}
        </div>
        <q-btn v-if="activeLabel" flat color="primary" label="ดูสินค้าทั้งหมด" class="q-mt-md" @click="clearFilter" />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '../components/ProductCard.vue'
import { categories } from '../data/categories'
import { useProductStore } from '../stores/product'

const route = useRoute()
const productStore = useProductStore()
const productsEl = ref(null)
const selectedCat = ref('all')
const selectedSub = ref(null)
const sortBy = ref('popular')

const allCategories = [{ id: 'all', name: 'ทั้งหมด', icon: 'apps', subs: [] }, ...categories]

// สีไล่เฉดของวงกลมไอคอนแต่ละหมวด
const gradients = [
  'linear-gradient(135deg, #ff7a45, #ff4d6d)',
  'linear-gradient(135deg, #ff9966, #ff5e62)',
  'linear-gradient(135deg, #f7971e, #ffd200)',
  'linear-gradient(135deg, #ff6a88, #ff99ac)',
  'linear-gradient(135deg, #ee9ca7, #ffb48a)',
  'linear-gradient(135deg, #fc5c7d, #6a82fb)',
  'linear-gradient(135deg, #43c6ac, #3dbb7e)',
  'linear-gradient(135deg, #4aa8ff, #6a82fb)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #5ee7df, #4aa8ff)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #f6d365, #fda085)',
]

const sortOptions = [
  { label: 'ยอดนิยม', value: 'popular' },
  { label: 'ราคาต่ำ → สูง', value: 'priceAsc' },
  { label: 'ราคาสูง → ต่ำ', value: 'priceDesc' },
  { label: 'คะแนนสูงสุด', value: 'rating' },
]

const query = computed(() => (route.query.q || '').toString().trim())
const currentCat = computed(() => categories.find((c) => c.id === selectedCat.value) || null)

const activeLabel = computed(() => {
  if (!currentCat.value) return ''
  const sub = currentCat.value.subs.find((s) => s.id === selectedSub.value)
  return sub ? `${currentCat.value.name} › ${sub.name}` : currentCat.value.name
})

const catCount = (id) => productStore.all.filter((p) => p.category === id).length
const subCount = (id) => productStore.all.filter((p) => p.sub === id).length

function pickCat(c) {
  // กดหมวดเดิมซ้ำ = ปิด
  if (selectedCat.value === c.id) return clearFilter()
  selectedCat.value = c.id
  selectedSub.value = null
}

function pickSub(s) {
  selectedSub.value = s ? s.id : null
  if (s) setTimeout(scrollToProducts, 150)
}

function clearFilter() {
  selectedCat.value = 'all'
  selectedSub.value = null
}

const filtered = computed(() => {
  let list = productStore.all.filter((p) => {
    const matchCat = selectedCat.value === 'all' || p.category === selectedCat.value
    const matchSub = !selectedSub.value || p.sub === selectedSub.value
    const matchQuery = !query.value || p.name.toLowerCase().includes(query.value.toLowerCase())
    return matchCat && matchSub && matchQuery
  })

  list = [...list]
  if (sortBy.value === 'popular') list.sort((a, b) => b.sold - a.sold)
  if (sortBy.value === 'priceAsc') list.sort((a, b) => a.price - b.price)
  if (sortBy.value === 'priceDesc') list.sort((a, b) => b.price - a.price)
  if (sortBy.value === 'rating') list.sort((a, b) => b.rating - a.rating)
  return list
})

function scrollToProducts() {
  productsEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<style lang="scss" scoped>
.hero {
  background: var(--sp-gradient);
  color: white;
  border-radius: 28px;
  padding: 56px 40px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(255, 77, 109, 0.25);

  &::after {
    content: '';
    position: absolute;
    right: -60px;
    top: -60px;
    width: 280px;
    height: 280px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
  }

  &::before {
    content: '';
    position: absolute;
    right: 120px;
    bottom: -90px;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
  }
}

.hero-text {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 40px;
  font-weight: 700;
  line-height: 1.25;
}

@media (max-width: 600px) {
  .hero {
    padding: 36px 24px;
  }
  .hero-title {
    font-size: 28px;
  }
}

.cat-zone {
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.35;
    pointer-events: none;
    z-index: 0;
  }
  &::before {
    width: 220px;
    height: 220px;
    background: #ff7a45;
    left: -40px;
    top: 20px;
  }
  &::after {
    width: 240px;
    height: 240px;
    background: #ff4d6d;
    right: -40px;
    top: 60px;
  }
}

.chip-scroll {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 4px 12px;
  scroll-snap-type: x proximity;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.cat-chip {
  flex: 0 0 auto;
  width: 84px;
  text-align: center;
  scroll-snap-align: start;
  animation: chip-in 0.4s ease both;

  &:hover .chip-icon {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(255, 77, 109, 0.35);
  }

  &.active .chip-icon {
    transform: translateY(-5px) scale(1.08);
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.9), 0 0 0 7px rgba(255, 122, 69, 0.45),
      0 12px 24px rgba(255, 77, 109, 0.35);
  }

  &.active .chip-name {
    color: var(--q-primary);
    font-weight: 600;
  }
}

.chip-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 6px 16px rgba(255, 122, 69, 0.25);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.chip-name {
  margin-top: 8px;
  font-size: 12.5px;
  color: #666;
  line-height: 1.3;
  transition: color 0.2s ease;
}

body.body--dark .chip-name {
  color: #cfc4bd;
}

@keyframes chip-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.glass-panel {
  position: relative;
  z-index: 1;
  padding: 16px 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 10px 32px rgba(255, 122, 69, 0.18);
}

body.body--dark .glass-panel {
  background: rgba(42, 35, 32, 0.6);
  border-color: rgba(255, 255, 255, 0.1);
}

.sub-chip {
  padding: 7px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1.5px solid rgba(255, 122, 69, 0.35);
  font-size: 14px;
  color: var(--q-primary);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.95);
  }

  &.active {
    background: var(--sp-gradient);
    border-color: transparent;
    color: white;
    box-shadow: 0 6px 16px rgba(255, 77, 109, 0.3);
  }
}

body.body--dark .sub-chip:not(.active) {
  background: rgba(255, 255, 255, 0.06);
}

.sub-count {
  font-size: 11px;
  opacity: 0.7;
  margin-left: 4px;
}
</style>
