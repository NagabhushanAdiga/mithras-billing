import { useRef } from 'react'
import { HiOutlinePhotograph } from 'react-icons/hi'
import ProductImage from '../common/ProductImage'
import { Shimmer } from '../common/Shimmer'
import { usePendingChanges } from '../../hooks/usePendingChanges'

const MAX_IMAGE_BYTES = 2 * 1024 * 1024

export default function ImageField({ label = 'Product image', image, name, onChange }) {
  const inputRef = useRef(null)
  const { pendingChanges, patchPendingChanges } = usePendingChanges({ uploading: false })
  const { uploading } = pendingChanges
  const previewProduct = { name: name || 'Product', image }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > MAX_IMAGE_BYTES) {
      alert('Image must be smaller than 2 MB.')
      e.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onloadstart = () => patchPendingChanges({ uploading: true })
    reader.onload = () => {
      onChange?.(reader.result)
      patchPendingChanges({ uploading: false })
    }
    reader.onerror = () => patchPendingChanges({ uploading: false })
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="relative">
          <ProductImage product={previewProduct} size="lg" />
          {uploading && <Shimmer className="absolute inset-0 w-16 h-16 rounded-md" />}
        </div>
        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <HiOutlinePhotograph className="w-4 h-4" />
            Upload image
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          {image && (
            <button
              type="button"
              onClick={() => onChange?.('')}
              className="block text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Remove image
            </button>
          )}
          <p className="text-xs text-slate-400">JPG or PNG, max 2 MB. A placeholder is used if empty.</p>
        </div>
      </div>
    </div>
  )
}
