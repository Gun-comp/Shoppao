import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

export const useReviewStore = defineStore('review', {
  state: () => ({
    reviews: [],
    loaded: false,
  }),

  getters: {
    byProduct() {
      return (productId) =>
        this.reviews
          .filter((r) => String(r.productId) === String(productId))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    stats() {
      return (productId) => {
        const list = this.byProduct(productId)
        const count = list.length
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        list.forEach((r) => dist[r.rating]++)
        const avg = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0
        return { count, avg: Math.round(avg * 10) / 10, dist }
      }
    },
    hasReviewed() {
      return (orderId, productId) =>
        this.reviews.some((r) => r.orderId === orderId && String(r.productId) === String(productId))
    },
  },

  actions: {
    // รีวิวเป็นข้อมูลสาธารณะ ใครก็อ่านได้
    async load() {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.error('LOAD REVIEWS ERROR:', error)
        return
      }

      // ดึงชื่อ/รูปผู้รีวิวจาก view สาธารณะ
      const ids = [...new Set(data.map((r) => r.user_id))]
      const people = {}
      if (ids.length) {
        const res = await supabase.from('public_profiles').select('id, name, avatar_url').in('id', ids)
        if (!res.error && res.data) res.data.forEach((p) => (people[p.id] = p))
      }

      this.reviews = data.map((r) => ({
        id: r.id,
        productId: r.product_id,
        orderId: r.order_id,
        userId: r.user_id,
        userName: people[r.user_id]?.name || 'ผู้ใช้',
        userAvatar: people[r.user_id]?.avatar_url || '',
        rating: r.rating,
        comment: r.comment,
        reply: r.reply,
        repliedAt: r.replied_at,
        createdAt: r.created_at,
      }))
      this.loaded = true
    },

    // ฐานข้อมูลตรวจเองว่าออเดอร์เป็นของผู้ใช้ ได้รับสินค้าแล้ว และมีสินค้านี้
    async add({ productId, orderId, rating, comment }) {
      const auth = useAuthStore()
      if (!auth.user) return { ok: false, message: 'กรุณาเข้าสู่ระบบ' }

      const { error } = await supabase.from('reviews').insert({
        product_id: productId,
        order_id: orderId,
        user_id: auth.user.id,
        rating,
        comment: comment.trim(),
      })
      if (error) {
        console.error('ADD REVIEW ERROR:', error)
        if (error.code === '23505') return { ok: false, message: 'รีวิวสินค้านี้ไปแล้ว' }
        if (error.code === '42501') return { ok: false, message: 'รีวิวได้เฉพาะสินค้าที่คุณได้รับแล้ว' }
        return { ok: false, message: error.message }
      }
      await this.load()
      return { ok: true }
    },

    async reply(reviewId, text) {
      const { error } = await supabase.rpc('reply_review', { p_review: reviewId, p_text: text })
      if (error) {
        console.error('REPLY REVIEW ERROR:', error)
        return { ok: false, message: error.message }
      }
      await this.load()
      return { ok: true }
    },
  },
})
