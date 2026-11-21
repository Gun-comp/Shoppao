<template>
  <q-page class="q-pb-xl">
    <div class="sp-container q-pt-lg" style="max-width: 680px">
      <div v-if="!shop.loaded" class="text-center q-py-xl"><q-spinner color="primary" size="40px" /></div>

      <!-- ถูกปิดร้าน -->
      <div v-else-if="myShop && myShop.status === 'closed'" class="sp-card q-pa-xl text-center">
        <q-icon name="block" size="72px" color="grey-6" />
        <div class="text-h5 text-weight-bold q-mt-md">ร้านนี้ถูกปิดโดยผู้ดูแลระบบ</div>
        <div class="text-grey-6 q-mt-sm">หากคิดว่าเกิดข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ</div>
        <q-btn unelevated rounded class="sp-gradient-btn q-mt-lg" label="กลับหน้าแรก" to="/" />
      </div>

      <!-- รออนุมัติ -->
      <div v-else-if="myShop && myShop.status === 'pending'" class="sp-card q-pa-xl text-center">
        <q-icon name="hourglass_top" size="72px" color="warning" />
        <div class="text-h5 text-weight-bold q-mt-md">ส่งคำขอเปิดร้านแล้ว</div>
        <div class="text-grey-6 q-mt-sm">
          ร้าน "{{ myShop.name }}" กำลังรอผู้ดูแลระบบตรวจสอบ<br />
          เมื่ออนุมัติแล้วคุณจะเข้าจัดการร้านและเพิ่มสินค้าได้ทันที
        </div>
        <div class="text-caption text-grey-6 q-mt-md">ส่งเมื่อ {{ fmt(myShop.appliedAt) }}</div>
        <div class="row justify-center q-gutter-sm q-mt-lg">
          <q-btn outline rounded color="primary" icon="refresh" label="เช็กสถานะ" :loading="checking" @click="check" />
          <q-btn unelevated rounded class="sp-gradient-btn" label="กลับหน้าแรก" to="/" />
        </div>
      </div>

      <!-- ฟอร์ม -->
      <div v-else class="sp-card q-pa-lg">
        <div class="text-center q-mb-lg">
          <q-icon name="storefront" size="64px" color="primary" />
          <div class="text-h5 text-weight-bold q-mt-sm">สมัครเปิดร้านค้าบน Shoppao</div>
          <div class="text-grey-6">กรอกข้อมูลให้ครบ ผู้ดูแลระบบจะตรวจสอบก่อนเปิดร้านให้</div>
        </div>

        <q-banner v-if="myShop && myShop.status === 'rejected'" rounded class="bg-red-1 text-negative q-mb-md">
          <template #avatar><q-icon name="error_outline" color="negative" /></template>
          คำขอก่อนหน้าไม่ได้รับการอนุมัติ: <b>{{ myShop.rejectReason || 'ไม่ระบุเหตุผล' }}</b><br />
          แก้ไขข้อมูลแล้วส่งใหม่ได้เลย
        </q-banner>

        <q-form class="q-gutter-md" @submit.prevent="submit">
          <div class="text-subtitle2 text-weight-bold">ข้อมูลร้านค้า</div>
          <q-input
            v-model="form.name"
            outlined
            rounded
            label="ชื่อร้านค้า"
            counter
            maxlength="40"
            :rules="[req, (v) => !shop.nameTaken(v, myShop?.id) || 'ชื่อร้านนี้ถูกใช้แล้ว']"
          />
          <q-select
            v-model="form.category"
            outlined
            rounded
            emit-value
            map-options
            :options="categoryOptions"
            label="หมวดหมู่หลักของร้าน"
            :rules="[req]"
          />
          <q-input
            v-model="form.description"
            outlined
            type="textarea"
            rows="3"
            label="แนะนำร้านค้า"
            counter
            maxlength="300"
            :rules="[req]"
          />

          <q-separator />
          <div class="text-subtitle2 text-weight-bold">ข้อมูลผู้ขาย (ใช้ยืนยันตัวตน)</div>
          <q-input v-model="form.ownerName" outlined rounded label="ชื่อ-นามสกุลตามบัตรประชาชน" :rules="[req]" />
          <q-input
            v-model="form.phone"
            outlined
            rounded
            label="เบอร์โทรศัพท์"
            mask="###-###-####"
            unmasked-value
            :rules="[req, (v) => v.length === 10 || 'กรอกเบอร์ให้ครบ 10 หลัก']"
          />
          <q-input
            v-model="form.idCard"
            outlined
            rounded
            label="เลขบัตรประชาชน 13 หลัก"
            mask="#-####-#####-##-#"
            unmasked-value
            hint="ระบบเก็บเฉพาะ 4 หลักสุดท้ายเพื่อให้ผู้ดูแลตรวจสอบ"
            :rules="[req, (v) => v.length === 13 || 'กรอกให้ครบ 13 หลัก']"
          />
          <q-input v-model="form.address" outlined type="textarea" rows="2" label="ที่อยู่ร้าน/ที่อยู่ติดต่อ" :rules="[req]" />

          <q-checkbox v-model="agree" label="ฉันยืนยันว่าข้อมูลถูกต้อง และยอมรับเงื่อนไขการเป็นผู้ขายของ Shoppao" />

          <q-btn
            type="submit"
            unelevated
            rounded
            size="lg"
            class="sp-gradient-btn full-width"
            :label="myShop ? 'ส่งคำขออีกครั้ง' : 'ส่งคำขอเปิดร้าน'"
            icon="send"
            :disable="!agree"
            :loading="sending"
          />
        </q-form>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { categories } from '../data/categories'
import { useAuthStore } from '../stores/auth'
import { useShopStore } from '../stores/shop'

const $q = useQuasar()
const router = useRouter()
const auth = useAuthStore()
const shop = useShopStore()

const myShop = computed(() => shop.byOwner(auth.user?.id))
const agree = ref(false)
const sending = ref(false)
const checking = ref(false)
const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }))

const form = reactive({
  name: '',
  category: null,
  description: '',
  ownerName: auth.user?.name || '',
  phone: auth.user?.phone || '',
  idCard: '',
  address: '',
})

// เติมข้อมูลเดิมเมื่อโหลดร้านเสร็จ (กรณีเคยถูกปฏิเสธ)
let filled = false
watch(
  myShop,
  (s) => {
    if (s && !filled) {
      filled = true
      form.name = s.name
      form.category = s.category
      form.description = s.description
    }
  },
  { immediate: true },
)

const req = (v) => (v !== null && v !== '' && v !== undefined) || 'กรุณากรอกข้อมูล'
const fmt = (iso) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

async function submit() {
  sending.value = true
  try {
    const res = await shop.apply({
      ownerId: auth.user.id,
      name: form.name.trim(),
      category: form.category,
      description: form.description,
      ownerName: form.ownerName.trim(),
      phone: form.phone,
      idCardLast4: form.idCard.slice(-4),
      address: form.address,
    })
    if (!res.ok) {
      $q.notify({ message: 'ส่งคำขอไม่สำเร็จ: ' + res.message, color: 'negative', position: 'top' })
      return
    }
    $q.notify({ message: 'ส่งคำขอเปิดร้านแล้ว', caption: 'รอผู้ดูแลระบบตรวจสอบ', icon: 'send', color: 'positive', position: 'top' })
  } finally {
    sending.value = false
  }
}

async function check() {
  checking.value = true
  await shop.load()
  await auth.refreshProfile()
  checking.value = false
  if (auth.isSeller) {
    $q.notify({ message: 'ร้านของคุณได้รับอนุมัติแล้ว!', icon: 'celebration', color: 'positive', position: 'top' })
    router.replace('/seller')
  } else {
    $q.notify({ message: 'ยังรออนุมัติอยู่', icon: 'hourglass_top', color: 'grey-8', position: 'top' })
  }
}
</script>
