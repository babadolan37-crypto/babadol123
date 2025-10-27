// Lightweight validation and sanitization helpers (no external deps)

export const allowedRoles = new Set(['admin', 'manager', 'cashier'])

export function sanitizeString(input: any, maxLength = 200): { ok: boolean, value?: string, error?: string } {
  if (typeof input !== 'string') return { ok: false, error: 'Invalid string' }
  const value = input.trim()
  if (!value) return { ok: false, error: 'String cannot be empty' }
  if (value.length > maxLength) return { ok: false, error: `String too long (>${maxLength})` }
  return { ok: true, value }
}

export function sanitizeNumber(input: any, { min, max, integer = false }: { min?: number, max?: number, integer?: boolean } = {}): { ok: boolean, value?: number, error?: string } {
  let num = typeof input === 'number' ? input : parseFloat(String(input))
  if (!Number.isFinite(num)) return { ok: false, error: 'Invalid number' }
  if (integer) num = Math.trunc(num)
  if (min !== undefined && num < min) return { ok: false, error: `Number below minimum (${min})` }
  if (max !== undefined && num > max) return { ok: false, error: `Number above maximum (${max})` }
  return { ok: true, value: num }
}

export function sanitizeProductCreate(data: any): { ok: boolean, value?: { name: string, category: string, sellingPrice: number, costPrice: number, stock: number, description?: string }, error?: string } {
  const name = sanitizeString(data?.name, 120)
  if (!name.ok) return { ok: false, error: `name: ${name.error}` }
  const category = sanitizeString(data?.category, 60)
  if (!category.ok) return { ok: false, error: `category: ${category.error}` }

  const sellingPrice = sanitizeNumber(data?.sellingPrice, { min: 0 })
  if (!sellingPrice.ok) return { ok: false, error: `sellingPrice: ${sellingPrice.error}` }
  const costPrice = sanitizeNumber(data?.costPrice, { min: 0 })
  if (!costPrice.ok) return { ok: false, error: `costPrice: ${costPrice.error}` }
  const stock = sanitizeNumber(data?.stock, { min: 0, integer: true })
  if (!stock.ok) return { ok: false, error: `stock: ${stock.error}` }

  const desc = data?.description == null ? undefined : sanitizeString(String(data.description), 400)
  if (desc && !desc.ok) return { ok: false, error: `description: ${desc.error}` }

  return {
    ok: true,
    value: {
      name: name.value!,
      category: category.value!,
      sellingPrice: sellingPrice.value!,
      costPrice: costPrice.value!,
      stock: stock.value!,
      description: desc?.value,
    }
  }
}

export function sanitizeProductUpdate(data: any): { ok: boolean, value?: any, error?: string } {
  const out: any = {}
  if (data?.name !== undefined) {
    const v = sanitizeString(data.name, 120); if (!v.ok) return { ok: false, error: `name: ${v.error}` }; out.name = v.value
  }
  if (data?.category !== undefined) {
    const v = sanitizeString(data.category, 60); if (!v.ok) return { ok: false, error: `category: ${v.error}` }; out.category = v.value
  }
  if (data?.sellingPrice !== undefined) {
    const v = sanitizeNumber(data.sellingPrice, { min: 0 }); if (!v.ok) return { ok: false, error: `sellingPrice: ${v.error}` }; out.sellingPrice = v.value
  }
  if (data?.costPrice !== undefined) {
    const v = sanitizeNumber(data.costPrice, { min: 0 }); if (!v.ok) return { ok: false, error: `costPrice: ${v.error}` }; out.costPrice = v.value
  }
  if (data?.stock !== undefined) {
    const v = sanitizeNumber(data.stock, { min: 0, integer: true }); if (!v.ok) return { ok: false, error: `stock: ${v.error}` }; out.stock = v.value
  }
  if (data?.description !== undefined) {
    const v = sanitizeString(String(data.description), 400); if (!v.ok) return { ok: false, error: `description: ${v.error}` }; out.description = v.value
  }
  return { ok: true, value: out }
}

export function validateTransaction(data: any): { ok: boolean, value?: { items: Array<{ productId: string, quantity: number }>, discount: number, paymentMethod?: string }, error?: string } {
  const items = Array.isArray(data?.items) ? data.items : []
  if (!items.length) return { ok: false, error: 'items: must be non-empty array' }

  const normalized: Array<{ productId: string, quantity: number }> = []
  for (const item of items) {
    const pid = sanitizeString(item?.productId, 200); if (!pid.ok) return { ok: false, error: `items.productId: ${pid.error}` }
    const qty = sanitizeNumber(item?.quantity, { min: 1, integer: true }); if (!qty.ok) return { ok: false, error: `items.quantity: ${qty.error}` }
    normalized.push({ productId: pid.value!, quantity: qty.value! })
  }

  const discount = sanitizeNumber(data?.discount ?? 0, { min: 0 })
  if (!discount.ok) return { ok: false, error: `discount: ${discount.error}` }

  let paymentMethod: string | undefined
  if (data?.paymentMethod !== undefined) {
    const pm = sanitizeString(String(data.paymentMethod), 40); if (!pm.ok) return { ok: false, error: `paymentMethod: ${pm.error}` }; paymentMethod = pm.value
  }

  return { ok: true, value: { items: normalized, discount: discount.value!, paymentMethod } }
}

export function validateStockAdjustment(data: any): { ok: boolean, value?: { change: number, type?: string, reason?: string }, error?: string } {
  const change = sanitizeNumber(data?.change, { integer: true })
  if (!change.ok) return { ok: false, error: `change: ${change.error}` }

  let type: string | undefined
  if (data?.type !== undefined) {
    const t = sanitizeString(String(data.type), 40); if (!t.ok) return { ok: false, error: `type: ${t.error}` }; type = t.value
  }
  let reason: string | undefined
  if (data?.reason !== undefined) {
    const r = sanitizeString(String(data.reason), 200); if (!r.ok) return { ok: false, error: `reason: ${r.error}` }; reason = r.value
  }
  return { ok: true, value: { change: change.value!, type, reason } }
}

export function validateSignup(data: any): { ok: boolean, value?: { email: string, password: string, name: string, role: string }, error?: string } {
  const email = sanitizeString(data?.email, 120)
  if (!email.ok) return { ok: false, error: `email: ${email.error}` }
  if (!/^\S+@\S+\.\S+$/.test(email.value!)) return { ok: false, error: 'email: invalid format' }

  const passwordRaw = typeof data?.password === 'string' ? data.password : ''
  if (passwordRaw.length < 8) return { ok: false, error: 'password: minimum 8 characters' }

  const name = sanitizeString(data?.name, 120)
  if (!name.ok) return { ok: false, error: `name: ${name.error}` }

  const roleStr = String(data?.role ?? 'cashier').trim()
  if (!allowedRoles.has(roleStr)) return { ok: false, error: 'role: must be admin/manager/cashier' }

  return { ok: true, value: { email: email.value!, password: passwordRaw, name: name.value!, role: roleStr } }
}

export function validateOrder(data: any): { ok: boolean, value?: { customerName?: string, customerPhone?: string, customerAddress?: string, items: Array<{ productId: string, quantity: number }>, deliveryDate?: string, deliveryTime?: string, notes?: string }, error?: string } {
  const items = Array.isArray(data?.items) ? data.items : []
  if (!items.length) return { ok: false, error: 'items: must be non-empty array' }

  const normalized: Array<{ productId: string, quantity: number }> = []
  for (const item of items) {
    const pid = sanitizeString(item?.productId, 200); if (!pid.ok) return { ok: false, error: `items.productId: ${pid.error}` }
    const qty = sanitizeNumber(item?.quantity, { min: 1, integer: true }); if (!qty.ok) return { ok: false, error: `items.quantity: ${qty.error}` }
    normalized.push({ productId: pid.value!, quantity: qty.value! })
  }

  const customerName = data?.customerName == null ? undefined : sanitizeString(String(data.customerName), 120)
  if (customerName && !customerName.ok) return { ok: false, error: `customerName: ${customerName.error}` }
  const customerPhone = data?.customerPhone == null ? undefined : sanitizeString(String(data.customerPhone), 40)
  if (customerPhone && !customerPhone.ok) return { ok: false, error: `customerPhone: ${customerPhone.error}` }
  const customerAddress = data?.customerAddress == null ? undefined : sanitizeString(String(data.customerAddress), 200)
  if (customerAddress && !customerAddress.ok) return { ok: false, error: `customerAddress: ${customerAddress.error}` }
  const deliveryDate = data?.deliveryDate == null ? undefined : sanitizeString(String(data.deliveryDate), 20)
  if (deliveryDate && !deliveryDate.ok) return { ok: false, error: `deliveryDate: ${deliveryDate.error}` }
  const deliveryTime = data?.deliveryTime == null ? undefined : sanitizeString(String(data.deliveryTime), 10)
  if (deliveryTime && !deliveryTime.ok) return { ok: false, error: `deliveryTime: ${deliveryTime.error}` }
  const notes = data?.notes == null ? undefined : sanitizeString(String(data.notes), 200)
  if (notes && !notes.ok) return { ok: false, error: `notes: ${notes.error}` }

  return {
    ok: true,
    value: {
      customerName: customerName?.value,
      customerPhone: customerPhone?.value,
      customerAddress: customerAddress?.value,
      items: normalized,
      deliveryDate: deliveryDate?.value,
      deliveryTime: deliveryTime?.value,
      notes: notes?.value
    }
  }
}

export function validatePurchase(data: any): { ok: boolean, value?: { supplier?: string, fundingSource?: string, fundingOwner?: string, items: Array<{ itemName: string, quantity: number, purchasePrice: number, unit?: string }>, purchaseDate?: string }, error?: string } {
  const items = Array.isArray(data?.items) ? data.items : []
  if (!items.length) return { ok: false, error: 'items: must be non-empty array' }

  const normalized: Array<{ itemName: string, quantity: number, purchasePrice: number, unit?: string }> = []
  for (const item of items) {
    const name = sanitizeString(item?.itemName, 120); if (!name.ok) return { ok: false, error: `items.itemName: ${name.error}` }
    const qty = sanitizeNumber(item?.quantity, { min: 1, integer: true }); if (!qty.ok) return { ok: false, error: `items.quantity: ${qty.error}` }
    const price = sanitizeNumber(item?.purchasePrice, { min: 0 }); if (!price.ok) return { ok: false, error: `items.purchasePrice: ${price.error}` }
    const unit = item?.unit == null ? 'pcs' : (sanitizeString(String(item.unit), 20).ok ? String(item.unit) : 'pcs')
    normalized.push({ itemName: name.value!, quantity: qty.value!, purchasePrice: price.value!, unit })
  }

  // Accept both supplier or supplierName for backward compatibility
  let supplier: string | undefined
  if (data?.supplier !== undefined) {
    const s = sanitizeString(String(data.supplier), 120); if (!s.ok) return { ok: false, error: `supplier: ${s.error}` }; supplier = s.value
  } else if (data?.supplierName !== undefined) {
    const s = sanitizeString(String(data.supplierName), 120); if (!s.ok) return { ok: false, error: `supplierName: ${s.error}` }; supplier = s.value
  }

  // fundingSource/personal owner are optional but validated if present
  let fundingSource: string | undefined
  if (data?.fundingSource !== undefined) {
    const fs = sanitizeString(String(data.fundingSource), 40); if (!fs.ok) return { ok: false, error: `fundingSource: ${fs.error}` }; fundingSource = fs.value
  }
  let fundingOwner: string | undefined
  if (data?.fundingOwner !== undefined) {
    const fo = sanitizeString(String(data.fundingOwner), 120); if (!fo.ok) return { ok: false, error: `fundingOwner: ${fo.error}` }; fundingOwner = fo.value
  }

  const purchaseDate = data?.purchaseDate == null ? undefined : sanitizeString(String(data.purchaseDate), 20)
  if (purchaseDate && !purchaseDate.ok) return { ok: false, error: `purchaseDate: ${purchaseDate.error}` }

  return { ok: true, value: { supplier, fundingSource, fundingOwner, items: normalized, purchaseDate: purchaseDate?.value } }
}

export function sanitizeUserUpdate(data: any): { ok: boolean, value?: { name?: string, role?: 'admin' | 'manager' | 'cashier' }, error?: string } {
  const out: any = {}
  if (data?.name !== undefined) {
    const v = sanitizeString(data.name, 120); if (!v.ok) return { ok: false, error: `name: ${v.error}` }; out.name = v.value
  }
  if (data?.role !== undefined) {
    const rv = sanitizeString(String(data.role), 20); if (!rv.ok) return { ok: false, error: `role: ${rv.error}` }
    const allowed = ['admin', 'manager', 'cashier']
    if (!allowed.includes(rv.value!)) return { ok: false, error: 'role: must be one of admin, manager, cashier' }
    out.role = rv.value
  }
  return { ok: true, value: out }
}