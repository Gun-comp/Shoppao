import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import { useProductStore } from './product'

const uid = () => useAuthStore().currentId

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [], // [{ id: productId, qty }]
    loaded: false,
  }),

  getters: {
    totalQty: (state) => state.items.reduce((sum, i) => sum + i.qty, 0),
  },

  actions: {
    async load() {
      const id = uid()
      if (!id) {
        this.items = []
        this.loaded = true
        return
      }
      const { data, error } = await supabase.from('cart_items').select('product_id, qty').eq('user_id', id)
      if (error) console.error('LOAD CART ERROR:', error)
      else this.items = data.map((r) => ({ id: r.product_id, qty: r.qty }))
      this.loaded = true
    },

    _save(productId, qty) {
      const id = uid()
      if (!id) return
      const i = this.items.findIndex((x) => x.id === productId)
      if (i === -1) this.items.push({ id: productId, qty })
      else this.items[i].qty = qty

      supabase
        .from('cart_items')
        .upsert({ user_id: id, product_id: productId, qty })
        .then(({ error }) => error && console.error('SAVE CART ERROR:', error))
    },

    add(productId, qty = 1) {
      if (!uid()) return { ok: false, message: 'กรุณาเข้าสู่ระบบก่อน' }

      const p = useProductStore().byId(productId)
      if (!p) return { ok: false, message: 'ไม่พบสินค้านี้' }
      if (p.stock <= 0) return { ok: false, message: 'สินค้าหมดแล้ว' }

      const have = this.items.find((i) => i.id === productId)?.qty || 0
      if (have + qty > p.stock) {
        return { ok: false, message: `มีสินค้าเหลือ ${p.stock} ชิ้น (อยู่ในตะกร้าแล้ว ${have} ชิ้น)` }
      }
      this._save(productId, have + qty)
      return { ok: true }
    },

    // คืน false ถ้าถูกจำกัดด้วยสต็อก
    setQty(productId, qty) {
      if (!uid()) return true
      if (qty <= 0) {
        this.remove(productId)
        return true
      }
      const p = useProductStore().byId(productId)
      const max = p ? p.stock : qty
      const finalQty = Math.min(qty, Math.max(max, 1))
      this._save(productId, finalQty)
      return finalQty === qty
    },

    remove(productId) {
      const id = uid()
      if (!id) return
      this.items = this.items.filter((i) => i.id !== productId)
      supabase
        .from('cart_items')
        .delete()
        .eq('user_id', id)
        .eq('product_id', productId)
        .then(({ error }) => error && console.error('REMOVE CART ERROR:', error))
    },

    clear() {
      const id = uid()
      this.items = []
      if (!id) return
      supabase
        .from('cart_items')
        .delete()
        .eq('user_id', id)
        .then(({ error }) => error && console.error('CLEAR CART ERROR:', error))
    },
  },
})
