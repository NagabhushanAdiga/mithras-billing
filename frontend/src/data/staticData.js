// Static initial data for the billing app

export const INITIAL_GROUPS = [
  { id: 'grp-grocery', name: 'Grocery', subcategories: [] },
  {
    id: 'grp-daily',
    name: 'Daily products',
    subcategories: [
      { id: 'sub-milk', name: 'Milk products' },
      { id: 'sub-bread', name: 'Breads' },
    ],
  },
  { id: 'grp-dairy', name: 'Dairy', subcategories: [] },
  { id: 'grp-personal', name: 'Personal Care', subcategories: [] },
  { id: 'grp-hardware', name: 'Hardware', subcategories: [] },
  { id: 'grp-other', name: 'Other', subcategories: [] },
]

export const INITIAL_BATCHES = [
  { id: 'bat-2024-a', name: 'Batch 2024-A' },
  { id: 'bat-2024-b', name: 'Batch 2024-B' },
]

const groupByCategory = {
  Grocery: 'grp-grocery',
  Dairy: 'grp-dairy',
  'Daily products': 'grp-daily',
  'Personal Care': 'grp-personal',
  Hardware: 'grp-hardware',
  Other: 'grp-other',
}

function product(id, barcode, name, price, category, discount = 0, stock = 50) {
  return {
    id,
    barcode,
    name,
    price,
    category,
    discount,
    stock,
    groupId: groupByCategory[category] || 'grp-other',
    image: `https://picsum.photos/seed/${id}/200/200`,
  }
}

export const INITIAL_PRODUCTS = [
  product('1', '8901234567890', 'Rice 1kg', 65, 'Grocery', 0, 120),
  product('2', '8901234567891', 'Dal 500g', 120, 'Grocery', 0, 80),
  product('3', '8901234567892', 'Cooking Oil 1L', 180, 'Grocery', 0, 45),
  product('4', '8901234567893', 'Soap Bar', 40, 'Personal Care', 5, 200),
  product('5', '8901234567894', 'Milk 1L', 55, 'Dairy', 0, 60),
  product('6', '8901234567895', 'Tea 500g', 220, 'Grocery', 0, 35),
  product('7', '8901234567896', 'Sugar 1kg', 48, 'Grocery', 0, 90),
  product('8', '8901234567897', 'Wheat Flour 1kg', 35, 'Grocery', 0, 100),
  product('9', '8901234567898', 'Shampoo 200ml', 145, 'Personal Care', 10, 40),
  product('10', '8901234567899', 'Toothpaste', 85, 'Personal Care', 0, 75),
  product('11', '8901234567800', 'Bulb 9W LED', 95, 'Hardware', 0, 150),
  product('12', '8901234567801', 'Wire 1.5mm 90m', 450, 'Hardware', 0, 12),
  product('13', '8901234567802', 'Switch Single', 65, 'Hardware', 0, 85),
  product('14', '8901234567803', 'Socket 6A', 120, 'Hardware', 0, 55),
  product('15', '8901234567804', 'Screwdriver Set', 180, 'Hardware', 0, 25),
  product('16', '8901234567805', 'Nails 500g', 55, 'Hardware', 0, 110),
  product('17', '8901234567806', 'Adhesive Tape', 30, 'Hardware', 0, 200),
  product('18', '8901234567807', 'Battery 9V', 45, 'Hardware', 0, 95),
]

export const DEFAULT_SETTINGS = {
  storeName: 'SuperMart Billing',
  storeAddress: '',
  storeGstin: '',
  storeWebsite: '',
  storeUpiId: '',
  taxRate: 5,
  currency: '₹',
  discountEnabled: true,
  discountType: 'percent', // 'percent' | 'amount'
  maxDiscountPercent: 50,
  billDiscountEnabled: false,
}

export const INITIAL_USERS = [
  { id: 'usr-admin', username: 'naga', password: '12345', name: 'Naga', role: 'admin' },
]

export const SAMPLE_ORDERS = [
  {
    id: 'ord-001',
    date: new Date(Date.now() - 86400000).toISOString(),
    createdBy: { id: 'usr-admin', username: 'naga', name: 'Naga', role: 'admin' },
    items: [
      { name: 'Rice 1kg', barcode: '8901234567890', price: 65, qty: 2 },
      { name: 'Dal 500g', barcode: '8901234567891', price: 120, qty: 1 },
    ],
    subtotal: 250,
    tax: 12.5,
    total: 262.5,
  },
  {
    id: 'ord-002',
    date: new Date(Date.now() - 3600000).toISOString(),
    createdBy: { id: 'usr-admin', username: 'naga', name: 'Naga', role: 'admin' },
    items: [
      { name: 'Bulb 9W LED', barcode: '8901234567800', price: 95, qty: 3 },
      { name: 'Switch Single', barcode: '8901234567802', price: 65, qty: 2 },
    ],
    subtotal: 415,
    tax: 20.75,
    total: 435.75,
  },
]
