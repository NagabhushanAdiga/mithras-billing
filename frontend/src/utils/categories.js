export function normalizeGroups(groups) {
  return (groups || []).map((g) => ({
    ...g,
    subcategories: Array.isArray(g.subcategories)
      ? g.subcategories
          .map((s) => ({
            id: s.id,
            name: String(s.name || '').trim(),
          }))
          .filter((s) => s.id && s.name)
      : [],
  }))
}

export function getSubcategoriesForGroup(groups, groupId) {
  if (!groupId) return []
  const group = groups.find((g) => g.id === groupId)
  return group?.subcategories || []
}

export function getSubcategoryById(groups, groupId, subcategoryId) {
  if (!groupId || !subcategoryId) return null
  return getSubcategoriesForGroup(groups, groupId).find((s) => s.id === subcategoryId) || null
}

export function formatCategoryLabel(group, subcategory) {
  if (!group?.name) return '—'
  if (subcategory?.name) return `${group.name} › ${subcategory.name}`
  return group.name
}

export function resolveProductCategoryFields(product, groups) {
  const groupId = product.groupId || ''
  let subcategoryId = product.subcategoryId || ''
  const group = groupId ? groups.find((g) => g.id === groupId) : null
  const sub = getSubcategoryById(groups, groupId, subcategoryId)
  if (!sub) subcategoryId = ''

  return {
    groupId,
    subcategoryId,
    category: formatCategoryLabel(group, sub),
    subcategory: sub?.name || '',
  }
}
