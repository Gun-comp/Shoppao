<template>
  <q-page class="q-pb-xl">
    <div class="sp-container q-pt-lg">
      <div class="text-h5 text-weight-bold q-mb-md">
        <q-icon name="admin_panel_settings" color="primary" /> แผงควบคุมผู้ดูแลระบบ
      </div>

      <div class="row q-col-gutter-md q-mb-lg">
        <div v-for="s in stats" :key="s.label" class="col-6 col-md-3">
          <div class="sp-card q-pa-md text-center">
            <q-icon :name="s.icon" size="32px" color="primary" />
            <div class="text-h5 text-weight-bold">{{ s.value }}</div>
            <div class="text-caption text-grey-6">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="sp-card q-pa-md">
        <q-tabs v-model="tab" dense no-caps align="left" active-color="primary" indicator-color="primary">
          <q-tab name="requests" label="คำขอเปิดร้าน">
            <q-badge v-if="shop.pending.length" color="accent" rounded floating>{{ shop.pending.length }}</q-badge>
          </q-tab>
          <q-tab name="shops" label="ร้านค้า" />
          <q-tab name="users" label="ผู้ใช้ทั้งหมด" />
        </q-tabs>
        <q-separator class="q-mb-md" />

        <q-tab-panels v-model="tab" animated class="bg-transparent">
          <!-- คำขอเปิดร้าน -->
          <q-tab-panel name="requests" class="q-pa-none">
            <div v-if="pendingRows.length">
              <div v-for="s in pendingRows" :key="s.id" class="req-box q-pa-md q-mb-md">
                <div class="row items-start no-wrap">
                  <q-avatar size="52px" class="sp-gradient-btn text-h6 text-weight-bold">
                    {{ s.name.charAt(0).toUpperCase() }}
                  </q-avatar>
                  <div class="col q-pl-md">
                    <div class="text-subtitle1 text-weight-bold">{{ s.name }}</div>
                    <div class="text-grey-7">{{ s.description }}</div>
                    <div class="text-caption text-grey-6 q-mt-xs">
                      หมวด: {{ catName(s.category) }} · ส่งเมื่อ {{ fmt(s.appliedAt) }}
                    </div>
                  </div>
                </div>

                <q-separator class="q-my-sm" />

                <div class="row q-col-gutter-sm text-body2">
                  <div class="col-12 col-sm-6"><q-icon name="person" color="primary" /> {{ s.ownerName }} ({{ s.ownerAccount }})</div>
                  <div class="col-12 col-sm-6"><q-icon name="phone" color="primary" /> {{ s.phone }}</div>
                  <div class="col-12 col-sm-6"><q-icon name="badge" color="primary" /> บัตรประชาชน x-xxxx-xxxxx-xx-{{ s.idCardLast4 }}</div>
                  <div class="col-12 col-sm-6"><q-icon name="location_on" color="primary" /> {{ s.address }}</div>
                </div>

                <div class="row justify-end q-gutter-sm q-mt-sm">
                  <q-btn outline rounded no-caps color="negative" icon="close" label="ปฏิเสธ" @click="openReject(s)" />
                  <q-btn unelevated rounded no-caps class="sp-gradient-btn" icon="check" label="อนุมัติเปิดร้าน" :loading="busy === s.id" @click="approve(s)" />
                </div>
              </div>
            </div>
            <div v-else class="text-center q-py-xl text-grey-6">
              <q-icon name="inbox" size="64px" />
              <div class="q-mt-sm">ไม่มีคำขอเปิดร้านที่รออนุมัติ</div>
            </div>
          </q-tab-panel>

          <!-- ร้านค้า -->
          <q-tab-panel name="shops" class="q-pa-none">
            <q-table flat :rows="shopRows" :columns="shopCols" row-key="id" no-data-label="ยังไม่มีร้านค้า">
              <template #body-cell-status="props">
                <q-td :props="props">
                  <q-chip dense text-color="white" :color="SHOP_STATUS[props.row.status].color">
                    {{ SHOP_STATUS[props.row.status].label }}
                  </q-chip>
                </q-td>
              </template>
              <template #body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    v-if="props.row.status === 'approved'"
                    flat
                    dense
                    no-caps
                    color="negative"
                    icon="block"
                    label="ปิดร้าน"
                    @click="closeShop(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>

          <!-- ผู้ใช้ -->
          <q-tab-panel name="users" class="q-pa-none">
            <q-table flat :rows="userRows" :columns="userCols" row-key="id" no-data-label="ยังไม่มีผู้ใช้">
              <template #body-cell-role="props">
                <q-td :props="props">
                  <q-chip dense text-color="white" :color="roleColor(props.row.role)">
                    {{ roleLabel(props.row.role) }}
                  </q-chip>
                </q-td>
              </template>
            </q-table>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>

    <!-- ปฏิเสธคำขอ -->
    <q-dialog v-model="rejectOpen">
      <q-card style="width: 440px; max-width: 92vw; border-radius: 24px">
        <q-card-section>
          <div class="text-h6 text-weight-bold">ปฏิเสธคำขอเปิดร้าน</div>
          <div class="text-grey-7 q-mt-xs">ร้าน "{{ target?.name }}"</div>
          <q-input v-model="rejectReason" outlined type="textarea" rows="3" class="q-mt-md" label="เหตุผล (ผู้สมัครจะเห็นข้อความนี้)" />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat rounded label="ยกเลิก" @click="rejectOpen = false" />
          <q-btn unelevated rounded color="negative" label="ปฏิเสธ" @click="doReject" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ยืนยันปิดร้าน -->
    <q-dialog v-model="confirmOpen">
      <q-card style="width: 400px; max-width: 92vw; border-radius: 24px">
        <q-card-section>
          <div class="text-h6 text-weight-bold">ปิดร้านค้า</div>
          <div class="q-mt-sm text-grey-7">ปิดร้าน "{{ target?.name }}" ใช่ไหม สินค้าจะถูกซ่อนและเจ้าของร้านกลับไปเป็นผู้ซื้อ</div>
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat rounded label="ยกเลิก" @click="confirmOpen = false" />
          <q-btn unelevated rounded color="negative" label="ปิดร้าน" @click="doCloseShop" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { categories } from '../data/categories'
import { useAuthStore } from '../stores/auth'
import { useShopStore, SHOP_STATUS } from '../stores/shop'

const $q = useQuasar()
const auth = useAuthStore()
const shop = useShopStore()

const tab = ref('requests')
const confirmOpen = ref(false)
const rejectOpen = ref(false)
const rejectReason = ref('')
const target = ref(null)
const busy = ref('')

const roleLabel = (r) => ({ admin: 'แอดมิน', seller: 'ผู้ขาย', user: 'ผู้ซื้อ' })[r] || r
const roleColor = (r) => ({ admin: 'negative', seller: 'accent', user: 'grey-6' })[r] || 'grey'
const fmt = (iso) => (iso ? new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-')
const userName = (id) => auth.users.find((u) => u.id === id)?.name || '-'
const catName = (id) => categories.find((c) => c.id === id)?.name || '-'

const pendingRows = computed(() =>
  shop.pending.map((s) => ({
    ...s,
    ownerName: shop.kyc[s.id]?.ownerName || '-',
    phone: shop.kyc[s.id]?.phone || '-',
    idCardLast4: shop.kyc[s.id]?.idCardLast4 || '----',
    address: shop.kyc[s.id]?.address || '-',
    ownerAccount: auth.users.find((u) => u.id === s.ownerId)?.email || '-',
  })),
)

const userRows = computed(() =>
  auth.users.map((u) => ({ ...u, shopName: shop.byOwner(u.id)?.name || '-', created: fmt(u.createdAt) })),
)

const shopRows = computed(() =>
  shop.shops.map((s) => ({ ...s, ownerAccount: userName(s.ownerId), created: fmt(s.createdAt) })),
)

const stats = computed(() => [
  { icon: 'group', label: 'ผู้ใช้ทั้งหมด', value: auth.users.length },
  { icon: 'storefront', label: 'ร้านที่อนุมัติแล้ว', value: shop.approved.length },
  { icon: 'pending_actions', label: 'คำขอรออนุมัติ', value: shop.pending.length },
  { icon: 'block', label: 'ร้านที่ถูกปิด', value: shop.shops.filter((s) => s.status === 'closed').length },
])

const userCols = [
  { name: 'name', label: 'ชื่อ', field: 'name', align: 'left', sortable: true },
  { name: 'email', label: 'อีเมล', field: 'email', align: 'left' },
  { name: 'role', label: 'Role', field: 'role', align: 'left', sortable: true },
  { name: 'shopName', label: 'ร้านค้า', field: 'shopName', align: 'left' },
  { name: 'created', label: 'สมัครเมื่อ', field: 'created', align: 'left' },
]
const shopCols = [
  { name: 'name', label: 'ชื่อร้าน', field: 'name', align: 'left', sortable: true },
  { name: 'ownerAccount', label: 'เจ้าของ', field: 'ownerAccount', align: 'left' },
  { name: 'status', label: 'สถานะ', field: 'status', align: 'left' },
  { name: 'created', label: 'สร้างเมื่อ', field: 'created', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]

const toast = (res, okMsg) =>
  $q.notify({
    message: res.ok ? okMsg : 'ไม่สำเร็จ: ' + res.message,
    icon: res.ok ? 'check_circle' : 'error',
    color: res.ok ? 'positive' : 'negative',
    position: 'top',
  })

async function approve(s) {
  busy.value = s.id
  const res = await shop.approve(s.id)
  busy.value = ''
  toast(res, `อนุมัติร้าน "${s.name}" แล้ว`)
}

function openReject(s) {
  target.value = s
  rejectReason.value = ''
  rejectOpen.value = true
}

async function doReject() {
  if (!rejectReason.value.trim()) {
    $q.notify({ message: 'กรุณาใส่เหตุผลที่ปฏิเสธ', color: 'warning', textColor: 'dark', position: 'top' })
    return
  }
  const res = await shop.reject(target.value.id, rejectReason.value.trim())
  rejectOpen.value = false
  toast(res, 'ปฏิเสธคำขอแล้ว')
}

function closeShop(s) {
  target.value = s
  confirmOpen.value = true
}

async function doCloseShop() {
  const res = await shop.close(target.value.id)
  confirmOpen.value = false
  toast(res, 'ปิดร้านเรียบร้อย')
}
</script>

<style lang="scss" scoped>
.req-box {
  border: 1.5px solid rgba(255, 122, 69, 0.3);
  border-radius: 18px;
}
</style>
