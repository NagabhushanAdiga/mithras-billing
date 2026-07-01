import { useEffect, useMemo, useState } from 'react'

export const DEFAULT_PAGE_SIZE = 10

export function usePagination(items, { pageSize = DEFAULT_PAGE_SIZE, resetDeps = [] } = {}) {
  const [page, setPage] = useState(1)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const resetKey = JSON.stringify(resetDeps)

  useEffect(() => {
    setPage(1)
  }, [totalItems, pageSize, resetKey])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const endIndex = Math.min(page * pageSize, totalItems)

  return {
    page,
    setPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    startIndex,
    endIndex,
  }
}
