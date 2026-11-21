<template>
  <q-page class="q-pb-xl">
    <div class="sp-container q-pt-lg">
      <div v-if="!shop.loaded || !product.loaded" class="text-center q-py-xl">
        <q-spinner color="primary" size="40px" />
      </div>

      <div v-else-if="myShop">
        <!-- หัวร้าน (ภาพปก + โลโก้) -->
        <div class="sp-card shop-head">
          <div class="cover" :style="myShop.cover ? { backgroundImage: `url(${myShop.cover})` } : {}"></div>
          <div class="row items-end no-wrap q-px-lg q-pb-lg head-row">
            <q-avatar size="88px" class="sp-gradient-btn text-h4 text-weight-bold avatar-ring">
              <img v-if="myShop.logo" :src="myShop.logo" />
              <span v-else>{{ myShop.name.charAt(0).toUpperCase() }}</span>
            </q-avatar>
            <div class="q-ml-md col">
              <div class="text-h5 text-weight-bold">{{ myShop.name }}</div>
              <div class="text-grey-6">{{ myShop.description }}</div>
            </div>
            <div class="q-gutter-sm gt-xs">
              <q-btn outline rounded no-caps color="primary" icon="edit" label="แก้ไขร้าน" @click="openShopEdit" />
              <q-btn outline rounded no-caps color="primary" icon="visibility" label="ดูหน้าร้าน" :to="`/shop/${myShop.id}`" />
            </div>
          </div>
          <div class="lt-sm q-px-lg q-pb-md">
            <q-btn outline rounded no-caps color="primary" icon="edit" label="แก้ไขร้าน" @click="openShopEdit" />
          </div>
        </div>

        <div class="sp-card q-pa-md q-mt-md">
          <q-tabs v-model="tab" dense no-caps align="left" active-color="primary" indicator-color="primary">
            <q-tab name="dashboard" icon="insights" label="ภาพรวม" />
            <q-tab name="products" label="สินค้าของร้าน" />
            <q-tab name="orders" label="ออเดอร์ของร้าน">
              <q-badge v-if="pendingCount" color="accent" rounded floating>{{ pendingCount }}</q-badge>
            </q-tab>
          </q-tabs>
          <q-separator class="q-mb-md" />

          <q-tab-panels v-model="tab" animated class="bg-transparent">
            <!-- ภาพรวม -->
            <q-tab-panel name="dashboard" class="q-pa-none">
              <SellerDashboard :shop-id="myShop.id" @goto="tab = $event" />
            </q-tab-panel>

            <!-- สินค้า -->
            <q-tab-panel name="products" class="q-pa-none">
              <div class="row items-center justify-between q-mb-md">
                <div class="text-subtitle1 text-weight-bold">
                  สินค้าทั้งหมด
                  <span class="text-caption text-grey-6">({{ myProducts.length }} รายการ)</span>
                </div>
                <q-btn unelevated rounded class="sp-gradient-btn" icon="add" label="เพิ่มสินค้า" @click="openAdd" />
              </div>

              <q-table v-if="myProducts.length" flat :rows="myProducts" :columns="columns" row-key="id" :rows-per-page-options="[10, 20, 0]">
                <template #body-cell-image="props">
                  <q-td :props="props">
                    <q-img :src="props.row.image" :ratio="1" style="width: 52px; border-radius: 10px" />
                    <div v-if="props.row.gallery.length > 1" class="text-caption text-grey-6">
                      {{ props.row.gallery.length }} รูป
                    </div>
                  </q-td>
                </template>
                <template #body-cell-price="props">
                  <q-td :props="props">฿{{ props.row.price.toLocaleString() }}</q-td>
                </template>
                <template #body-cell-stock="props">
                  <q-td :props="props">
                    <q-chip v-if="props.row.stock <= 0" dense color="negative" text-color="white">หมด</q-chip>
                    <span v-else :class="{ 'text-warning text-weight-bold': props.row.stock <= 5 }">{{ props.row.stock }}</span>
                  </q-td>
                </template>
                <template #body-cell-actions="props">
                  <q-td :props="props">
                    <q-btn flat round dense color="primary" icon="edit" @click="openEdit(props.row)" />
                    <q-btn flat round dense color="negative" icon="delete_outline" @click="removeProduct(props.row)" />
                  </q-td>
                </template>
              </q-table>

              <div v-else class="text-center q-py-xl text-grey-6">
                <q-icon name="inventory_2" size="64px" />
                <div class="q-mt-sm">ยังไม่มีสินค้า กด "เพิ่มสินค้า" เพื่อเริ่มขายได้เลย</div>
              </div>
            </q-tab-panel>

            <!-- ออเดอร์ -->
            <q-tab-panel name="orders" class="q-pa-none">
              <div class="row items-center q-mb-md">
                <q-btn-toggle
                  v-model="orderFilter"
                  no-caps
                  rounded
                  unelevated
                  toggle-color="primary"
                  color="grey-3"
                  text-color="grey-8"
                  :options="filterOptions"
                />
                <q-space />
                <q-btn flat round icon="refresh" color="primary" :loading="refreshing" @click="refreshOrders">
                  <q-tooltip>รีเฟรชออเดอร์</q-tooltip>
                </q-btn>
              </div>

              <div v-if="shownOrders.length">
                <div v-for="o in shownOrders" :key="o.id" class="order-box q-pa-md q-mb-md">
                  <div class="row items-center justify-between">
                    <div>
                      <span class="text-weight-bold">#{{ o.code }}</span>
                      <span class="text-caption text-grey-6 q-ml-sm">{{ fmt(o.createdAt) }}</span>
                    </div>
                    <q-chip dense :color="STATUS[o.status].color" text-color="white" :icon="STATUS[o.status].icon">
                      {{ STATUS[o.status].label }}
                    </q-chip>
                  </div>

                  <div class="text-caption text-grey-7 q-mt-xs">
                    <q-icon name="person" /> {{ o.address.name }} · {{ o.address.phone }}<br />
                    <q-icon name="location_on" /> {{ o.address.address }}
                  </div>

                  <q-separator class="q-my-sm" />

                  <div v-for="i in o.items" :key="i.id" class="row items-center no-wrap q-py-xs">
                    <q-img :src="i.image" :ratio="1" style="width: 48px; min-width: 48px; border-radius: 10px" />
                    <div class="col q-px-md text-body2">{{ i.name }} <span class="text-grey-6">x{{ i.qty }}</span></div>
                    <div class="text-body2">฿{{ (i.price * i.qty).toLocaleString() }}</div>
                  </div>

                  <div v-if="o.tracking" class="text-caption q-mt-xs">
                    <q-icon name="local_shipping" color="primary" /> เลขพัสดุ <b>{{ o.tracking }}</b>
                  </div>

                  <q-separator class="q-my-sm" />

                  <div class="row items-center justify-between">
                    <span>
                      ยอดรวม
                      <span class="text-primary text-weight-bold">฿{{ o.total.toLocaleString() }}</span>
                    </span>

                    <div class="q-gutter-sm">
                      <q-btn
                        v-if="o.status === 'paid'"
                        unelevated
                        rounded
                        no-caps
                        class="sp-gradient-btn"
                        icon="inventory_2"
                        label="รับออเดอร์ / เริ่มเตรียมสินค้า"
                        :loading="busy === o.id"
                        @click="act(o, 'prepare')"
                      />
                      <q-btn
                        v-if="o.status === 'preparing'"
                        unelevated
                        rounded
                        no-caps
                        class="sp-gradient-btn"
                        icon="local_shipping"
                        label="ส่งสินค้า (สร้างเลขพัสดุ)"
                        :loading="busy === o.id"
                        @click="act(o, 'ship')"
                      />
                      <q-btn
                        v-if="['paid', 'preparing'].includes(o.status)"
                        outline
                        rounded
                        no-caps
                        color="negative"
                        label="ยกเลิก"
                        @click="act(o, 'cancel')"
                      />
                      <span v-if="o.status === 'shipping'" class="text-caption text-grey-6">
                        รอผู้ซื้อกดยืนยันการรับสินค้า
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="text-center q-py-xl text-grey-6">
                <q-icon name="receipt_long" size="64px" />
                <div class="q-mt-sm">ยังไม่มีออเดอร์ในหมวดนี้</div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </div>

      <div v-else class="sp-card q-pa-xl text-center text-grey-6">
        <q-icon name="storefront" size="64px" />
        <div class="q-mt-sm">ไม่พบร้านค้าของคุณ</div>
        <q-btn flat color="primary" label="สมัครเปิดร้านค้า" to="/seller/open" class="q-mt-md" />
      </div>
    </div>

    <!-- ฟอร์มสินค้า -->
    <q-dialog v-model="dialog" persistent>
      <q-card style="width: 680px; max-width: 95vw; border-radius: 24px">
        <q-card-section class="row items-center">
          <div class="text-h6 text-weight-bold">{{ editingId ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่' }}</div>
          <q-space />
          <q-btn flat round dense icon="close" @click="closeDialog" />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form class="q-gutter-md" @submit.prevent="save">
            <div>
              <div class="text-subtitle2 q-mb-xs">
                รูปสินค้า ({{ form.images.length }}/5)
                <span class="text-caption text-grey-6">รูปแรกคือรูปหลัก กดดาวเพื่อตั้งรูปหลัก</span>
              </div>
              <div class="row q-gutter-sm">
                <div v-for="(im, i) in form.images" :key="im.url" class="img-box">
                  <q-img :src="im.url" :ratio="1" style="border-radius: 14px" />
                  <q-chip v-if="i === 0" dense color="primary" text-color="white" class="main-chip">รูปหลัก</q-chip>
                  <q-btn round dense size="sm" color="negative" icon="close" class="rm-btn" @click="removeImg(i)" />
                  <q-btn
                    v-if="i > 0"
                    round
                    dense
                    size="sm"
                    color="white"
                    text-color="primary"
                    icon="star"
                    class="star-btn"
                    @click="makeMain(i)"
                  >
                    <q-tooltip>ตั้งเป็นรูปหลัก</q-tooltip>
                  </q-btn>
                </div>

                <div v-if="form.images.length < 5" class="img-add cursor-pointer" @click="pickFiles">
                  <q-spinner v-if="uploading" color="primary" size="28px" />
                  <template v-else>
                    <q-icon name="add_photo_alternate" size="28px" color="primary" />
                    <div class="text-caption text-grey-7">เพิ่มรูป</div>
                  </template>
                </div>
              </div>
              <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onFiles" />
              <div class="text-caption text-grey-6 q-mt-xs">เลือกได้หลายไฟล์พร้อมกัน (สูงสุด 5 รูป)</div>
            </div>

            <q-input v-model="form.name" outlined rounded label="ชื่อสินค้า" maxlength="80" counter :rules="[req]" />

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-4">
                <q-input v-model.number="form.price" outlined rounded type="number" label="ราคา (฿)" :rules="[req, (v) => v > 0 || 'ราคาต้องมากกว่า 0']" />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model.number="form.oldPrice" outlined rounded type="number" label="ราคาเดิม (ถ้าลดราคา)" :rules="[(v) => !v || v > form.price || 'ต้องมากกว่าราคาขาย']" />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model.number="form.stock" outlined rounded type="number" label="จำนวนในสต็อก" :rules="[req, (v) => v >= 0 || 'ห้ามติดลบ']" />
              </div>
            </div>

            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="form.category"
                  outlined
                  rounded
                  emit-value
                  map-options
                  :options="categoryOptions"
                  label="หมวดหมู่หลัก"
                  :rules="[req]"
                  @update:model-value="form.sub = null"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select v-model="form.sub" outlined rounded emit-value map-options :options="subOptions" label="หมวดย่อย" :disable="!subOptions.length" :rules="[req]" />
              </div>
            </div>

            <q-input v-model="form.description" outlined type="textarea" rows="3" label="รายละเอียดสินค้า" :rules="[req]" />

            <div class="row justify-end q-gutter-sm">
              <q-btn flat rounded no-caps label="ยกเลิก" @click="closeDialog" />
              <q-btn type="submit" unelevated rounded no-caps class="sp-gradient-btn" :label="editingId ? 'บันทึก' : 'เพิ่มสินค้า'" :loading="saving" :disable="uploading" />
            </div>
          </q-form>
        </q-card-section>

        <q-inner-loading :showing="saving" label="กำลังบันทึกสินค้า..." label-class="text-primary text-weight-bold" />
      </q-card>
    </q-dialog>

    <!-- แก้ไขร้าน -->
    <q-dialog v-model="shopDialog" persistent>
      <q-card style="width: 560px; max-width: 95vw; border-radius: 24px">
        <q-card-section class="row items-center">
          <div class="text-h6 text-weight-bold">แก้ไขร้านค้า</div>
          <q-space />
          <q-btn flat round dense icon="close" @click="closeShopEdit" />
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-md">
          <div>
            <div class="text-subtitle2 q-mb-xs">ภาพปกร้าน</div>
            <div class="cover-preview" :style="shopForm.cover ? { backgroundImage: `url(${shopForm.cover})` } : {}">
              <q-spinner v-if="upCover" color="white" size="32px" />
            </div>
            <q-file v-model="coverFile" outlined rounded dense accept="image/*" label="เลือกภาพปก" class="q-mt-sm" @update:model-value="onCover">
              <template #prepend><q-icon name="panorama" /></template>
            </q-file>
          </div>

          <div class="row items-center no-wrap">
            <q-avatar size="72px" class="sp-gradient-btn text-h5 text-weight-bold">
              <img v-if="shopForm.logo" :src="shopForm.logo" />
              <span v-else>{{ myShop?.name?.charAt(0).toUpperCase() }}</span>
            </q-avatar>
            <div class="col q-pl-md">
              <q-file v-model="logoFile" outlined rounded dense accept="image/*" label="เลือกโลโก้ร้าน" @update:model-value="onLogo">
                <template #prepend><q-icon name="image" /></template>
              </q-file>
              <q-linear-progress v-if="upLogo" indeterminate rounded class="q-mt-xs" />
            </div>
          </div>

          <q-input v-model="shopForm.description" outlined type="textarea" rows="3" label="แนะนำร้านค้า" counter maxlength="300" />
          <div class="text-caption text-grey-6">ชื่อร้านแก้ไม่ได้หลังได้รับอนุมัติ</div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat rounded no-caps label="ยกเลิก" @click="closeShopEdit" />
          <q-btn unelevated rounded no-caps class="sp-gradient-btn" label="บันทึก" :loading="savingShop" :disable="upCover || upLogo" @click="saveShop" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import SellerDashboard from '../components/SellerDashboard.vue'
import { categories } from '../data/categories'
import { uploadImage, removeImages } from '../lib/upload'
import { useAuthStore } from '../stores/auth'
import { useShopStore } from '../stores/shop'
import { useProductStore } from '../stores/product'
import { useOrderStore, STATUS } from '../stores/order'

const $q = useQuasar()
const auth = useAuthStore()
const shop = useShopStore()
const product = useProductStore()
const orderStore = useOrderStore()

const tab = ref('dashboard')
const orderFilter = ref('todo')
const busy = ref('')
const refreshing = ref(false)

const myShop = computed(() => shop.byOwner(auth.user?.id))
const myProducts = computed(() => (myShop.value ? product.byShop(myShop.value.id) : []))
const myOrders = computed(() => (myShop.value ? orderStore.byShop(myShop.value.id) : []))
const pendingCount = computed(() => myOrders.value.filter((o) => o.status === 'paid').length)

onMounted(() => orderStore.load())

async function refreshOrders() {
  refreshing.value = true
  await orderStore.load()
  refreshing.value = false
}

const filterOptions = [
  { label: 'ต้องดำเนินการ', value: 'todo' },
  { label: 'กำลังจัดส่ง', value: 'shipping' },
  { label: 'สำเร็จ', value: 'delivered' },
  { label: 'ยกเลิก', value: 'cancelled' },
  { label: 'ทั้งหมด', value: 'all' },
]

const shownOrders = computed(() => {
  const f = orderFilter.value
  if (f === 'all') return myOrders.value
  if (f === 'todo') return myOrders.value.filter((o) => ['paid', 'preparing'].includes(o.status))
  return myOrders.value.filter((o) => o.status === f)
})

const columns = [
  { name: 'image', label: '', field: 'image', align: 'left' },
  { name: 'name', label: 'สินค้า', field: 'name', align: 'left', sortable: true },
  { name: 'price', label: 'ราคา', field: 'price', align: 'right', sortable: true },
  { name: 'stock', label: 'สต็อก', field: 'stock', align: 'right', sortable: true },
  { name: 'sold', label: 'ขายแล้ว', field: 'sold', align: 'right' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

const fmt = (iso) => new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

// ----- จัดการออเดอร์ -----
async function act(o, action) {
  if (action === 'cancel' && !window.confirm(`ยกเลิกออเดอร์ #${o.code} ใช่ไหม สินค้าจะถูกคืนเข้าสต็อก`)) return
  busy.value = o.id
  const fn = {
    prepare: () => orderStore.markPreparing(o.id),
    ship: () => orderStore.markShipping(o.id),
    cancel: () => orderStore.cancel(o.id),
  }[action]
  const res = await fn()
  busy.value = ''
  if (res.ok) {
    await product.load()
    $q.notify({ message: 'อัปเดตสถานะออเดอร์แล้ว', icon: 'check_circle', color: 'positive', position: 'top' })
  } else {
    $q.notify({ message: 'ทำรายการไม่สำเร็จ: ' + res.message, icon: 'error', color: 'negative', position: 'top' })
  }
}

// ----- ฟอร์มสินค้า (หลายรูป) -----
const dialog = ref(false)
const saving = ref(false)
const uploading = ref(false)
const editingId = ref(null)
const fileInput = ref(null)
const emptyForm = () => ({
  name: '',
  price: null,
  oldPrice: null,
  stock: 10,
  category: null,
  sub: null,
  description: '',
  images: [],
})
const form = reactive(emptyForm())

const categoryOptions = categories.map((c) => ({ label: c.name, value: c.id }))
const subOptions = computed(
  () => categories.find((c) => c.id === form.category)?.subs.map((s) => ({ label: s.name, value: s.id })) || [],
)

const req = (v) => (v !== null && v !== '' && v !== undefined) || 'กรุณากรอกข้อมูล'

function openAdd() {
  editingId.value = null
  Object.assign(form, emptyForm())
  dialog.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, emptyForm(), {
    name: row.name,
    price: row.price,
    oldPrice: row.oldPrice,
    stock: row.stock,
    category: row.category,
    sub: row.sub,
    description: row.description,
    images: row.images.map((i) => ({ ...i, saved: true })),
  })
  dialog.value = true
}

function pickFiles() {
  if (!uploading.value) fileInput.value?.click()
}

async function onFiles(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (!files.length) return

  const room = 5 - form.images.length
  if (files.length > room) {
    $q.notify({ message: `เพิ่มได้อีก ${room} รูป (สูงสุด 5 รูป)`, color: 'warning', textColor: 'dark', position: 'top' })
  }

  uploading.value = true
  for (const f of files.slice(0, room)) {
    try {
      const { url, path } = await uploadImage(f, auth.user.id, 'products', 1000)
      form.images.push({ url, path, saved: false })
    } catch (err) {
      console.error('UPLOAD ERROR:', err)
      $q.notify({ message: 'อัปโหลดไม่สำเร็จ: ' + err.message, color: 'negative', position: 'top' })
    }
  }
  uploading.value = false
}

function removeImg(i) {
  const [im] = form.images.splice(i, 1)
  if (im && !im.saved) removeImages(im.path)
}

function makeMain(i) {
  const [im] = form.images.splice(i, 1)
  form.images.unshift(im)
}

function closeDialog() {
  removeImages(form.images.filter((i) => !i.saved).map((i) => i.path))
  dialog.value = false
}

async function save() {
  if (saving.value || uploading.value) return
  if (!form.images.length) {
    $q.notify({ message: 'กรุณาอัปโหลดรูปสินค้าอย่างน้อย 1 รูป', color: 'warning', textColor: 'dark', position: 'top' })
    return
  }

  saving.value = true
  try {
    const data = {
      name: form.name.trim(),
      price: Math.round(Number(form.price)),
      oldPrice: form.oldPrice ? Math.round(Number(form.oldPrice)) : null,
      stock: Math.round(Number(form.stock)),
      category: form.category,
      sub: form.sub,
      description: form.description,
      images: form.images.map((i) => ({ id: i.id, url: i.url, path: i.path, position: i.position })),
    }
    const res = editingId.value
      ? await product.update(editingId.value, data)
      : await product.add({ ...data, shopId: myShop.value.id })

    if (!res.ok) {
      $q.dialog({
        title: 'บันทึกไม่สำเร็จ',
        message: res.message,
        ok: { label: 'ตกลง', color: 'negative', rounded: true, unelevated: true },
      })
      return
    }

    dialog.value = false
    $q.dialog({
      title: editingId.value ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ!',
      message: `บันทึก "${data.name}" เรียบร้อยแล้ว`,
      ok: { label: 'ตกลง', color: 'primary', rounded: true, unelevated: true },
    })
  } finally {
    saving.value = false
  }
}

async function removeProduct(row) {
  if (!window.confirm(`ลบ "${row.name}" ใช่ไหม`)) return
  const res = await product.remove(row.id)
  $q.notify({
    message: res.ok ? 'ลบสินค้าแล้ว' : 'ลบไม่สำเร็จ: ' + res.message,
    icon: res.ok ? 'delete' : 'error',
    color: res.ok ? 'grey-8' : 'negative',
    position: 'top',
  })
}

// ----- แก้ไขร้าน -----
const shopDialog = ref(false)
const savingShop = ref(false)
const upLogo = ref(false)
const upCover = ref(false)
const logoFile = ref(null)
const coverFile = ref(null)
const shopForm = reactive({ description: '', logo: '', cover: '' })
let newShopPaths = []

function openShopEdit() {
  newShopPaths = []
  logoFile.value = null
  coverFile.value = null
  Object.assign(shopForm, {
    description: myShop.value.description || '',
    logo: myShop.value.logo || '',
    cover: myShop.value.cover || '',
  })
  shopDialog.value = true
}

async function onLogo(f) {
  if (!f) return
  upLogo.value = true
  try {
    const { url, path } = await uploadImage(f, auth.user.id, 'shop', 400)
    shopForm.logo = url
    newShopPaths.push(path)
  } catch (err) {
    $q.notify({ message: 'อัปโหลดโลโก้ไม่สำเร็จ: ' + err.message, color: 'negative', position: 'top' })
  } finally {
    upLogo.value = false
  }
}

async function onCover(f) {
  if (!f) return
  upCover.value = true
  try {
    const { url, path } = await uploadImage(f, auth.user.id, 'shop', 1400)
    shopForm.cover = url
    newShopPaths.push(path)
  } catch (err) {
    $q.notify({ message: 'อัปโหลดภาพปกไม่สำเร็จ: ' + err.message, color: 'negative', position: 'top' })
  } finally {
    upCover.value = false
  }
}

function closeShopEdit() {
  removeImages(newShopPaths)
  newShopPaths = []
  shopDialog.value = false
}

async function saveShop() {
  savingShop.value = true
  const res = await shop.updateInfo(myShop.value.id, {
    description: shopForm.description,
    logo: shopForm.logo,
    cover: shopForm.cover,
  })
  savingShop.value = false
  if (!res.ok) {
    $q.notify({ message: 'บันทึกไม่สำเร็จ: ' + res.message, color: 'negative', position: 'top' })
    return
  }
  newShopPaths = []
  shopDialog.value = false
  $q.notify({ message: 'บันทึกข้อมูลร้านแล้ว', icon: 'check_circle', color: 'positive', position: 'top' })
}
</script>

<style lang="scss" scoped>
.order-box {
  border: 1.5px solid rgba(255, 122, 69, 0.25);
  border-radius: 18px;
}

.shop-head {
  overflow: hidden;
  padding: 0;
}

.cover {
  height: 150px;
  background: var(--sp-gradient);
  background-size: cover;
  background-position: center;
}

.head-row {
  margin-top: -44px;
  position: relative;
}

.avatar-ring {
  border: 4px solid var(--sp-card);
}

.cover-preview {
  height: 120px;
  border-radius: 16px;
  background: var(--sp-gradient);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.img-box {
  position: relative;
  width: 96px;
}

.main-chip {
  position: absolute;
  left: 2px;
  bottom: 2px;
  margin: 0;
}

.rm-btn {
  position: absolute;
  top: -6px;
  right: -6px;
}

.star-btn {
  position: absolute;
  top: -6px;
  left: -6px;
}

.img-add {
  width: 96px;
  height: 96px;
  border: 2px dashed rgba(255, 122, 69, 0.5);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 122, 69, 0.08);
  }
}
</style>