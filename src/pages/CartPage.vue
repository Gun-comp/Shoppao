<template>
  <q-page class="q-pb-xl">
    <div class="sp-container q-pt-lg">
      <div class="text-h5 text-weight-bold q-mb-md">
        ตะกร้าสินค้า
        <span class="text-caption text-grey-6">({{ cart.totalQty }} ชิ้น)</span>
      </div>

      <div v-if="!detailedItems.length" class="sp-card text-center q-py-xl">
        <q-icon name="shopping_bag" size="72px" color="grey-5" />
        <div class="text-h6 q-mt-md">ตะกร้ายังว่างอยู่</div>
        <div class="text-grey-6">ไปเลือกสินค้าที่ถูกใจกันเลย</div>
        <q-btn unelevated rounded class="sp-gradient-btn q-mt-lg" label="เริ่มช้อปเลย" to="/" />
      </div>

      <div v-else class="row q-col-gutter-lg">
        <div class="col-12 col-md-8">
          <q-banner v-if="hasProblem" rounded class="bg-red-1 text-negative q-mb-md">
            <template #avatar><q-icon name="error_outline" color="negative" /></template>
            มีสินค้าที่หมดหรือเกินจำนวนในสต็อก กรุณาปรับจำนวนหรือนำออกก่อนชำระเงิน
          </q-banner>

          <div v-for="g in groups" :key="g.shopId" class="sp-card q-pa-md q-mb-md">
            <div class="row items-center q-mb-sm cursor-pointer" @click="$router.push(`/shop/${g.shopId}`)">
              <q-icon name="storefront" color="primary" />
              <span class="q-ml-sm text-weight-bold">{{ g.shop?.name }}</span>
              <q-icon name="chevron_right" color="grey-6" />
            </div>
            <q-separator class="q-mb-sm" />

            <div v-for="item in g.items" :key="item.id" class="row items-center no-wrap q-py-sm">
              <q-img
                :src="item.image"
                :ratio="1"
                style="width: 88px; min-width: 88px; border-radius: 14px"
                class="cursor-pointer"
                @click="$router.push(`/product/${item.id}`)"
              />

              <div class="col q-px-md">
                <div class="text-weight-medium">{{ item.name }}</div>
                <div class="text-primary text-weight-bold q-mt-xs">฿{{ item.price.toLocaleString() }}</div>

                <div class="row items-center q-mt-sm">
                  <div class="qty-box row items-center">
                    <q-btn flat round dense size="sm" icon="remove" @click="cart.setQty(item.id, item.qty - 1)" />
                    <span class="qty-num">{{ item.qty }}</span>
                    <q-btn flat round dense size="sm" icon="add" @click="inc(item)" />
                  </div>
                  <span
                    class="text-caption q-ml-sm"
                    :class="item.stock <= 0 || item.qty > item.stock ? 'text-negative' : 'text-grey-6'"
                  >
                    {{ item.stock <= 0 ? 'สินค้าหมด' : `เหลือ ${item.stock} ชิ้น` }}
                  </span>
                </div>
              </div>

              <div class="column items-end justify-between" style="min-height: 80px">
                <div class="text-weight-bold">฿{{ (item.price * item.qty).toLocaleString() }}</div>
                <q-btn flat round dense color="negative" icon="delete_outline" @click="removeItem(item)" />
              </div>
            </div>

            <q-separator class="q-my-sm" />
            <div class="row justify-between text-caption text-grey-7">
              <span>ค่าจัดส่งร้านนี้</span>
              <span :class="{ 'text-positive': g.shipping === 0 }">
                {{ g.shipping === 0 ? 'ฟรี' : `฿${g.shipping}` }}
                <span v-if="g.shipping > 0">(ครบ ฿500 ส่งฟรี)</span>
              </span>
            </div>
          </div>
        </div>

        <div class="col-12 col-md-4">
          <div class="sp-card q-pa-lg summary">
            <div class="text-h6 text-weight-bold q-mb-md">สรุปคำสั่งซื้อ</div>

            <div class="row justify-between q-mb-sm">
              <span class="text-grey-7">ราคาสินค้า</span>
              <span>฿{{ subtotal.toLocaleString() }}</span>
            </div>
            <div class="row justify-between q-mb-sm">
              <span class="text-grey-7">ค่าจัดส่ง ({{ groups.length }} ร้าน)</span>
              <span :class="{ 'text-positive': shipping === 0 }">
                {{ shipping === 0 ? 'ฟรี' : `฿${shipping}` }}
              </span>
            </div>
            <div v-if="groups.length > 1" class="text-caption text-grey-6">
              สินค้าจากหลายร้านจะแยกเป็น {{ groups.length }} คำสั่งซื้อ
            </div>

            <q-separator class="q-my-md" />

            <div class="row justify-between items-center">
              <span class="text-subtitle1">ยอดรวม</span>
              <span class="total">฿{{ total.toLocaleString() }}</span>
            </div>

            <q-btn
              unelevated
              rounded
              size="lg"
              class="sp-gradient-btn full-width q-mt-lg"
              label="ไปชำระเงิน"
              icon-right="arrow_forward"
              :disable="hasProblem"
              @click="$router.push('/checkout')"
            />
            <q-btn flat class="full-width q-mt-sm" color="grey-7" label="เลือกซื้อสินค้าต่อ" to="/" />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { useCartStore } from '../stores/cart'
import { useCartGroups } from '../composables/useCartGroups'

const $q = useQuasar()
const cart = useCartStore()
const { detailedItems, groups, subtotal, shipping, total, hasProblem } = useCartGroups()

function inc(item) {
  const ok = cart.setQty(item.id, item.qty + 1)
  if (!ok) {
    $q.notify({
      message: `มีสินค้าเหลือ ${item.stock} ชิ้นเท่านั้น`,
      icon: 'info',
      color: 'warning',
      textColor: 'dark',
      position: 'top',
      timeout: 1500,
    })
  }
}

function removeItem(item) {
  cart.remove(item.id)
  $q.notify({
    message: 'นำสินค้าออกจากตะกร้าแล้ว',
    caption: item.name,
    icon: 'delete',
    color: 'grey-8',
    position: 'top',
    timeout: 1200,
  })
}
</script>

<style lang="scss" scoped>
.qty-box {
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 999px;
  padding: 2px 6px;
}

.qty-num {
  min-width: 32px;
  text-align: center;
  font-weight: 600;
}

.summary {
  position: sticky;
  top: 90px;
}

.total {
  font-size: 26px;
  font-weight: 700;
  color: var(--q-primary);
}
</style>
