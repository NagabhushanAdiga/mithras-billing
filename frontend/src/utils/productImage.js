export function productImageSrc(product) {
  if (product?.image) return product.image
  const seed = encodeURIComponent(product?.id || product?.name || 'product')
  return `https://picsum.photos/seed/${seed}/200/200`
}
