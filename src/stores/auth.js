import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

const mapProfile = (p) => ({
  id: p.id,
  name: p.name || '',
  email: p.email || '',
  phone: p.phone || '',
  avatar: p.avatar_url || '',
  role: p.role || 'user',
  addresses: Array.isArray(p.addresses) ? p.addresses : [],
  createdAt: p.created_at,
})

let initPromise = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentId: null,
    profile: null,
    users: [], // แอดมินเท่านั้นที่โหลดครบทุกคน
  }),

  getters: {
    user: (state) => state.profile,
    isLoggedIn: (state) => !!state.currentId && !!state.profile,
    isSeller() {
      return this.profile?.role === 'seller'
    },
    isAdmin() {
      return this.profile?.role === 'admin'
    },
  },

  actions: {
    // โหลด session ครั้งแรก (เรียกซ้ำได้ ทำงานครั้งเดียว)
    init() {
      if (!initPromise) {
        initPromise = (async () => {
          const { data } = await supabase.auth.getSession()
          await this._apply(data.session)

          supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') {
              this.currentId = null
              this.profile = null
              this.users = []
            } else if (session && session.user.id !== this.currentId) {
              // ห้ามเรียก supabase ตรงๆ ใน callback นี้ จึงหน่วงไว้
              setTimeout(() => this._apply(session), 0)
            }
          })
        })()
      }
      return initPromise
    },

    async _apply(session) {
      if (!session?.user) {
        this.currentId = null
        this.profile = null
        this.users = []
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error || !data) {
        console.error('LOAD PROFILE ERROR:', error)
        this.currentId = null
        this.profile = null
        return
      }
      this.currentId = data.id
      this.profile = mapProfile(data)
      if (data.role === 'admin') await this.loadUsers()
      else this.users = [this.profile]
    },

    async loadUsers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })
      if (!error && data) this.users = data.map(mapProfile)
    },

    // อ่าน role ล่าสุดจากฐานข้อมูล (หลังแอดมินอนุมัติร้าน ฯลฯ)
    async refreshProfile() {
      if (!this.currentId) return
      const { data } = await supabase.from('profiles').select('*').eq('id', this.currentId).single()
      if (data) this.profile = mapProfile(data)
    },

    async register({ name, email, password }) {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { name: name.trim() } },
      })
      if (error) {
        const msg = /already|registered/i.test(error.message)
          ? 'อีเมลนี้ถูกใช้งานแล้ว'
          : 'สมัครไม่สำเร็จ: ' + error.message
        return { ok: false, message: msg }
      }

      await supabase.auth.signOut()
      this.currentId = null
      this.profile = null
      return { ok: true }
    },

    async login({ email, password }) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) {
        const msg = /invalid/i.test(error.message)
          ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
          : 'เข้าสู่ระบบไม่สำเร็จ: ' + error.message
        return { ok: false, message: msg }
      }
      await this._apply(data.session)
      if (!this.profile) return { ok: false, message: 'ไม่พบข้อมูลโปรไฟล์ของบัญชีนี้' }
      return { ok: true }
    },

    async logout() {
      await supabase.auth.signOut()
      this.currentId = null
      this.profile = null
      this.users = []
    },


    ensureProfile() {},
    ensureAdmin() {},

    updateProfile({ name, phone, avatar }) {
      const p = this.profile
      if (!p) return
      if (name !== undefined) p.name = name.trim()
      if (phone !== undefined) p.phone = phone
      if (avatar !== undefined) p.avatar = avatar
      supabase
        .from('profiles')
        .update({ name: p.name, phone: p.phone, avatar_url: p.avatar })
        .eq('id', p.id)
        .then(({ error }) => error && console.error('UPDATE PROFILE ERROR:', error))
    },

    async changePassword(oldPw, newPw) {
      const p = this.profile
      if (!p) return { ok: false, message: 'ยังไม่ได้เข้าสู่ระบบ' }
      if (newPw.length < 6) return { ok: false, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัว' }

      const { error: e1 } = await supabase.auth.signInWithPassword({ email: p.email, password: oldPw })
      if (e1) return { ok: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' }

      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) return { ok: false, message: 'เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + error.message }
      return { ok: true }
    },


    _saveAddresses() {
      const p = this.profile
      if (!p) return
      supabase
        .from('profiles')
        .update({ addresses: p.addresses })
        .eq('id', p.id)
        .then(({ error }) => error && console.error('SAVE ADDRESS ERROR:', error))
    },

    saveAddress(data, id = null) {
      const p = this.profile
      if (!p) return
      const list = p.addresses

      if (id) {
        const i = list.findIndex((a) => a.id === id)
        if (i !== -1) list[i] = { ...list[i], ...data }
      } else {
        list.push({ id: 'a' + Date.now(), isDefault: list.length === 0, ...data })
      }

      const def = list.find((a) => a.id === (id || list[list.length - 1].id))
      if (def?.isDefault) list.forEach((a) => (a.isDefault = a.id === def.id))
      if (!list.some((a) => a.isDefault) && list.length) list[0].isDefault = true
      this._saveAddresses()
    },

    setDefaultAddress(id) {
      this.profile?.addresses.forEach((a) => (a.isDefault = a.id === id))
      this._saveAddresses()
    },

    removeAddress(id) {
      const p = this.profile
      if (!p) return
      p.addresses = p.addresses.filter((a) => a.id !== id)
      if (p.addresses.length && !p.addresses.some((a) => a.isDefault)) p.addresses[0].isDefault = true
      this._saveAddresses()
    },

    // เหลือไว้เพื่อความเข้ากันได้กับโค้ดเก่า (ตอนนี้ role เปลี่ยนผ่านฟังก์ชันในฐานข้อมูล)
    upgradeToSeller() {},
    setSeller() {},
    setRole() {},
  },
})
