import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

export const STATUS = {
  paid: { label: 'ชำระเงินแล้ว', color: 'info', icon: 'payments' },
  preparing: { label: 'กำลังเตรียมสินค้า', color: 'warning', icon: 'inventory_2' },
  shipping: { label: 'กำลังจัดส่ง', color: 'primary', icon: 'local_shipping' },
  delivered: { label: 'ได้รับสินค้าแล้ว', color: 'positive', icon: 'check_circle' },
  cancelled: { label: 'ยกเลิกแล้ว', color: 'grey-7', icon: 'cancel' },
}

const mapOrder = (r) => ({
  id: r.id,
  code: r.code,
  userId: r.user_id,
  shopId: r.shop_id,
  items: (r.items || []).map((i) => ({ ...i })),
  subtotal: r.subtotal,
  shipping: r.shipping,
  total: r.total,
  address: r.address || {},
  payment: r.payment,
  status: r.status,
  tracking: r.tracking,
  timeline: r.timeline || [],
  createdAt: r.created_at,
})

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: [],
    loaded: false,
  }),

  getters: {
    byUser() {
      return (userId) => this.orders.filter((o) => o.userId === userId)
    },
    byShop() {
      return (shopId) => this.orders.filter((o) => o.shopId === shopId)
    },
  },

  actions: {
    // RLS ทำให้แต่ละคนได้เฉพาะออเดอร์ที่เกี่ยวข้อง (ผู้ซื้อ / ผู้ขายของร้านนั้น / แอดมิน)
    async load() {
      if (!useAuthStore().currentId) {
        this.orders = []
        this.loaded = true
        return
      }
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) console.error('LOAD ORDERS ERROR:', error)
      else this.orders = data.map(mapOrder)
      this.loaded = true
    },

    // สั่งซื้อ 1 ร้าน (ราคา/สต็อกคิดที่ฐานข้อมูล)
    async place({ shopId, items, address, payment }) {
      const { data, error } = await supabase.rpc('place_order', {
        p_shop_id: shopId,
        p_items: items,
        p_address: address,
        p_payment: payment,
      })
      if (error) {
        console.error('PLACE ORDER ERROR:', error)
        return { ok: false, message: error.message }
      }
      return { ok: true, order: mapOrder(data) }
    },

    async _act(id, action) {
      const { error } = await supabase.rpc('update_order_status', { p_order: id, p_action: action })
      if (error) {
        console.error('ORDER ACTION ERROR:', error)
        return { ok: false, message: error.message }
      }
      await this.load()
      return { ok: true }
    },

    markPreparing(id) {
      return this._act(id, 'prepare')
    },
    markShipping(id) {
      return this._act(id, 'ship')
    },
    confirmReceived(id) {
      return this._act(id, 'receive')
    },
    cancel(id) {
      return this._act(id, 'cancel')
    },
  },
})
