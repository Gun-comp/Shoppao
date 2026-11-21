import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import { removeImages } from '../lib/upload'
import { useShopStore } from './shop'
import { useReviewStore } from './review'

const mapProduct = (r, imgs = []) => {
  const images = imgs
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((i) => ({ id: i.id, url: i.url, path: i.path, position: i.position }))
  const image = images[0]?.url || r.image_url || `https://picsum.photos/seed/${r.id}/600/600`
  return {
    id: r.id,
    shopId: r.shop_id,
    name: r.name,
    description: r.description,
    price: r.price,
    oldPrice: r.old_price,
    stock: r.stock,
    sold: r.sold,
    category: r.category,
    sub: r.sub,
    images, // รูปในระบบไฟล์ (มี id/path)
    gallery: images.length ? images.map((i) => i.url) : [image], // ลิงก์สำหรับแสดงแกลเลอรี
    image, // รูปหลัก (ตะกร้า/ออเดอร์/การ์ดใช้ตัวนี้)
    rating: 0,
    createdAt: r.created_at,
  }
}

export const useProductStore = defineStore('product', {
  state: () => ({
    items: [],
    loaded: false,
  }),

  getters: {
    all(state) {
      const ok = new Set(useShopStore().approved.map((s) => s.id))
      const reviews = useReviewStore()
      return state.items
        .filter((p) => ok.has(p.shopId))
        .map((p) => {
          const st = reviews.stats(p.id)
          return st.count ? { ...p, rating: st.avg, reviewCount: st.count } : { ...p, reviewCount: 0 }
        })
    },
    byId() {
      return (id) => this.all.find((p) => String(p.id) === String(id)) || null
    },
    byShop() {
      return (shopId) => this.all.filter((p) => p.shopId === shopId)
    },
    similar() {
      return (product, limit = 8) => {
        if (!product) return []
        const others = this.all.filter((p) => p.id !== product.id)
        const sameSub = product.sub ? others.filter((p) => p.sub === product.sub) : []
        const sameCat = others.filter((p) => p.category === product.category && !sameSub.includes(p))
        return [...sameSub, ...sameCat].slice(0, limit)
      }
    },
  },

  actions: {
    async load() {
      const [prodRes, imgRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('product_images').select('*'),
      ])
      if (prodRes.error) {
        console.error('LOAD PRODUCTS ERROR:', prodRes.error)
      } else {
        if (imgRes.error) console.error('LOAD IMAGES ERROR:', imgRes.error)
        const byProduct = {}
        ;(imgRes.data || []).forEach((i) => {
          ;(byProduct[i.product_id] ||= []).push(i)
        })
        this.items = prodRes.data.map((r) => mapProduct(r, byProduct[r.id] || []))
      }
      await useReviewStore().load()
      this.loaded = true
    },

    // images = [{ id?, url, path, position? }] ลำดับแรกคือรูปหลัก
    async _saveImages(productId, images, original) {
      const keep = new Set(images.filter((i) => i.id).map((i) => i.id))
      const removed = original.filter((o) => !keep.has(o.id))

      if (removed.length) {
        const { error } = await supabase
          .from('product_images')
          .delete()
          .in('id', removed.map((r) => r.id))
        if (error) return { ok: false, message: error.message }
        await removeImages(removed.map((r) => r.path))
      }

      for (let i = 0; i < images.length; i++) {
        const im = images[i]
        if (im.id) {
          if (im.position !== i) {
            const { error } = await supabase.from('product_images').update({ position: i }).eq('id', im.id)
            if (error) return { ok: false, message: error.message }
          }
        } else {
          const { error } = await supabase
            .from('product_images')
            .insert({ product_id: productId, url: im.url, path: im.path, position: i })
          if (error) return { ok: false, message: error.message }
        }
      }
      return { ok: true }
    },

    async add(d) {
      const { data, error } = await supabase
        .from('products')
        .insert({
          shop_id: d.shopId,
          name: d.name,
          description: d.description,
          price: d.price,
          old_price: d.oldPrice,
          stock: d.stock,
          category: d.category,
          sub: d.sub,
          image_url: d.images[0]?.url || '',
        })
        .select('id')
        .single()
      if (error) {
        console.error('ADD PRODUCT ERROR:', error)
        return { ok: false, message: error.message }
      }
      const r = await this._saveImages(data.id, d.images, [])
      if (!r.ok) {
        console.error('SAVE IMAGES ERROR:', r.message)
        await this.load()
        return r
      }
      await this.load()
      return { ok: true }
    },

    async update(id, d) {
      const current = this.items.find((p) => p.id === id)
      const { error } = await supabase
        .from('products')
        .update({
          name: d.name,
          description: d.description,
          price: d.price,
          old_price: d.oldPrice,
          stock: d.stock,
          category: d.category,
          sub: d.sub,
          image_url: d.images[0]?.url || '',
        })
        .eq('id', id)
      if (error) {
        console.error('UPDATE PRODUCT ERROR:', error)
        return { ok: false, message: error.message }
      }
      const r = await this._saveImages(id, d.images, current?.images || [])
      if (!r.ok) {
        console.error('SAVE IMAGES ERROR:', r.message)
        await this.load()
        return r
      }
      await this.load()
      return { ok: true }
    },

    async remove(id) {
      const paths = (this.items.find((p) => p.id === id)?.images || []).map((i) => i.path)
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) {
        console.error('DELETE PRODUCT ERROR:', error)
        return { ok: false, message: error.message }
      }
      await removeImages(paths)
      await this.load()
      return { ok: true }
    },
  },
})

export function getProductById(id) {
  return useProductStore().byId(id)
}

export function getShop(shopId) {
  return useShopStore().shops.find((s) => s.id === shopId) || null
}
