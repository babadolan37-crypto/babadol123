import { projectId, publicAnonKey } from './info'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-aca98767`

export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export async function api(endpoint: string, options: RequestInit = {}) {
  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token || publicAnonKey

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  const data = await response.json()
  
  if (!response.ok) {
    console.error(`API Error (${endpoint}):`, data)
    throw new Error(data.error || 'API request failed')
  }

  return data
}

// Auth functions
export async function signUp(email: string, password: string, name: string, role: string = 'cashier') {
  console.log('Attempting signup for:', email, 'with role:', role)
  
  try {
    const result = await api('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    })
    
    console.log('Signup result:', result)
    return result
  } catch (error: any) {
    console.error('Signup API error:', error)
    throw error
  }
}

// Debug function to list users
export async function debugListUsers() {
  return api('/debug/users')
}

// Check rate limit before login
export async function checkLoginRateLimit(email: string) {
  return api('/auth/check-rate-limit', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

// Record login attempt result
export async function recordLoginAttempt(email: string, success: boolean) {
  return api('/auth/record-attempt', {
    method: 'POST',
    body: JSON.stringify({ email, success }),
  })
}

export async function signIn(email: string, password: string) {
  console.log('Attempting sign in for:', email)
  
  // Check rate limit first
  try {
    const rateLimitCheck = await checkLoginRateLimit(email)
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.error)
    }
  } catch (error: any) {
    // If it's a rate limit error, throw it
    if (error.message.includes('percobaan login')) {
      throw error
    }
    // Otherwise, log but continue (network error, etc.)
    console.warn('Rate limit check failed, continuing with login:', error)
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // Record the attempt result
  try {
    await recordLoginAttempt(email, !error)
  } catch (recordError) {
    console.warn('Failed to record login attempt:', recordError)
  }

  if (error) {
    console.error('Sign in error details:', error)
    throw new Error(error.message)
  }

  console.log('Sign in successful')
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Sign out error:', error)
    throw new Error(error.message)
  }
}

// Google OAuth Sign In
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    }
  })

  if (error) {
    console.error('Google sign in error:', error)
    throw new Error(error.message)
  }

  return data
}

// Reset Password - Send email with reset link
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    console.error('Reset password error:', error)
    throw new Error(error.message)
  }

  return { success: true }
}

// Update Password (when user has reset token or is logged in)
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    console.error('Update password error:', error)
    throw new Error(error.message)
  }

  return { success: true }
}

// Change Password (requires old password verification)
export async function changePassword(oldPassword: string, newPassword: string) {
  // First verify old password by trying to sign in
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.email) {
    throw new Error('User not found')
  }

  // Verify old password
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: oldPassword,
  })

  if (verifyError) {
    throw new Error('Password lama salah')
  }

  // Update to new password
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    console.error('Change password error:', error)
    throw new Error(error.message)
  }

  return { success: true }
}

// Update user profile
export async function updateUserProfile(name: string) {
  return api('/user/profile', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

export async function getCurrentUser() {
  return api('/user')
}

// Product functions
export async function getProducts() {
  return api('/products')
}

export async function addProduct(product: any) {
  return api('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  })
}

export async function updateProduct(productId: string, updates: any) {
  return api(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deleteProduct(productId: string) {
  return api(`/products/${productId}`, {
    method: 'DELETE',
  })
}

// Transaction functions
export async function createTransaction(transaction: any) {
  return api('/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction),
  })
}

export async function getTransactions(startDate?: string, endDate?: string, limit?: number) {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  if (limit) params.append('limit', limit.toString())
  
  const query = params.toString() ? `?${params.toString()}` : ''
  return api(`/transactions${query}`)
}

export async function getTransactionSummary(date?: string) {
  const query = date ? `?date=${date}` : ''
  return api(`/transactions/summary${query}`)
}

// Stock functions
export async function adjustStock(productId: string, change: number, type: string, reason?: string) {
  return api(`/stock/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ change, type, reason }),
  })
}

export async function getStockHistory(productId?: string, limit?: number) {
  const params = new URLSearchParams()
  if (productId) params.append('productId', productId)
  if (limit) params.append('limit', limit.toString())
  
  const query = params.toString() ? `?${params.toString()}` : ''
  return api(`/stock/history${query}`)
}

// Report functions
export async function getSalesReport(startDate?: string, endDate?: string, groupBy?: string) {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  if (groupBy) params.append('groupBy', groupBy)
  
  const query = params.toString() ? `?${params.toString()}` : ''
  return api(`/reports/sales${query}`)
}

export async function getProductReport(startDate?: string, endDate?: string) {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  
  const query = params.toString() ? `?${params.toString()}` : ''
  return api(`/reports/products${query}`)
}

// User management functions
export async function getUsers() {
  return api('/users')
}

export async function updateUser(userId: string, updates: any) {
  return api(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

// Order management functions
export async function createOrder(order: any) {
  return api('/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  })
}

export async function getOrders(status?: string) {
  const query = status ? `?status=${status}` : ''
  return api(`/orders${query}`)
}

export async function updateOrder(orderId: string, updates: any) {
  return api(`/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deleteOrder(orderId: string) {
  return api(`/orders/${orderId}`, {
    method: 'DELETE',
  })
}

export async function getUpcomingOrders() {
  return api('/orders/upcoming')
}

// Purchase management functions
export async function createPurchase(purchase: any) {
  return api('/purchases', {
    method: 'POST',
    body: JSON.stringify(purchase),
  })
}

export async function getPurchases(startDate?: string, endDate?: string) {
  let query = ''
  if (startDate && endDate) {
    query = `?startDate=${startDate}&endDate=${endDate}`
  }
  return api(`/purchases${query}`)
}

export async function getPurchase(purchaseId: string) {
  return api(`/purchases/${purchaseId}`)
}

export async function deletePurchase(purchaseId: string) {
  return api(`/purchases/${purchaseId}`, {
    method: 'DELETE',
  })
}
