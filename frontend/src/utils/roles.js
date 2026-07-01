export function isAdminRole(role) {
  return role === 'admin'
}

export function roleLabel(role) {
  if (role === 'admin') return 'Admin'
  if (role === 'manager') return 'Manager'
  if (role === 'cashier') return 'Cashier'
  return role || 'User'
}
