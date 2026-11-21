<template>
  <q-page class="q-pb-xl">
    <div class="sp-container q-pt-lg">
      <div class="profile-hero">
        <div class="row items-center no-wrap" style="position: relative; z-index: 1">
          <q-avatar size="84px" color="white" text-color="primary" class="text-h4 text-weight-bold">
            <img v-if="auth.user.avatar" :src="auth.user.avatar" />
            <span v-else>{{ auth.user.name.charAt(0).toUpperCase() }}</span>
          </q-avatar>
          <div class="q-ml-lg">
            <div class="text-h5 text-weight-bold">{{ auth.user.name }}</div>
            <div style="opacity: 0.9">{{ auth.user.email }}</div>
            <q-chip dense color="white" text-color="primary" class="q-mt-xs q-ml-none">
              {{ roleLabel }}
            </q-chip>
          </div>
        </div>
      </div>

      <q-tabs
        v-model="tab"
        dense
        no-caps
        align="left"
        active-color="primary"
        indicator-color="primary"
        class="sp-card q-mt-md"
        outside-arrows
        mobile-arrows
      >
        <q-tab name="orders" icon="local_shipping" label="ติดตามคำสั่งซื้อ" />
        <q-tab name="info" icon="person" label="ข้อมูลของฉัน" />
        <q-tab name="address" icon="location_on" label="สมุดที่อยู่" />
        <q-tab name="wish" icon="favorite" label="ที่ถูกใจ" />
      </q-tabs>

      <q-tab-panels v-model="tab" animated class="bg-transparent q-mt-md">
        <!-- ติดตามคำสั่งซื้อ -->
        <q-tab-panel name="orders" class="q-pa-none">
          <div class="row q-col-gutter-md">
            <div v-for="s in summary" :key="s.label" class="col-6 col-md-3">
              <div class="sp-card q-pa-md text-center cursor-pointer" @click="$router.push('/orders')">
                <q-icon :name="s.icon" size="30px" color="primary" />
                <div class="text-h6 text-weight-bold">{{ s.count }}</div>
                <div class="text-caption text-grey-6">{{ s.label }}</div>
              </div>
            </div>
          </div>

          <div class="sp-card q-pa-md q-mt-md">
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle1 text-weight-bold">
                <q-icon name="local_shipping" color="primary" /> ของที่กำลังมาส่ง
              </div>
              <q-btn flat no-caps color="primary" label="ดูคำสั่งซื้อทั้งหมด" to="/orders" />
            </div>

            <div v-if="incoming.length">
              <div v-for="o in incoming" :key="o.id" class="incoming q-pa-md q-mb-sm">
                <div class="row items-center justify-between">
                  <div>
                    <span class="text-weight-bold">{{ shopName(o.shopId) }}</span>
                    <span class="text-caption text-grey-6 q-ml-sm">#{{ o.code }}</span>
                  </div>
                  <q-chip dense :color="STATUS[o.status].color" text-color="white" :icon="STATUS[o.status].icon">
                    {{ STATUS[o.status].label }}
                  </q-chip>
                </div>
                <div class="row items-center q-mt-xs">
                  <q-img
                    v-for="i in o.items.slice(0, 4)"
                    :key="i.id"
                    :src="i.image"
                    :ratio="1"
                    class="q-mr-sm"
                    style="width: 44px; border-radius: 8px"
                  />
                  <span v-if="o.items.length > 4" class="text-caption text-grey-6">+{{ o.items.length - 4 }}</span>
                </div>
                <div v-if="o.tracking" class="text-caption q-mt-xs">
                  <q-icon name="local_shipping" color="primary" /> เลขพัสดุ <b>{{ o.tracking }}</b>
                </div>
              </div>
            </div>
            <div v-else class="text-center q-py-lg text-grey-6">
              <q-icon name="inventory_2" size="48px" />
              <div class="q-mt-sm">ไม่มีสินค้าที่กำลังมาส่งในตอนนี้</div>
            </div>
          </div>
        </q-tab-panel>

        <!-- ข้อมูลของฉัน -->
        <q-tab-panel name="info" class="q-pa-none">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-7">
              <div class="sp-card q-pa-lg">
                <div class="text-subtitle1 text-weight-bold q-mb-md">ข้อมูลส่วนตัว</div>

                <div class="row items-center no-wrap q-mb-md">
                  <q-avatar size="72px" color="primary" text-color="white" class="text-h5">
                    <img v-if="profile.avatar" :src="profile.avatar" />
                    <span v-else>{{ (profile.name || '?').charAt(0).toUpperCase() }}</span>
                  </q-avatar>
                  <div class="col q-pl-md">
                    <q-file
                      v-model="avatarFile"
                      outlined
                      rounded
                      dense
                      accept="image/*"
                      label="เปลี่ยนรูปโปรไฟล์"
                      @update:model-value="onAvatar"
                    >
                      <template #prepend><q-icon name="photo_camera" /></template>
                    </q-file>
                  </div>
                </div>

                <q-form class="q-gutter-md" @submit.prevent="saveProfile">
                  <q-input v-model="profile.name" outlined rounded label="ชื่อที่แสดง" :rules="[req]" />
                  <q-input :model-value="auth.user.email" outlined rounded label="อีเมล (แก้ไม่ได้)" readonly>
                    <template #prepend><q-icon name="lock_outline" /></template>
                  </q-input>
                  <q-input
                    v-model="profile.phone"
                    outlined
                    rounded
                    label="เบอร์โทรศัพท์"
                    mask="###-###-####"
                    unmasked-value
                  />
                  <q-btn type="submit" unelevated rounded class="sp-gradient-btn" label="บันทึกข้อมูล" />
                </q-form>
              </div>
            </div>

            <div class="col-12 col-md-5">
              <div class="sp-card q-pa-lg">
                <div class="text-subtitle1 text-weight-bold q-mb-md">เปลี่ยนรหัสผ่าน</div>
                <q-form class="q-gutter-md" @submit.prevent="savePassword">
                  <q-input v-model="pw.old" outlined rounded type="password" label="รหัสผ่านเดิม" :rules="[req]" />
                  <q-input
                    v-model="pw.next"
                    outlined
                    rounded
                    type="password"
                    label="รหัสผ่านใหม่ (6 ตัวขึ้นไป)"
                    :rules="[req, (v) => v.length >= 6 || 'สั้นเกินไป']"
                  />
                  <q-input
                    v-model="pw.confirm"
                    outlined
                    rounded
                    type="password"
                    label="ยืนยันรหัสผ่านใหม่"
                    :rules="[req, (v) => v === pw.next || 'รหัสผ่านไม่ตรงกัน']"
                  />
                  <q-btn type="submit" unelevated rounded color="primary" label="เปลี่ยนรหัสผ่าน" />
                </q-form>
              </div>
            </div>
          </div>
        </q-tab-panel>

        <!-- สมุดที่อยู่ -->
        <q-tab-panel name="address" class="q-pa-none">
          <div class="sp-card q-pa-lg">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-subtitle1 text-weight-bold">สมุดที่อยู่จัดส่ง</div>
              <q-btn unelevated rounded class="sp-gradient-btn" icon="add" label="เพิ่มที่อยู่" @click="openAddr()" />
            </div>

            <div v-if="addresses.length">
              <div v-for="a in addresses" :key="a.id" class="addr q-pa-md q-mb-sm" :class="{ main: a.isDefault }">
                <div class="row items-start no-wrap">
                  <div class="col">
                    <div class="text-weight-bold">
                      {{ a.name }}
                      <span class="text-grey-6 text-weight-regular q-ml-sm">{{ a.phone }}</span>
                      <q-chip v-if="a.isDefault" dense color="primary" text-color="white" class="q-ml-sm">ที่อยู่หลัก</q-chip>
                    </div>
                    <div class="text-grey-7 q-mt-xs">{{ a.address }}</div>
                  </div>
                  <div class="column items-end">
                    <div>
                      <q-btn flat round dense color="primary" icon="edit" @click="openAddr(a)" />
                      <q-btn flat round dense color="negative" icon="delete_outline" @click="delAddr(a)" />
                    </div>
                    <q-btn
                      v-if="!a.isDefault"
                      flat
                      dense
                      no-caps
                      color="primary"
                      label="ตั้งเป็นที่อยู่หลัก"
                      @click="auth.setDefaultAddress(a.id)"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center q-py-lg text-grey-6">
              <q-icon name="location_off" size="48px" />
              <div class="q-mt-sm">ยังไม่มีที่อยู่ที่บันทึกไว้</div>
            </div>
          </div>
        </q-tab-panel>

        <!-- ที่ถูกใจ -->
        <q-tab-panel name="wish" class="q-pa-none">
          <div v-if="wishItems.length" class="row q-col-gutter-md">
            <div v-for="p in wishItems" :key="p.id" class="col-6 col-sm-4 col-md-3">
              <ProductCard :product="p" />
            </div>
          </div>
          <div v-else class="sp-card text-center q-py-xl">
            <q-icon name="favorite_border" size="64px" color="grey-5" />
            <div class="text-h6 q-mt-md">ยังไม่มีสินค้าที่ถูกใจ</div>
            <q-btn unelevated rounded class="sp-gradient-btn q-mt-lg" label="ไปเลือกสินค้า" to="/" />
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>

    <q-dialog v-model="addrDialog">
      <q-card style="width: 520px; max-width: 95vw; border-radius: 24px">
        <q-card-section class="row items-center">
          <div class="text-h6 text-weight-bold">{{ addrId ? 'แก้ไขที่อยู่' : 'เพิ่มที่อยู่ใหม่' }}</div>
          <q-space />
          <q-btn flat round dense icon="close" @click="addrDialog = false" />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-form class="q-gutter-md" @submit.prevent="saveAddr">
            <q-input v-model="addrForm.name" outlined rounded label="ชื่อผู้รับ" :rules="[req]" />
            <q-input
              v-model="addrForm.phone"
              outlined
              rounded
              label="เบอร์โทรศัพท์"
              mask="###-###-####"
              unmasked-value
              :rules="[req]"
            />
            <q-input v-model="addrForm.address" outlined type="textarea" rows="3" label="ที่อยู่" :rules="[req]" />
            <q-checkbox v-model="addrForm.isDefault" label="ตั้งเป็นที่อยู่หลัก" />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat rounded label="ยกเลิก" @click="addrDialog = false" />
              <q-btn type="submit" unelevated rounded class="sp-gradient-btn" label="บันทึก" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import ProductCard from '../components/ProductCard.vue'
import { uploadImage } from '../lib/upload'
import { useAuthStore } from '../stores/auth'
import { useOrderStore, STATUS } from '../stores/order'
import { useWishlistStore } from '../stores/wishlist'
import { getProductById, getShop } from '../stores/product'

const $q = useQuasar()
const auth = useAuthStore()
const orderStore = useOrderStore()
const wishlist = useWishlistStore()

const tab = ref('orders')
const req = (v) => !!v || 'กรุณากรอกข้อมูล'

onMounted(() => orderStore.load())

const roleLabel = computed(() => (auth.isAdmin ? 'แอดมิน' : auth.isSeller ? 'ผู้ขาย' : 'ผู้ซื้อ'))
const shopName = (id) => getShop(id)?.name || 'ร้านค้า'

// ----- คำสั่งซื้อ -----
const myOrders = computed(() => orderStore.byUser(auth.user.id).filter((o) => STATUS[o.status]))
const countOf = (list) => myOrders.value.filter((o) => list.includes(o.status)).length
const summary = computed(() => [
  { icon: 'payments', label: 'รอผู้ขายเตรียมของ', count: countOf(['paid']) },
  { icon: 'inventory_2', label: 'กำลังเตรียมสินค้า', count: countOf(['preparing']) },
  { icon: 'local_shipping', label: 'ที่ต้องได้รับ', count: countOf(['shipping']) },
  { icon: 'check_circle', label: 'สำเร็จแล้ว', count: countOf(['delivered']) },
])
const incoming = computed(() => myOrders.value.filter((o) => ['paid', 'preparing', 'shipping'].includes(o.status)))

// ----- ข้อมูลส่วนตัว -----
const profile = reactive({
  name: auth.user.name,
  phone: auth.user.phone || '',
  avatar: auth.user.avatar || '',
})
const avatarFile = ref(null)
const avatarUploading = ref(false)

async function onAvatar(f) {
  if (!f) return
  avatarUploading.value = true
  try {
    const { url } = await uploadImage(f, auth.user.id, 'avatars', 300)
    profile.avatar = url
    $q.notify({ message: 'อัปโหลดรูปแล้ว กด "บันทึกข้อมูล" เพื่อยืนยัน', icon: 'photo_camera', color: 'grey-8', position: 'top' })
  } catch (err) {
    console.error('AVATAR UPLOAD ERROR:', err)
    $q.notify({ message: 'อัปโหลดรูปไม่สำเร็จ: ' + err.message, color: 'negative', position: 'top' })
  } finally {
    avatarUploading.value = false
  }
}

function saveProfile() {
  if (avatarUploading.value) return
  auth.updateProfile({ name: profile.name, phone: profile.phone, avatar: profile.avatar })
  $q.notify({ message: 'บันทึกข้อมูลแล้ว', icon: 'check_circle', color: 'positive', position: 'top' })
}

const pw = reactive({ old: '', next: '', confirm: '' })
async function savePassword() {
  const res = await auth.changePassword(pw.old, pw.next)
  if (!res.ok) {
    $q.notify({ message: res.message, icon: 'error', color: 'negative', position: 'top' })
    return
  }
  Object.assign(pw, { old: '', next: '', confirm: '' })
  $q.notify({ message: 'เปลี่ยนรหัสผ่านแล้ว', icon: 'check_circle', color: 'positive', position: 'top' })
}

// ----- สมุดที่อยู่ -----
const addresses = computed(() => auth.user.addresses || [])
const addrDialog = ref(false)
const addrId = ref(null)
const addrForm = reactive({ name: '', phone: '', address: '', isDefault: false })

function openAddr(a = null) {
  addrId.value = a ? a.id : null
  Object.assign(addrForm, {
    name: a?.name || auth.user.name,
    phone: a?.phone || auth.user.phone || '',
    address: a?.address || '',
    isDefault: a ? a.isDefault : addresses.value.length === 0,
  })
  addrDialog.value = true
}

function saveAddr() {
  auth.saveAddress({ ...addrForm }, addrId.value)
  addrDialog.value = false
  $q.notify({ message: 'บันทึกที่อยู่แล้ว', icon: 'check_circle', color: 'positive', position: 'top' })
}

function delAddr(a) {
  if (!window.confirm('ลบที่อยู่นี้ใช่ไหม')) return
  auth.removeAddress(a.id)
}

// ----- ที่ถูกใจ -----
const wishItems = computed(() => wishlist.ids.map((id) => getProductById(id)).filter(Boolean))
</script>

<style lang="scss" scoped>
.profile-hero {
  position: relative;
  overflow: hidden;
  background: var(--sp-gradient);
  color: white;
  border-radius: 28px;
  padding: 36px 40px;
  box-shadow: 0 16px 40px rgba(255, 77, 109, 0.25);

  &::after {
    content: '';
    position: absolute;
    right: -60px;
    top: -60px;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
  }
}

.incoming {
  border: 1.5px solid rgba(255, 122, 69, 0.25);
  border-radius: 16px;
}

.addr {
  border: 1.5px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;

  &.main {
    border-color: var(--q-primary);
    background: rgba(255, 122, 69, 0.05);
  }
}

@media (max-width: 600px) {
  .profile-hero {
    padding: 24px;
  }
}
</style>
