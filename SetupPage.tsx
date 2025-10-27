import React, { useState } from 'react'
import { signUp } from './api'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Alert, AlertDescription } from './alert'
import { ShoppingCart, Eye, EyeOff, Shield, Check, X } from 'lucide-react'
import { toast } from 'sonner'

interface SetupPageProps {
  onComplete: () => void
}

export function SetupPage({ onComplete }: SetupPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin'
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password validation
  const passwordValidation = {
    minLength: formData.password.length >= 6,
    match: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (formData.password.length < 6) {
      toast.error('❌ Password harus minimal 6 karakter')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('❌ Password dan konfirmasi password tidak cocok')
      return
    }
    
    setLoading(true)

    try {
      await signUp(formData.email, formData.password, formData.name, formData.role)
      toast.success('✅ Akun berhasil dibuat! Silakan login dengan email dan password yang baru saja dibuat.')
      
      // Wait a moment before redirecting to login
      setTimeout(() => {
        onComplete()
      }, 1500)
    } catch (error: any) {
      console.error('Setup error:', error)
      toast.error(`❌ Gagal membuat akun: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-full">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-center">Selamat Datang di Sistem POS</CardTitle>
          <CardDescription className="text-center">
            Buat akun admin pertama untuk memulai
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Security Info */}
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800">
              <strong>Keamanan Tinggi:</strong> Sistem ini menggunakan enkripsi password 
              dan perlindungan dari brute force attack dengan rate limiting.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@perusahaan.com"
                required
              />
              <p className="text-xs text-gray-600">
                Email akan digunakan untuk login
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Buat password yang kuat"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength indicators */}
              {formData.password && (
                <div className="space-y-1 text-xs mt-2">
                  <div className={`flex items-center gap-1 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>Minimal 6 karakter</span>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Masukkan password yang sama"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className={`flex items-center gap-1 text-xs ${passwordValidation.match ? 'text-green-600' : 'text-red-600'}`}>
                  {passwordValidation.match ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>{passwordValidation.match ? 'Password cocok' : 'Password tidak cocok'}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manajer</SelectItem>
                  <SelectItem value="cashier">Kasir</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                Pilih Admin atau Manajer untuk akses penuh
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !passwordValidation.minLength || !passwordValidation.match}
            >
              {loading ? 'Membuat Akun...' : 'Buat Akun & Mulai'}
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800">
              <strong>Catatan:</strong> Setelah akun dibuat, Anda akan diarahkan ke halaman login. 
              Gunakan email dan password yang baru saja Anda buat untuk masuk ke sistem.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
