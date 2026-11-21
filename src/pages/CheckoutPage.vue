<template>
  <q-page class="q-pb-xl">
    <div class="sp-container q-pt-lg">
      <div class="text-h5 text-weight-bold q-mb-md">ชำระเงิน</div>

      <div v-if="!detailedItems.length" class="sp-card text-center q-py-xl">
        <q-icon name="shopping_bag" size="72px" color="grey-5" />
        <div class="text-h6 q-mt-md">ไม่มีสินค้าในตะกร้า</div>
        <q-btn unelevated rounded class="sp-gradient-btn q-mt-lg" label="ไปเลือกสินค้า" to="/" />
      </div>

      <div v-else class="row q-col-gutter-lg">
        <div class="col-12 col-md-8">
          <!-- ที่อยู่ -->
          <div class="sp-card q-pa-lg q-mb-md">
            <div class="text-subtitle1 text-weight-bold q-mb-md">
              <q-icon name="location_on" color="primary" /> ที่อยู่จัดส่ง
            </div>

            <div v-if="saved.length" class="q-mb-lg">
              <div class="text-caption text-grey-6 q-mb-xs">เลือกจากที่อยู่ที่บันทึกไว้</div>
              <div class="row q-gutter-sm">
                <div
                  v-for="a in saved"
                  :key="a.id"
                  class="addr-pick cursor-pointer"
                  :class="{ active: pickedId === a.id }"
                  @click="pick(a)"
                >
                  <div class="text-weight-medium text-body2">
                    {{ a.name }}
                    <q-chip v-if="a.isDefault" dense size="sm" color="primary" text-color="white">หลัก</q-chip>
                  </div>
                  <div class="text-caption text-grey-7 ellipsis-2-lines">{{ a.address }}</div>
                </div>
              </div>
            </div>

            <q-form ref="formRef" class="q-gutter-md q-mt-sm">
              <q-input v-model="form.name" outlined rounded label="ชื่อ-นามสกุล" :rules="[req]" />
              <q-input
                v-model="form.phone"
                outlined
                rounded
                label="เบอร์โทรศัพท์"
                mask="###-###-####"
                unmasked-value
                :rules="[req]"
              />
              <q-input v-model="form.address" outlined type="textarea" rows="3" label="ที่อยู่" :rules="[req]" />
              <q-checkbox v-if="!pickedId" v-model="saveNew" label="บันทึกเป็นที่อยู่ในสมุดที่อยู่" />
            </q-form>
          </div>

          <!-- วิธีชำระเงิน -->
          <div class="sp-card q-pa-lg">
            <div class="text-subtitle1 text-weight-bold q-mb-md">
              <q-icon name="payments" color="primary" /> วิธีชำระเงิน
            </div>
            <div class="column q-gutter-sm">
              <div
                v-for="m in methods"
                :key="m.value"
                class="pay-option row items-center cursor-pointer"
                :class="{ active: payment === m.value }"
                @click="payment = m.value"
              >
                <q-icon :name="m.icon" size="28px" class="q-mr-md" />
                <div class="col">
                  <div class="text-weight-medium">{{ m.label }}</div>
                  <div class="text-caption text-grey-6">{{ m.desc }}</div>
                </div>
                <q-icon v-if="payment === m.value" name="check_circle" color="primary" />
              </div>
            </div>
          </div>
        </div>

        <!-- สรุป -->
        <div class="col-12 col-md-4">
          <div class="sp-card q-pa-lg summary">
            <div class="text-h6 text-weight-bold q-mb-md">สรุปคำสั่งซื้อ</div>

            <div v-for="g in groups" :key="g.shopId" class="q-mb-md">
              <div class="text-weight-bold text-body2 q-mb-xs">
                <q-icon name="storefront" color="primary" /> {{ g.shop?.name }}
              </div>
              <div v-for="i in g.items" :key="i.id" class="row justify-between q-mb-xs text-body2">
                <span class="ellipsis col q-pr-md">{{ i.name }} x{{ i.qty }}</span>
                <span>฿{{ (i.price * i.qty).toLocaleString() }}</span>
              </div>
              <div class="row justify-between text-caption text-grey-6">
                <span>ค่าจัดส่ง</span>
                <span :class="{ 'text-positive': g.shipping === 0 }">
                  {{ g.shipping === 0 ? 'ฟรี' : `฿${g.shipping}` }}
                </span>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="row justify-between items-center">
              <span class="text-subtitle1">ยอดรวม</span>
              <span class="total">฿{{ total.toLocaleString() }}</span>
            </div>
            <div v-if="groups.length > 1" class="text-caption text-grey-6 q-mt-xs">
              จะแยกเป็น {{ groups.length }} คำสั่งซื้อตามร้านค้า
            </div>

            <q-btn
              unelevated
              rounded
              size="lg"
              class="sp-gradient-btn full-width q-mt-lg"
              :label="`ชำระเงิน ฿${total.toLocaleString()}`"
              :disable="hasProblem"
              @click="pay"
            />
            <div v-if="hasProblem" class="text-caption text-negative q-mt-sm text-center">
              มีสินค้าหมดหรือเกินสต็อก กลับไปแก้ที่ตะกร้าก่อนนะ
            </div>
          </div>
        </div>
      </div>
    </div>

    <q-dialog v-model="paying" persistent>
      <q-card class="q-pa-xl text-center" style="border-radius: 24px; min-width: 280px">
        <q-spinner-orbit color="primary" size="64px" />
        <div class="text-subtitle1 q-mt-md">กำลังดำเนินการชำระเงิน...</div>
        <div class="text-caption text-grey-6">กรุณาอย่าปิดหน้านี้</div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useCartStore } from '../stores/cart'
import { useOrderStore } from '../stores/order'
import { useAuthStore } from '../stores/auth'
import { useProductStore } from '../stores/product'
import { useCartGroups } from '../composables/useCartGroups'

const router = useRouter()
const $q = useQuasar()
const cart = useCartStore()
const orderStore = useOrderStore()
const auth = useAuthStore()
const productStore = useProductStore()
const { detailedItems, groups, total, hasProblem } = useCartGroups()

const formRef = ref(null)
const paying = ref(false)
const payment = ref('promptpay')
const saveNew = ref(false)

const saved = computed(() => auth.user?.addresses || [])
const defaultAddr = saved.value.find((a) => a.isDefault) || null
const pickedId = ref(defaultAddr ? defaultAddr.id : null)

const form = reactive({
  name: defaultAddr?.name || auth.user?.name || '',
  phone: defaultAddr?.phone || auth.user?.phone || '',
  address: defaultAddr?.address || '',
})

function pick(a) {
  pickedId.value = a.id
  Object.assign(form, { name: a.name, phone: a.phone, address: a.address })
}

const methods = [
  { value: 'promptpay', label: 'พร้อมเพย์ / QR Code', desc: 'สแกนจ่ายผ่านแอปธนาคาร', icon: 'qr_code_2' },
  { value: 'card', label: 'บัตรเครดิต / เดบิต', desc: 'Visa, Mastercard, JCB', icon: 'credit_card' },
  { value: 'cod', label: 'เก็บเงินปลายทาง', desc: 'ชำระเงินสดเมื่อได้รับสินค้า', icon: 'local_shipping' },
]

const req = (v) => !!v || 'กรุณากรอกข้อมูล'
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function pay() {
  const ok = await formRef.value.validate()
  if (!ok) {
    $q.notify({ message: 'กรอกข้อมูลที่อยู่ให้ครบก่อนนะ', color: 'negative', position: 'top' })
    return
  }
  if (hasProblem.value) {
    $q.notify({ message: 'มีสินค้าหมดหรือเกินสต็อก', color: 'negative', position: 'top' })
    return
  }

  paying.value = true
  const made = []
  let failMsg = ''
  try {
    await wait(1200)
    const label = methods.find((m) => m.value === payment.value).label

    // สั่งทีละร้าน (1 ร้าน = 1 ออเดอร์)
    for (const g of groups.value) {
      const res = await orderStore.place({
        shopId: g.shopId,
        items: g.items.map((i) => ({ id: i.id, qty: i.qty })),
        address: { ...form },
        payment: label,
      })
      if (!res.ok) {
        failMsg = res.message
        break
      }
      made.push(res.order)
    }

    if (made.length && saveNew.value && !pickedId.value) {
      auth.saveAddress({ ...form, isDefault: saved.value.length === 0 })
    }

    // โหลดตะกร้า/สต็อก/ออเดอร์ใหม่จากฐานข้อมูล
    await Promise.all([cart.load(), productStore.load(), orderStore.load()])

    if (failMsg) {
      $q.notify({
        message: 'สั่งซื้อไม่สำเร็จ: ' + failMsg,
        caption: made.length ? `สั่งสำเร็จแล้ว ${made.length} ร้าน ส่วนที่เหลือยังอยู่ในตะกร้า` : '',
        color: 'negative',
        position: 'top',
        timeout: 4000,
      })
    }
    if (made.length) router.push(`/success/${made.map((o) => o.id).join('_')}`)
  } catch (err) {
    console.error('PAY ERROR:', err)
    $q.notify({ message: 'ชำระเงินไม่สำเร็จ: ' + err.message, color: 'negative', position: 'top' })
  } finally {
    paying.value = false
  }
}
</script>

<style lang="scss" scoped>
.addr-pick {
  width: 220px;
  padding: 10px 14px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(255, 122, 69, 0.5);
  }

  &.active {
    border-color: var(--q-primary);
    background: rgba(255, 122, 69, 0.06);
  }
}

.pay-option {
  border: 2px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 14px 16px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(255, 122, 69, 0.5);
  }

  &.active {
    border-color: var(--q-primary);
    background: rgba(255, 122, 69, 0.06);
  }
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
