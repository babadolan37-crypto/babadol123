import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createClient } from '@jsr/supabase__supabase-js'
import * as kv from './kv_store'
import { sanitizeProductCreate, sanitizeProductUpdate, validateTransaction, validateStockAdjustment, validateSignup, validateOrder, validatePurchase, sanitizeUserUpdate } from './validation'
import { logEvent } from './audit'

const app = new Hono()

// Configure CORS with optional allowlist from env
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean)
app.use('*', cors({ origin: (origin) => {
  if (!allowedOrigins.length) return '*'
  const o = origin ?? ''
  return allowedOrigins.includes(o) ? o : ''
}}))
app.use('*', logger(console.log))

// Global error handler middleware
app.use('*', async (c, next) => {
  try {
    await next()
  } catch (err) {
    console.error('Unhandled error:', err)
    const status = err.status || 500
    const message = err.status ? err.message : 'Internal server error'
    return c.json({ 
      error: message,
      success: false,
      timestamp: new Date().toISOString()
    }, status)
  }
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

// ============ RATE LIMITING & SECURITY ============
// In-memory storage for login attempts (in production, use Redis or similar)
const loginAttempts = new Map<string, { count: number, lockoutUntil?: number, lastAttemptAt?: number }>()
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000
const ATTEMPT_WINDOW = 15 * 60 * 1000

function checkRateLimit(identifier: string): { allowed: boolean, remainingAttempts?: number, lockoutUntil?: Date } {
  const now = Date.now()
  const attempt = loginAttempts.get(identifier)

  if (attempt?.lockoutUntil && attempt.lockoutUntil > now) {
    return { allowed: false, lockoutUntil: new Date(attempt.lockoutUntil) }
  }

  if (attempt?.lastAttemptAt && now - attempt.lastAttemptAt > ATTEMPT_WINDOW) {
    loginAttempts.set(identifier, { count: 0 })
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS }
  }

  if (!attempt) return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS }

  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    const lockoutUntil = now + LOCKOUT_DURATION
    loginAttempts.set(identifier, { count: attempt.count, lockoutUntil, lastAttemptAt: now })
    return { allowed: false, lockoutUntil: new Date(lockoutUntil) }
  }

  return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - attempt.count }
}

function recordLoginAttempt(identifier: string, success: boolean) {
  const now = Date.now()
  const attempt = loginAttempts.get(identifier)
  if (success) {
    loginAttempts.delete(identifier)
  } else {
    const count = (attempt?.count || 0) + 1
    loginAttempts.set(identifier, { count, lastAttemptAt: now })
    if (loginAttempts.size > 1000) {
      const entries = Array.from(loginAttempts.entries())
      entries.slice(0, 100).forEach(([key]) => loginAttempts.delete(key))
    }
  }
}

// Cleanup old entries every 30 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of loginAttempts.entries()) {
    if (value.lockoutUntil && value.lockoutUntil < now) {
      loginAttempts.delete(key)
    }
  }
}, 30 * 60 * 1000)

// Middleware to verify user and get role
async function verifyUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1]
  if (!accessToken) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user) {
    return { error: 'Unauthorized', status: 401 }
  }

  // Get user role from KV store
  const userData = await kv.get(`user:${user.id}`)
  if (!userData) {
    return { error: 'User data not found', status: 404 }
  }

  const parsedUserData = typeof userData === 'string' ? JSON.parse(userData) : userData
  return { user, userData: parsedUserData, error: null }
}

// ============ AUTH ROUTES ============

// Login verification endpoint (for rate limiting check before actual login)
app.post('/make-server-aca98767/auth/check-rate-limit', async (c) => {
  try {
    const { email } = await c.req.json()
    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }

    const rateLimit = checkRateLimit(email)
    
    if (!rateLimit.allowed) {
      const minutesRemaining = Math.ceil((rateLimit.lockoutUntil!.getTime() - Date.now()) / 60000)
      return c.json({ 
        allowed: false,
        error: `Terlalu banyak percobaan login. Coba lagi dalam ${minutesRemaining} menit.`,
        lockoutUntil: rateLimit.lockoutUntil
      }, 429)
    }

    return c.json({ 
      allowed: true,
      remainingAttempts: rateLimit.remainingAttempts
    })
  } catch (error) {
    console.log('Rate limit check error:', error)
    return c.json({ error: 'Failed to check rate limit: ' + error.message }, 500)
  }
})

// Record login result endpoint
app.post('/make-server-aca98767/auth/record-attempt', async (c) => {
  try {
    const { email, success } = await c.req.json()
    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }

    recordLoginAttempt(email, success)
    
    const rateLimit = checkRateLimit(email)
    return c.json({ 
      success: true,
      remainingAttempts: rateLimit.remainingAttempts
    })
  } catch (error) {
    console.log('Record attempt error:', error)
    return c.json({ error: 'Failed to record attempt: ' + error.message }, 500)
  }
})

app.post('/make-server-aca98767/signup', async (c) => {
  try {
    const raw = await c.req.json()
    const parsed = validateSignup(raw)
    if (!parsed.ok) return c.json({ error: parsed.error }, 400)

    const { email, password, name, role } = parsed.value!

    const authHeader = c.req.header('Authorization')
    if (authHeader) {
      const verifyResult = await verifyUser(c.req.raw)
      if (!verifyResult.error) {
        const creatorRole = verifyResult.userData.role
        if ((role === 'admin' || role === 'manager') && (creatorRole !== 'admin' && creatorRole !== 'manager')) {
          return c.json({ error: 'Insufficient permissions' }, 403)
        }
      }
    }

    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const userExists = existingUsers?.users.some(u => u.email === email)
    if (userExists) return c.json({ error: 'User with this email already exists' }, 400)

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true,
      app_metadata: { role }
    })
    if (error) return c.json({ error: error.message }, 400)

    const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, { password })
    if (updateError) console.log('Warning: Could not update password:', updateError)

    const userData = { id: data.user.id, email, name, role: role || 'cashier', createdAt: new Date().toISOString() }
    await kv.set(`user:${data.user.id}`, JSON.stringify(userData))

    return c.json({ success: true, user: userData })
  } catch (error) {
    return c.json({ error: 'Signup failed: ' + error.message }, 500)
  }
})

app.get('/make-server-aca98767/user', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  return c.json({ user: verifyResult.userData })
})

// Debug endpoint to check if user exists
app.get('/make-server-aca98767/debug/users', async (c) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      return c.json({ error: error.message }, 500)
    }
    
    const users = data.users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      email_confirmed_at: u.email_confirmed_at,
      last_sign_in_at: u.last_sign_in_at
    }))
    
    return c.json({ users, count: users.length })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// ============ PRODUCT ROUTES ============

app.get('/make-server-aca98767/products', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  try {
    const products = await kv.getByPrefix('product:')
    // Filter out any null/undefined values and parse properly
    const productList = products
      .filter(p => p != null)
      .map(p => {
        try {
          // If it's already an object, return it; if it's a string, parse it
          return typeof p === 'string' ? JSON.parse(p) : p
        } catch (parseError) {
          console.log('Error parsing product:', p, parseError)
          return null
        }
      })
      .filter(p => p != null)
    
    return c.json({ products: productList })
  } catch (error) {
    console.log('Error fetching products:', error)
    return c.json({ error: 'Failed to fetch products: ' + error.message }, 500)
  }
})

app.post('/make-server-aca98767/products', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) return c.json({ error: verifyResult.error }, verifyResult.status)
  if (verifyResult.userData.role !== 'admin' && verifyResult.userData.role !== 'manager') return c.json({ error: 'Only admin or manager can add products' }, 403)

  try {
    const raw = await c.req.json()
    const parsed = sanitizeProductCreate(raw)
    if (!parsed.ok) return c.json({ error: parsed.error }, 400)

    const productId = `product:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    const product = { id: productId, ...parsed.value!, createdAt: now, updatedAt: now }

    await kv.set(productId, JSON.stringify(product))
    return c.json({ success: true, product })
  } catch (error) {
    return c.json({ error: 'Failed to add product: ' + error.message }, 500)
  }
})

app.put('/make-server-aca98767/products/:id', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) return c.json({ error: verifyResult.error }, verifyResult.status)
  if (verifyResult.userData.role !== 'admin' && verifyResult.userData.role !== 'manager') return c.json({ error: 'Only admin or manager can edit products' }, 403)

  try {
    const productId = c.req.param('id')
    const updatesRaw = await c.req.json()
    const updatesParsed = sanitizeProductUpdate(updatesRaw)
    if (!updatesParsed.ok) return c.json({ error: updatesParsed.error }, 400)

    const existingData = await kv.get(productId)
    if (!existingData) return c.json({ error: 'Product not found' }, 404)

    const product = typeof existingData === 'string' ? JSON.parse(existingData) : existingData
    const updatedProduct = { ...product, ...updatesParsed.value, id: productId, updatedAt: new Date().toISOString() }

    await kv.set(productId, JSON.stringify(updatedProduct))
    return c.json({ success: true, product: updatedProduct })
  } catch (error) {
    return c.json({ error: 'Failed to update product: ' + error.message }, 500)
  }
})

app.delete('/make-server-aca98767/products/:id', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  // Only admin can delete products
  if (verifyResult.userData.role !== 'admin' && verifyResult.userData.role !== 'manager') {
    return c.json({ error: 'Only admin or manager can delete products' }, 403)
  }

  try {
    const productId = c.req.param('id')
    await kv.del(productId)
    await logEvent({ type: 'product.delete', route: '/products/:id', userId: verifyResult.user.id, userName: verifyResult.userData.name, payload: { productId } })
    return c.json({ success: true })
  } catch (error) {
    console.log('Error deleting product:', error)
    return c.json({ error: 'Failed to delete product: ' + error.message }, 500)
  }
})

// ============ TRANSACTION ROUTES ============

app.post('/make-server-aca98767/transactions', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  try {
    const raw = await c.req.json()
    const parsed = validateTransaction(raw)
    if (!parsed.ok) return c.json({ error: parsed.error }, 400)
    const { items, discount, paymentMethod } = parsed.value!

    const transactionId = `transaction:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    let subtotal = 0
    let totalCogs = 0
    const processedItems = []

    for (const item of items) {
      const productData = await kv.get(item.productId)
      if (!productData) return c.json({ error: `Product ${item.productId} not found` }, 404)
      const product = typeof productData === 'string' ? JSON.parse(productData) : productData
      if (product.stock < item.quantity) return c.json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}` }, 400)

      // Update stock (best-effort atomic per product)
      const newStock = product.stock - item.quantity
      const nowIso = new Date().toISOString()
      product.stock = newStock
      product.updatedAt = nowIso
      await kv.set(item.productId, JSON.stringify(product))

      // Record stock history
      const historyId = `stock_history:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      await kv.set(historyId, JSON.stringify({
        id: historyId,
        productId: item.productId,
        productName: product.name,
        change: -item.quantity,
        type: 'transaction',
        timestamp: nowIso,
        userId: verifyResult.user.id,
        userName: verifyResult.userData.name,
        reason: 'Sales transaction'
      }))

      const itemTotal = product.sellingPrice * item.quantity
      const itemCogs = product.costPrice * item.quantity
      subtotal += itemTotal
      totalCogs += itemCogs
      processedItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        total: itemTotal,
        cogs: itemCogs
      })
    }

    const total = Math.max(0, subtotal - discount)
    const profit = total - totalCogs
    const now = new Date().toISOString()
    const transaction = { id: transactionId, items: processedItems, subtotal, discount, total, cogs: totalCogs, profit, paymentMethod, cashierId: verifyResult.user.id, cashierName: verifyResult.userData.name, timestamp: now, date: now.split('T')[0] }

    await kv.set(transactionId, JSON.stringify(transaction))
    await logEvent({ type: 'transaction.create', route: '/transactions', userId: verifyResult.user.id, userName: verifyResult.userData.name, payload: { transactionId, subtotal, discount, total } })
    return c.json({ success: true, transaction })
  } catch (error) {
    return c.json({ error: 'Failed to process transaction: ' + error.message }, 500)
  }
})

app.get('/make-server-aca98767/transactions', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  try {
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    const limitRaw = c.req.query('limit')
    let limit = parseInt(limitRaw || '100')
    if (!Number.isFinite(limit)) limit = 100
    limit = Math.min(Math.max(limit, 1), 1000)

    const transactions = await kv.getByPrefix('transaction:')
    let transactionList = transactions
      .filter(t => t != null)
      .map(t => {
        try {
          return typeof t === 'string' ? JSON.parse(t) : t
        } catch (parseError) {
          console.log('Error parsing transaction:', t, parseError)
          return null
        }
      })
      .filter(t => t != null)

    // Filter by date if provided
    if (startDate) {
      transactionList = transactionList.filter(t => t.date >= startDate)
    }
    if (endDate) {
      transactionList = transactionList.filter(t => t.date <= endDate)
    }

    // Sort by timestamp descending
    transactionList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Limit results
    transactionList = transactionList.slice(0, limit)

    return c.json({ transactions: transactionList })
  } catch (error) {
    console.log('Error fetching transactions:', error)
    return c.json({ error: 'Failed to fetch transactions: ' + error.message }, 500)
  }
})

app.get('/make-server-aca98767/transactions/summary', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  try {
    const date = c.req.query('date') || new Date().toISOString().split('T')[0]

    const transactions = await kv.getByPrefix('transaction:')
    const transactionList = transactions
      .filter(t => t != null)
      .map(t => {
        try {
          return typeof t === 'string' ? JSON.parse(t) : t
        } catch (parseError) {
          console.log('Error parsing transaction in summary:', t, parseError)
          return null
        }
      })
      .filter(t => t != null && t.date === date)

    const summary = {
      date,
      totalSales: transactionList.reduce((sum, t) => sum + t.total, 0),
      totalProfit: transactionList.reduce((sum, t) => sum + t.profit, 0),
      totalCogs: transactionList.reduce((sum, t) => sum + t.cogs, 0),
      totalTransactions: transactionList.length,
      totalItems: transactionList.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0)
    }

    return c.json({ summary })
  } catch (error) {
    console.log('Error fetching summary:', error)
    return c.json({ error: 'Failed to fetch summary: ' + error.message }, 500)
  }
})

// ============ REPORT ROUTES ============

app.get('/make-server-aca98767/reports/sales', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  // Only admin and manager can view reports
  if (verifyResult.userData.role === 'cashier') {
    return c.json({ error: 'Only admin or manager can view reports' }, 403)
  }

  try {
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    const groupBy = c.req.query('groupBy') || 'day' // day, week, month

    const transactions = await kv.getByPrefix('transaction:')
    let transactionList = transactions
      .filter(t => t != null)
      .map(t => {
        try {
          return typeof t === 'string' ? JSON.parse(t) : t
        } catch (parseError) {
          console.log('Error parsing transaction in sales report:', t, parseError)
          return null
        }
      })
      .filter(t => t != null)

    // Filter by date
    if (startDate) {
      transactionList = transactionList.filter(t => t.date >= startDate)
    }
    if (endDate) {
      transactionList = transactionList.filter(t => t.date <= endDate)
    }

    // Group transactions
    const grouped: Record<string, any> = {}
    
    for (const transaction of transactionList) {
      let key = transaction.date
      
      if (groupBy === 'week') {
        const date = new Date(transaction.date)
        const week = Math.ceil((date.getDate()) / 7)
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-W${week}`
      } else if (groupBy === 'month') {
        key = transaction.date.substring(0, 7) // YYYY-MM
      }

      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          totalSales: 0,
          totalProfit: 0,
          totalCogs: 0,
          transactionCount: 0,
          itemCount: 0
        }
      }

      grouped[key].totalSales += transaction.total
      grouped[key].totalProfit += transaction.profit
      grouped[key].totalCogs += transaction.cogs
      grouped[key].transactionCount += 1
      grouped[key].itemCount += transaction.items.reduce((sum, i) => sum + i.quantity, 0)
    }

    const report = Object.values(grouped).sort((a, b) => b.period.localeCompare(a.period))

    return c.json({ report })
  } catch (error) {
    console.log('Error generating sales report:', error)
    return c.json({ error: 'Failed to generate sales report: ' + error.message }, 500)
  }
})

app.get('/make-server-aca98767/reports/products', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  // Only admin and manager can view reports
  if (verifyResult.userData.role === 'cashier') {
    return c.json({ error: 'Only admin or manager can view reports' }, 403)
  }

  try {
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')

    const transactions = await kv.getByPrefix('transaction:')
    let transactionList = transactions
      .filter(t => t != null)
      .map(t => {
        try {
          return typeof t === 'string' ? JSON.parse(t) : t
        } catch (parseError) {
          console.log('Error parsing transaction in product report:', t, parseError)
          return null
        }
      })
      .filter(t => t != null)

    // Filter by date
    if (startDate) {
      transactionList = transactionList.filter(t => t.date >= startDate)
    }
    if (endDate) {
      transactionList = transactionList.filter(t => t.date <= endDate)
    }

    // Group by product
    const productStats: Record<string, any> = {}

    for (const transaction of transactionList) {
      for (const item of transaction.items) {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            quantitySold: 0,
            totalRevenue: 0,
            totalCogs: 0,
            totalProfit: 0
          }
        }

        productStats[item.productId].quantitySold += item.quantity
        productStats[item.productId].totalRevenue += item.total
        productStats[item.productId].totalCogs += item.cogs
        productStats[item.productId].totalProfit += (item.total - item.cogs)
      }
    }

    const report = Object.values(productStats).sort((a, b) => b.totalRevenue - a.totalRevenue)

    return c.json({ report })
  } catch (error) {
    console.log('Error generating product report:', error)
    return c.json({ error: 'Failed to generate product report: ' + error.message }, 500)
  }
})

// ============ STOCK ROUTES ============

app.put('/make-server-aca98767/stock/:productId', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  // Only admin and manager can adjust stock manually
  if (verifyResult.userData.role === 'cashier') {
    return c.json({ error: 'Only admin or manager can adjust stock' }, 403)
  }

  try {
    const productId = c.req.param('productId')
    const raw = await c.req.json()
    const parsed = validateStockAdjustment(raw)
    if (!parsed.ok) return c.json({ error: parsed.error }, 400)
    const { change, type, reason } = parsed.value!

    const productData = await kv.get(productId)
    if (!productData) return c.json({ error: 'Product not found' }, 404)

    const product = typeof productData === 'string' ? JSON.parse(productData) : productData
    const newStock = Math.max(0, product.stock + change)
    const nowIso = new Date().toISOString()
    product.stock = newStock
    product.updatedAt = nowIso

    await kv.set(productId, JSON.stringify(product))

    const historyId = `stock_history:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    await kv.set(historyId, JSON.stringify({
      id: historyId,
      productId,
      productName: product.name,
      change,
      type: type || 'adjustment',
      timestamp: nowIso,
      userId: verifyResult.user.id,
      userName: verifyResult.userData.name,
      reason: reason || ''
    }))

    await logEvent({ type: 'stock.adjust', route: '/stock/:productId', userId: verifyResult.user.id, userName: verifyResult.userData.name, payload: { productId, change, type, reason } })

    return c.json({ success: true, product })
  } catch (error) {
    return c.json({ error: 'Failed to adjust stock: ' + error.message }, 500)
  }
})

app.get('/make-server-aca98767/stock/history', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  try {
    const productId = c.req.query('productId')
    const limit = parseInt(c.req.query('limit') || '50')

    let history = await kv.getByPrefix('stock_history:')
    let historyList = history
      .filter(h => h != null)
      .map(h => {
        try {
          return typeof h === 'string' ? JSON.parse(h) : h
        } catch (parseError) {
          console.log('Error parsing stock history:', h, parseError)
          return null
        }
      })
      .filter(h => h != null)

    // Filter by product if specified
    if (productId) {
      historyList = historyList.filter(h => h.productId === productId)
    }

    // Sort by timestamp descending
    historyList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Limit results
    historyList = historyList.slice(0, limit)

    return c.json({ history: historyList })
  } catch (error) {
    console.log('Error fetching stock history:', error)
    return c.json({ error: 'Failed to fetch stock history: ' + error.message }, 500)
  }
})

// ============ USER MANAGEMENT ROUTES ============

app.get('/make-server-aca98767/users', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  // Only manager can view all users
  if (verifyResult.userData.role !== 'manager') {
    return c.json({ error: 'Only manager can view users' }, 403)
  }

  try {
    const users = await kv.getByPrefix('user:')
    const userList = users
      .filter(u => u != null)
      .map(u => {
        try {
          const userData = typeof u === 'string' ? JSON.parse(u) : u
          // Don't send sensitive data
          return {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            createdAt: userData.createdAt
          }
        } catch (parseError) {
          console.log('Error parsing user:', u, parseError)
          return null
        }
      })
      .filter(u => u != null)
    return c.json({ users: userList })
  } catch (error) {
    console.log('Error fetching users:', error)
    return c.json({ error: 'Failed to fetch users: ' + error.message }, 500)
  }
})

app.put('/make-server-aca98767/users/:userId', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  // Only manager can update users
  if (verifyResult.userData.role !== 'manager') {
    return c.json({ error: 'Only manager can update users' }, 403)
  }

  try {
    const userId = c.req.param('userId')
    const updatesRaw = await c.req.json()
    const parsed = sanitizeUserUpdate(updatesRaw)
    if (!parsed.ok) return c.json({ error: parsed.error }, 400)

    const userData = await kv.get(`user:${userId}`)
    if (!userData) {
      return c.json({ error: 'User not found' }, 404)
    }

    const user = typeof userData === 'string' ? JSON.parse(userData) : userData
    const updatedUser = { ...user, ...parsed.value, updatedAt: new Date().toISOString() }

    await kv.set(`user:${userId}`, JSON.stringify(updatedUser))
    await logEvent({ type: 'user.update', route: '/users/:userId', userId: verifyResult.user.id, userName: verifyResult.userData.name, payload: { targetUserId: userId, updates: parsed.value } })
    return c.json({ success: true, user: updatedUser })
  } catch (error) {
    console.log('Error updating user:', error)
    return c.json({ error: 'Failed to update user: ' + error.message }, 500)
  }
})

// ============ ORDER MANAGEMENT ROUTES ============

app.post('/make-server-aca98767/orders', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  try {
    const orderData = await c.req.json()
    const orderId = `order:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Process items and calculate totals
    let totalAmount = 0
    const processedItems = []

    for (const item of orderData.items) {
      const productData = await kv.get(item.productId)
      if (!productData) {
        return c.json({ error: `Product ${item.productId} not found` }, 404)
      }

      const product = typeof productData === 'string' ? JSON.parse(productData) : productData
      const itemTotal = product.sellingPrice * item.quantity
      
      totalAmount += itemTotal

      processedItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        sellingPrice: product.sellingPrice,
        total: itemTotal
      })
    }

    const order = {
      id: orderId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      items: processedItems,
      totalAmount,
      deliveryDate: orderData.deliveryDate,
      deliveryTime: orderData.deliveryTime,
      status: 'pending', // pending, shipped, delivered
      stockReduced: false,
      notes: orderData.notes || '',
      createdBy: verifyResult.user.id,
      createdByName: verifyResult.userData.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await kv.set(orderId, JSON.stringify(order))
    return c.json({ success: true, order })
  } catch (error) {
    console.log('Error creating order:', error)
    return c.json({ error: 'Failed to create order: ' + error.message }, 500)
  }
})

app.get('/make-server-aca98767/orders', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  try {
    const status = c.req.query('status')
    const orders = await kv.getByPrefix('order:')
    
    let orderList = orders
      .filter(o => o != null)
      .map(o => {
        try {
          return typeof o === 'string' ? JSON.parse(o) : o
        } catch (parseError) {
          console.log('Error parsing order:', o, parseError)
          return null
        }
      })
      .filter(o => o != null)

    // Filter by status if provided
    if (status) {
      orderList = orderList.filter(o => o.status === status)
    }

    // Sort by delivery date ascending (earliest first)
    orderList.sort((a, b) => {
      const dateA = new Date(`${a.deliveryDate}T${a.deliveryTime || '00:00'}`)
      const dateB = new Date(`${b.deliveryDate}T${b.deliveryTime || '00:00'}`)
      return dateA.getTime() - dateB.getTime()
    })

    return c.json({ orders: orderList })
  } catch (error) {
    console.log('Error fetching orders:', error)
    return c.json({ error: 'Failed to fetch orders: ' + error.message }, 500)
  }
})

app.put('/make-server-aca98767/orders/:id', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  try {
    const orderId = c.req.param('id')
    const updates = await c.req.json()

    const existingData = await kv.get(orderId)
    if (!existingData) {
      return c.json({ error: 'Order not found' }, 404)
    }

    const order = typeof existingData === 'string' ? JSON.parse(existingData) : existingData

    // Sanitize status
    if (updates.status !== undefined) {
      const allowedStatus = ['pending', 'shipped', 'delivered']
      if (!allowedStatus.includes(updates.status)) return c.json({ error: 'Invalid status' }, 400)
    }
    
    // If status is being changed to 'shipped' and stock hasn't been reduced yet
    if (updates.status === 'shipped' && !order.stockReduced) {
      for (const item of order.items) {
        const productData = await kv.get(item.productId)
        if (productData) {
          const product = typeof productData === 'string' ? JSON.parse(productData) : productData

          if (product.stock < item.quantity) {
            return c.json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}` }, 400)
          }

          product.stock -= item.quantity
          product.updatedAt = new Date().toISOString()
          await kv.set(item.productId, JSON.stringify(product))

          const historyId = `stock_history:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          await kv.set(historyId, JSON.stringify({
            id: historyId,
            productId: item.productId,
            productName: product.name,
            change: -item.quantity,
            type: 'order',
            timestamp: new Date().toISOString(),
            userId: verifyResult.user.id,
            userName: verifyResult.userData.name,
            reason: `Order delivery: ${order.customerName}`
          }))
        }
      }

      updates.stockReduced = true
      updates.shippedAt = new Date().toISOString()
      updates.shippedBy = verifyResult.userData.name
      await logEvent({ type: 'order.ship', route: '/orders/:id', userId: verifyResult.user.id, userName: verifyResult.userData.name, payload: { orderId } })
    }

    if (updates.status === 'delivered') {
      updates.deliveredAt = new Date().toISOString()
      await logEvent({ type: 'order.deliver', route: '/orders/:id', userId: verifyResult.user.id, userName: verifyResult.userData.name, payload: { orderId } })
    }

    const updatedOrder = { ...order, ...updates, updatedAt: new Date().toISOString() }

    await kv.set(orderId, JSON.stringify(updatedOrder))
    return c.json({ success: true, order: updatedOrder })
  } catch (error) {
    console.log('Error updating order:', error)
    return c.json({ error: 'Failed to update order: ' + error.message }, 500)
  }
})

app.delete('/make-server-aca98767/orders/:id', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  // Only admin and manager can delete orders
  if (verifyResult.userData.role === 'cashier') {
    return c.json({ error: 'Only admin or manager can delete orders' }, 403)
  }

  try {
    const orderId = c.req.param('id')
    await kv.del(orderId)
    return c.json({ success: true })
  } catch (error) {
    console.log('Error deleting order:', error)
    return c.json({ error: 'Failed to delete order: ' + error.message }, 500)
  }
})

// Get upcoming orders (for notifications)
app.get('/make-server-aca98767/orders/upcoming', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  try {
    const orders = await kv.getByPrefix('order:')
    const orderList = orders
      .filter(o => o != null)
      .map(o => {
        try {
          return typeof o === 'string' ? JSON.parse(o) : o
        } catch (parseError) {
          return null
        }
      })
      .filter(o => o != null && o.status === 'pending')

    // Get current date and tomorrow's date
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(23, 59, 59, 999)
    
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Filter orders that need to be delivered tomorrow or are overdue
    const upcomingOrders = orderList.filter(order => {
      const deliveryDate = new Date(order.deliveryDate)
      return deliveryDate <= tomorrow
    })

    return c.json({ orders: upcomingOrders })
  } catch (error) {
    console.log('Error fetching upcoming orders:', error)
    return c.json({ error: 'Failed to fetch upcoming orders: ' + error.message }, 500)
  }
})

// ============ PURCHASE MANAGEMENT ROUTES ============

app.post('/make-server-aca98767/purchases', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  // Only admin and manager can create purchases
  if (verifyResult.userData.role === 'cashier') {
    return c.json({ error: 'Only admin or manager can create purchases' }, 403)
  }

  try {
    const purchaseRaw = await c.req.json()
    const parsed = validatePurchase(purchaseRaw)
    if (!parsed.ok) return c.json({ error: parsed.error }, 400)

    const purchaseId = `purchase:${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    let totalAmount = 0
    const processedItems = []

    for (const item of parsed.value!.items) {
      const itemTotal = item.purchasePrice * item.quantity
      totalAmount += itemTotal

      processedItems.push({
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit ?? 'pcs',
        purchasePrice: item.purchasePrice,
        total: itemTotal
      })
    }

    const purchase = {
      id: purchaseId,
      supplier: parsed.value!.supplier || '',
      fundingSource: parsed.value!.fundingSource || 'company',
      fundingOwner: parsed.value!.fundingOwner || '',
      items: processedItems,
      totalAmount,
      purchaseDate: parsed.value!.purchaseDate || new Date().toISOString().split('T')[0],
      createdBy: verifyResult.user.id,
      createdByName: verifyResult.userData.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await kv.set(purchaseId, JSON.stringify(purchase))
    await logEvent({ type: 'purchase.create', route: '/purchases', userId: verifyResult.user.id, userName: verifyResult.userData.name, payload: { purchaseId, totalAmount } })
    return c.json({ success: true, purchase })
  } catch (error) {
    console.log('Error creating purchase:', error)
    return c.json({ error: 'Failed to create purchase: ' + error.message }, 500)
  }
})

app.get('/make-server-aca98767/purchases', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  try {
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    
    const purchases = await kv.getByPrefix('purchase:')
    
    let purchaseList = purchases
      .filter(p => p != null)
      .map(p => {
        try {
          return typeof p === 'string' ? JSON.parse(p) : p
        } catch (parseError) {
          console.log('Error parsing purchase:', p, parseError)
          return null
        }
      })
      .filter(p => p != null)

    // Filter by date range if provided
    if (startDate && endDate) {
      purchaseList = purchaseList.filter(p => {
        const pDate = p.purchaseDate
        return pDate >= startDate && pDate <= endDate
      })
    }

    // Normalize legacy fields for UI compatibility
    purchaseList = purchaseList.map(p => {
      return {
        ...p,
        supplier: p.supplier ?? p.supplierName ?? '',
        items: Array.isArray(p.items) ? p.items.map(item => ({
          ...item,
          unit: item.unit ?? 'pcs'
        })) : []
      }
    })

    // Sort by purchase date descending (newest first)
    purchaseList.sort((a, b) => {
      return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    })

    return c.json({ purchases: purchaseList })
  } catch (error) {
    console.log('Error fetching purchases:', error)
    return c.json({ error: 'Failed to fetch purchases: ' + error.message }, 500)
  }
})

app.get('/make-server-aca98767/purchases/:id', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  try {
    const purchaseId = c.req.param('id')
    const purchaseData = await kv.get(purchaseId)
    
    if (!purchaseData) {
      return c.json({ error: 'Purchase not found' }, 404)
    }

    const purchaseRaw = typeof purchaseData === 'string' ? JSON.parse(purchaseData) : purchaseData
    const purchase = {
      ...purchaseRaw,
      supplier: purchaseRaw.supplier ?? purchaseRaw.supplierName ?? '',
      items: Array.isArray(purchaseRaw.items) ? purchaseRaw.items.map(item => ({
        ...item,
        unit: item.unit ?? 'pcs'
      })) : []
    }
    return c.json({ purchase })
  } catch (error) {
    console.log('Error fetching purchase:', error)
    return c.json({ error: 'Failed to fetch purchase: ' + error.message }, 500)
  }
})

app.delete('/make-server-aca98767/purchases/:id', async (c) => {
  const verifyResult = await verifyUser(c.req.raw)
  if (verifyResult.error) {
    return c.json({ error: verifyResult.error }, verifyResult.status)
  }

  // Only manager can delete purchases
  if (verifyResult.userData.role !== 'manager') {
    return c.json({ error: 'Only manager can delete purchases' }, 403)
  }

  try {
    const purchaseId = c.req.param('id')
    await kv.del(purchaseId)
    await logEvent({ type: 'purchase.delete', route: '/purchases/:id', userId: verifyResult.user.id, userName: verifyResult.userData.name, payload: { purchaseId } })
    return c.json({ success: true })
  } catch (error) {
    console.log('Error deleting purchase:', error)
    return c.json({ error: 'Failed to delete purchase: ' + error.message }, 500)
  }
})

Deno.serve(app.fetch)
