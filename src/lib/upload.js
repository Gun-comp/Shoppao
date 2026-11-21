import { supabase } from './supabase'

const BUCKET = 'shoppao'

export function resizeImage(file, maxSize = 1000, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) return reject(new Error('ไฟล์ต้องเป็นรูปภาพ'))
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('เปิดรูปไม่สำเร็จ'))
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('แปลงรูปไม่สำเร็จ'))),
          'image/jpeg',
          quality,
        )
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// อัปโหลดรูปเข้า <userId>/<folder>/<ชื่อสุ่ม>.jpg แล้วคืน { url, path }
export async function uploadImage(file, userId, folder = 'misc', maxSize = 1000) {
  const blob = await resizeImage(file, maxSize)
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const path = `${userId}/${folder}/${name}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
  })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

export async function removeImages(paths) {
  const list = (Array.isArray(paths) ? paths : [paths]).filter(Boolean)
  if (!list.length) return
  const { error } = await supabase.storage.from(BUCKET).remove(list)
  if (error) console.error('REMOVE IMAGE ERROR:', error)
}
