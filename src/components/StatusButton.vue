<template>
  <q-btn
    :type="type"
    unelevated
    rounded
    no-caps
    :size="size"
    :disable="disable"
    class="sp-gradient-btn status-btn"
    :class="[state, { busy: state !== 'idle' }]"
  >
    <transition name="swap" mode="out-in">
      <span :key="state" class="row items-center no-wrap justify-center">
        <q-spinner v-if="state === 'loading'" size="20px" class="q-mr-sm" />
        <q-icon v-else-if="state === 'success'" name="check_circle" size="22px" class="q-mr-sm pop-in" />
        <q-icon v-else-if="icon" :name="icon" class="q-mr-sm" />
        <span>{{ text }}</span>
      </span>
    </transition>
  </q-btn>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  state: { type: String, default: 'idle' }, // idle | loading | success
  label: { type: String, default: 'ส่ง' },
  loadingLabel: { type: String, default: 'กำลังส่ง...' },
  successLabel: { type: String, default: 'สำเร็จ!' },
  icon: { type: String, default: '' },
  size: { type: String, default: 'md' },
  type: { type: String, default: 'button' },
  disable: { type: Boolean, default: false },
})

const text = computed(() =>
  props.state === 'loading' ? props.loadingLabel : props.state === 'success' ? props.successLabel : props.label,
)
</script>

<style lang="scss" scoped>
.status-btn {
  position: relative;
  overflow: hidden;
  min-width: 150px;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: #3dbb7e;
    opacity: 0;
    transition: opacity 0.45s ease;
  }
  &.success::after {
    opacity: 1;
  }
  &.busy {
    pointer-events: none;
  }
}

.status-btn :deep(.q-btn__content) {
  position: relative;
  z-index: 1;
}

.swap-enter-active,
.swap-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.swap-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.pop-in {
  animation: pop-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop-in {
  from {
    transform: scale(0) rotate(-45deg);
  }
  to {
    transform: scale(1) rotate(0);
  }
}
</style>
