import { computed } from 'vue'
import { useCartStore } from '../stores/cart'
import { getProductById, getShop } from '../stores/product'

export function useCartGroups() {
  const cart = useCartStore()

  const detailedItems = computed(() =>
    cart.items
      .map((i) => {
        const p = getProductById(i.id)
        return p ? { ...p, qty: i.qty } : null
      })
      .filter(Boolean),
  )

  const groups = computed(() => {
    const map = new Map()
    for (const it of detailedItems.value) {
      if (!map.has(it.shopId)) {
        map.set(it.shopId, { shopId: it.shopId, shop: getShop(it.shopId), items: [] })
      }
      map.get(it.shopId).items.push(it)
    }
    return [...map.values()].map((g) => {
      const subtotal = g.items.reduce((s, i) => s + i.price * i.qty, 0)
      return { ...g, subtotal, shipping: subtotal >= 500 ? 0 : 40 }
    })
  })

  const subtotal = computed(() => groups.value.reduce((s, g) => s + g.subtotal, 0))
  const shipping = computed(() => groups.value.reduce((s, g) => s + g.shipping, 0))
  const total = computed(() => subtotal.value + shipping.value)
  const hasProblem = computed(() => detailedItems.value.some((i) => i.stock <= 0 || i.qty > i.stock))

  return { detailedItems, groups, subtotal, shipping, total, hasProblem }
}
