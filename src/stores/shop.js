import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

export const SHOP_STATUS = {
  pending: { label: 'รออนุมัติ', color: 'warning' },
  approved: { label: 'อนุมัติแล้ว', color: 'positive' },
  rejected: { label: 'ไม่อนุมัติ', color: 'negative' },
  closed: { label: 'ถูกปิดร้าน', color: 'grey-7' },
}

const mapShop = (r) => ({
  id: r.id,
  ownerId: r.owner_id,
  name: r.name,
  description: r.description,
  category: r.category,
  logo: r.logo_url,
  cover: r.cover_url,
  status: r.status,
  rejectReason: r.reject_reason,
  appliedAt: r.applied_at,
  approvedAt: r.approved_at,
  createdAt: r.created_at,
})

export const useShopStore = defineStore('shop', {
  state: () => ({
    shops: [],
    kyc: {},
    loaded: false,
  }),

  getters: {
    byOwner: (state) => (ownerId) => state.shops.find((s) => s.ownerId === ownerId) || null,
    approved: (state) => state.shops.filter((s) => s.status === 'approved'),
    pending: (state) => state.shops.filter((s) => s.status === 'pending'),
    nameTaken: (state) => (name, exceptId = null) =>
      state.shops.some((s) => s.id !== exceptId && s.name.trim().toLowerCase() === name.trim().toLowerCase()),
  },

  actions: {
    async load() {
      const { data, error } = await supabase.from('shops').select('*').order('created_at', { ascending: true })
      if (error) {
        console.error('LOAD SHOPS ERROR:', error)
      } else {
        this.shops = data.map(mapShop)
      }

      const auth = useAuthStore()
      if (auth.isAdmin) {
        const res = await supabase.from('shop_kyc').select('*')
        if (!res.error && res.data) {
          const map = {}
          res.data.forEach((k) => {
            map[k.shop_id] = {
              ownerName: k.owner_name,
              phone: k.phone,
              idCardLast4: k.id_card_last4,
              address: k.address,
            }
          })
          this.kyc = map
        }
      } else {
        this.kyc = {}
      }
      this.loaded = true
    },

    async apply(d) {
      const old = this.byOwner(d.ownerId)
      let shopId = old?.id

      if (old) {
        const { error } = await supabase
          .from('shops')
          .update({ name: d.name, description: d.description, category: d.category, status: 'pending' })
          .eq('id', old.id)
        if (error) return this._fail(error)
      } else {
        const { data, error } = await supabase
          .from('shops')
          .insert({ owner_id: d.ownerId, name: d.name, description: d.description, category: d.category })
          .select()
          .single()
        if (error) return this._fail(error)
        shopId = data.id
      }

      const { error: e2 } = await supabase.from('shop_kyc').upsert({
        shop_id: shopId,
        owner_name: d.ownerName,
        phone: d.phone,
        id_card_last4: d.idCardLast4,
        address: d.address,
      })
      if (e2) return this._fail(e2)

      await this.load()
      return { ok: true }
    },

    // แก้คำอธิบาย โลโก้ ภาพปก (ชื่อร้านแก้ไม่ได้หลังอนุมัติ)
    async updateInfo(shopId, d) {
      const { error } = await supabase
        .from('shops')
        .update({ description: d.description, logo_url: d.logo, cover_url: d.cover })
        .eq('id', shopId)
      if (error) return this._fail(error)
      await this.load()
      return { ok: true }
    },

    async approve(shopId) {
      const { error } = await supabase.rpc('approve_shop', { p_shop: shopId })
      if (error) return this._fail(error)
      await this.load()
      await useAuthStore().loadUsers()
      return { ok: true }
    },

    async reject(shopId, reason) {
      const { error } = await supabase.rpc('reject_shop', { p_shop: shopId, p_reason: reason })
      if (error) return this._fail(error)
      await this.load()
      return { ok: true }
    },

    async close(shopId) {
      const { error } = await supabase.rpc('close_shop', { p_shop: shopId })
      if (error) return this._fail(error)
      await this.load()
      await useAuthStore().loadUsers()
      return { ok: true }
    },

    _fail(error) {
      console.error('SHOP ERROR:', error)
      const msg = error.code === '23505' ? 'ชื่อร้านนี้ถูกใช้แล้ว' : error.message
      return { ok: false, message: msg }
    },
  },
})
