<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="state !== 'idle'"
    transition-show="jump-up"
    transition-hide="fade"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="width: 460px; max-width: 94vw; border-radius: 24px">
      <q-card-section class="row items-center">
        <div class="text-h6 text-weight-bold">รีวิวสินค้า</div>
        <q-space />
        <q-btn
          flat
          round
          dense
          icon="close"
          :disable="state !== 'idle'"
          @click="$emit('update:modelValue', false)"
        />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <div class="row items-center no-wrap q-mb-md">
          <q-img :src="item?.image" :ratio="1" style="width: 64px; min-width: 64px; border-radius: 12px" />
          <div class="q-pl-md text-weight-medium">{{ item?.name }}</div>
        </div>

        <div class="text-center q-mb-sm">
          <q-rating
            v-model="rating"
            size="40px"
            color="warning"
            icon="star_border"
            icon-selected="star"
            class="stars"
          />
          <transition name="label" mode="out-in">
            <div :key="rating" class="text-caption text-grey-6">
              {{ labels[rating] || 'แตะดาวเพื่อให้คะแนน' }}
            </div>
          </transition>
        </div>

        <q-input
          v-model="comment"
          outlined
          type="textarea"
          rows="4"
          maxlength="500"
          counter
          :readonly="state !== 'idle'"
          label="เล่าประสบการณ์การใช้สินค้า"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn
          flat
          rounded
          no-caps
          label="ยกเลิก"
          :disable="state !== 'idle'"
          @click="$emit('update:modelValue', false)"
        />
        <StatusButton
          :state="state"
          label="ส่งรีวิว"
          loading-label="กำลังส่ง..."
          success-label="ขอบคุณ!"
          icon="send"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import StatusButton from './StatusButton.vue'
import { useReviewStore } from '../stores/review'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  item: { type: Object, default: null }, // { id, name, image }
  orderId: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'done'])

const $q = useQuasar()
const reviews = useReviewStore()

const rating = ref(0)
const comment = ref('')
const state = ref('idle')
const labels = { 1: 'แย่มาก', 2: 'ไม่ค่อยดี', 3: 'พอใช้', 4: 'ดี', 5: 'ดีเยี่ยม' }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      rating.value = 0
      comment.value = ''
      state.value = 'idle'
    }
  },
)

async function submit() {
  if (state.value !== 'idle') return
  if (!rating.value) {
    $q.notify({ message: 'กรุณาให้คะแนนดาวก่อน', color: 'warning', textColor: 'dark', position: 'top' })
    return
  }

  state.value = 'loading'
  const [res] = await Promise.all([
    reviews.add({
      productId: props.item.id,
      orderId: props.orderId,
      rating: rating.value,
      comment: comment.value,
    }),
    wait(700),
  ])

  if (!res.ok) {
    state.value = 'idle'
    $q.notify({ message: res.message, color: 'negative', position: 'top' })
    return
  }

  state.value = 'success'
  await wait(1100)
  emit('update:modelValue', false)
  emit('done')
  $q.notify({ message: 'ขอบคุณสำหรับรีวิว!', icon: 'star', color: 'positive', position: 'top' })
}
</script>

<style lang="scss" scoped>
.stars :deep(.q-rating__icon) {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease;
}
.stars :deep(.q-rating__icon--hovered) {
  transform: scale(1.3);
}
.stars :deep(.q-rating__icon--active) {
  transform: scale(1.12);
}

.label-enter-active,
.label-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.label-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.label-leave-to {
  opacity: 0;
}
</style>
