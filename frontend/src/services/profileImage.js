const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export function readProfileImage(file) {
  if (!file?.type.startsWith('image/')) return Promise.reject(new Error('Choose a PNG, JPG, or WebP image.'))
  if (file.size > MAX_IMAGE_BYTES) return Promise.reject(new Error('Profile images must be smaller than 2 MB.'))

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('That image could not be opened.'))
      image.onload = () => {
        const size = 160
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const context = canvas.getContext('2d')
        const sourceSize = Math.min(image.width, image.height)
        context.drawImage(image, (image.width - sourceSize) / 2, (image.height - sourceSize) / 2, sourceSize, sourceSize, 0, 0, size, size)
        resolve(canvas.toDataURL('image/webp', 0.82))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
