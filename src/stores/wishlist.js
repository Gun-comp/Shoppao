import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

export const useWishlistStore = defineStore('wishlist', {
  state: () => ({
    ids: [],
  }),

  getters: {
    count: (state) => state.ids.length,
    has: (state) => (productId) => state.ids.includes(productId),
  },

  actions: {
    async load() {
      const id = useAuthStore().currentId
      if (!id) {
        this.ids = []
        return
      }
      const { data, error } = await supabase.from('wishlist_items').select('product_id').eq('user_id', id)
      if (error) console.error('LOAD WISHLIST ERROR:', error)
      else this.ids = data.map((r) => r.product_id)
    },

    // true = เพิ่ม, false = เอาออก, null = ยังไม่ล็อกอิน
    toggle(productId) {
      const id = useAuthStore().currentId
      if (!id) return null

      if (this.ids.includes(productId)) {
        this.ids = this.ids.filter((x) => x !== productId)
        supabase
          .from('wishlist_items')
          .delete()
          .eq('user_id', id)
          .eq('product_id', productId)
          .then(({ error }) => error && console.error('WISHLIST REMOVE ERROR:', error))
        return false
      }

      this.ids = [...this.ids, productId]
      supabase
        .from('wishlist_items')
        .insert({ user_id: id, product_id: productId })
        .then(({ error }) => error && console.error('WISHLIST ADD ERROR:', error))
      return true
    },
  },
})
