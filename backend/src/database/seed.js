import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { connectDb, disconnectDb } from '../config/db.js'
import { User } from '../models/schemas/User.js'
import { Group } from '../models/schemas/Group.js'
import { Batch } from '../models/schemas/Batch.js'
import { Product } from '../models/schemas/Product.js'
import { Order } from '../models/schemas/Order.js'
import { Settings } from '../models/schemas/Settings.js'

dotenv.config()

const INITIAL_GROUPS = [
  { id: 'grp-grocery', name: 'Grocery', subcategories: [] },
  { id: 'grp-daily', name: 'Daily products', subcategories: [] },
  { id: 'grp-dairy', name: 'Dairy', subcategories: [] },
  { id: 'grp-personal', name: 'Personal Care', subcategories: [] },
  { id: 'grp-hardware', name: 'Hardware', subcategories: [] },
  { id: 'grp-other', name: 'Other', subcategories: [] },
]

const INITIAL_SUBCATEGORIES = [
  { id: 'sub-milk', groupId: 'grp-daily', name: 'Milk products' },
  { id: 'sub-bread', groupId: 'grp-daily', name: 'Breads' },
]

const INITIAL_BATCHES = [
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

const INITIAL_PRODUCTS = [
  ['1', '8901234567890', 'Rice 1kg', 65, 'Grocery', 0, 120],
  ['2', '8901234567891', 'Dal 500g', 120, 'Grocery', 0, 80],
  ['3', '8901234567892', 'Cooking Oil 1L', 180, 'Grocery', 0, 45],
  ['4', '8901234567893', 'Soap Bar', 40, 'Personal Care', 5, 200],
  ['5', '8901234567894', 'Milk 1L', 55, 'Dairy', 0, 60],
  ['6', '8901234567895', 'Tea 500g', 220, 'Grocery', 0, 35],
  ['7', '8901234567896', 'Sugar 1kg', 48, 'Grocery', 0, 90],
  ['8', '8901234567897', 'Wheat Flour 1kg', 35, 'Grocery', 0, 100],
  ['9', '8901234567898', 'Shampoo 200ml', 145, 'Personal Care', 10, 40],
  ['10', '8901234567899', 'Toothpaste', 85, 'Personal Care', 0, 75],
  ['11', '8901234567800', 'Bulb 9W LED', 95, 'Hardware', 0, 150],
  ['12', '8901234567801', 'Wire 1.5mm 90m', 450, 'Hardware', 0, 12],
  ['13', '8901234567802', 'Switch Single', 65, 'Hardware', 0, 85],
  ['14', '8901234567803', 'Socket 6A', 120, 'Hardware', 0, 55],
  ['15', '8901234567804', 'Screwdriver Set', 180, 'Hardware', 0, 25],
  ['16', '8901234567805', 'Nails 500g', 55, 'Hardware', 0, 110],
  ['17', '8901234567806', 'Adhesive Tape', 30, 'Hardware', 0, 200],
  ['18', '8901234567807', 'Battery 9V', 45, 'Hardware', 0, 95],
]

export async function runSeed() {
  const userCount = await User.countDocuments()
  if (userCount > 0) {
    console.log('Database already seeded — skipping.')
    return
  }

  const adminUsername = String(process.env.INITIAL_ADMIN_USERNAME || 'naga').trim().toLowerCase()
  const adminPassword = String(process.env.INITIAL_ADMIN_PASSWORD || '12345').trim()
  const adminName = String(process.env.INITIAL_ADMIN_NAME || 'Naga').trim()

  if (adminPassword.length < 4) {
    console.warn(
      'No admin user created. Set INITIAL_ADMIN_PASSWORD in backend/.env (min 4 characters), then run npm run db:reset.'
    )
  } else {
    await User.create({
      id: 'usr-admin',
      username: adminUsername,
      passwordHash: bcrypt.hashSync(adminPassword, 10),
      name: adminName,
      role: 'admin',
    })
  }

  const groupsWithSubs = INITIAL_GROUPS.map((group) => {
    const subcategories = INITIAL_SUBCATEGORIES.filter((sub) => sub.groupId === group.id).map(
      ({ id, name }) => ({ id, name })
    )
    return { ...group, subcategories }
  })
  await Group.insertMany(groupsWithSubs)
  await Batch.insertMany(INITIAL_BATCHES)

  const products = INITIAL_PRODUCTS.map(([id, barcode, name, price, category, discount, stock]) => {
    const groupId = groupByCategory[category] || 'grp-other'
    return {
      id,
      barcode,
      name,
      hsn: '',
      gst: 0,
      groupId,
      subcategoryId: '',
      category,
      discount,
      price,
      stock,
      image: `https://picsum.photos/seed/${id}/200/200`,
      batches: [],
    }
  })
  await Product.insertMany(products)
  await Settings.create({ singletonKey: 'default' })

  const adminActor = {
    id: 'usr-admin',
    username: adminUsername,
    name: adminName,
    role: 'admin',
  }
  const now = Date.now()

  await Order.insertMany([
    {
      id: 'ord-001',
      date: new Date(now - 86400000).toISOString(),
      createdById: 'usr-admin',
      createdBy: adminActor,
      items: [
        { name: 'Rice 1kg', barcode: '8901234567890', price: 65, qty: 2 },
        { name: 'Dal 500g', barcode: '8901234567891', price: 120, qty: 1 },
      ],
      grossSubtotal: 250,
      discountTotal: 0,
      subtotal: 250,
      tax: 12.5,
      totalBeforeBillDiscount: 262.5,
      billDiscount: 0,
      billDiscountType: 'amount',
      billDiscountAmount: 0,
      total: 262.5,
    },
    {
      id: 'ord-002',
      date: new Date(now - 3600000).toISOString(),
      createdById: 'usr-admin',
      createdBy: adminActor,
      items: [
        { name: 'Bulb 9W LED', barcode: '8901234567800', price: 95, qty: 3 },
        { name: 'Switch Single', barcode: '8901234567802', price: 65, qty: 2 },
      ],
      grossSubtotal: 415,
      discountTotal: 0,
      subtotal: 415,
      tax: 20.75,
      totalBeforeBillDiscount: 435.75,
      billDiscount: 0,
      billDiscountType: 'amount',
      billDiscountAmount: 0,
      total: 435.75,
    },
  ])

  console.log('Database seeded.')
}

async function main() {
  await connectDb()
  await runSeed()
  await disconnectDb()
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
