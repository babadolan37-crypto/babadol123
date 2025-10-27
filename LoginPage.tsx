import React, { useState } from 'react'
import { signIn, signUp, debugListUsers, supabase, signInWithGoogle } from './api'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Alert, AlertDescription } from './alert'
import { ShoppingCart, Sparkles, Bug, Eye, EyeOff, Shield, AlertTriangle, Chrome, UserPlus, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

interface LoginPageProps {
  onLogin: () => void
  onShowRegister?: () => void
  onShowForgotPassword?: () => void
}

export function LoginPage({ onLogin, onShowRegister, onShowForgotPassword }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [creatingDemo, setCreatingDemo] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const fillDemoCredentials = () => {
    setEmail('admin@demo.com')
    setPassword('demo123456')
    toast.info('Demo credentials filled. Click "Masuk" to login.')
  }

  const checkUsers = async () => {
    try {
      const result = await debugListUsers()
      console.log('Registered users:', result)
      toast.success(`Found ${result.count} users. Check console for details.`)
    } catch (error: any) {
      console.error('Error checking users:', error)
      toast.error('Error checking users')
    }
  }

  const deleteDemoUser = async () => {
    const confirmed = window.confirm('This will delete the demo user. Are you sure?')
    if (!confirmed) return
    
    try {
      // Note: This would need a server endpoint to actually delete
      // For now, just show info
      toast.info('Use "Buat Demo" button to recreate the demo account with correct credentials.')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error('Error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Attempting login with:', email)
      await signIn(email, password)
      toast.success('✅ Login berhasil!')
      onLogin()
    } catch (error: any) {
      console.error('Login error:', error)
      
      // More helpful error messages
      if (error.message.includes('percobaan login')) {
        // Rate limit error
        toast.error(error.message, { duration: 5000 })
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('❌ Email atau password salah. Pastikan akun sudah dibuat terlebih dahulu.')
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Email belum dikonfirmasi.')
      } else {
        toast.error(`❌ Login gagal: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const createDemoAccount = async () => {
    setCreatingDemo(true)
    const demoEmail = 'admin@demo.com'
    const demoPassword = 'demo123456'
    
    try {
      // Try to login first in case account already exists
      console.log('Attempting to login to existing demo account...')
      await signIn(demoEmail, demoPassword)
      toast.success('✅ Login berhasil sebagai Admin Demo!')
      onLogin()
    } catch (loginError: any) {
      // If login fails, try to create the account
      console.log('Login failed, attempting to create new demo account:', loginError.message)
      
      try {
        toast.info('Membuat akun demo baru...')
        const result = await signUp(demoEmail, demoPassword, 'Admin Demo', 'admin')
        console.log('Demo account created:', result)
        toast.success('✅ Akun demo berhasil dibuat!')
        
        // Wait for account to be fully propagated
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Auto login
        console.log('Auto-logging in with new demo account...')
        await signIn(demoEmail, demoPassword)
        toast.success('✅ Login berhasil sebagai Admin Demo!')
        onLogin()
      } catch (signupError: any) {
        console.error('Signup error details:', signupError)
        
        if (signupError.message.includes('already exists')) {
          toast.error('Akun demo sudah ada tapi password salah. Coba "Isi Demo" lalu "Masuk".')
        } else {
          toast.error(`Gagal membuat akun demo: ${signupError.message}`)
        }
      }
    } finally {
      setCreatingDemo(false)
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
          <CardTitle className="text-center">Sistem POS</CardTitle>
          <CardDescription className="text-center">
            Masuk ke akun Anda untuk melanjutkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Security Info */}
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800">
              <strong>Keamanan Terjamin:</strong> Sistem dilindungi dengan rate limiting. 
              Maksimal 5 percobaan login dalam 15 menit.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
              <p className="text-xs text-gray-600">
                Password minimal 6 karakter
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
          <div className="mt-6 space-y-4">
            <div className="border-t pt-4">
              <p className="text-sm text-center mb-3">Coba dengan akun demo:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fillDemoCredentials}
                  size="sm"
                >
                  Isi Demo
                </Button>
                <Button
                  type="button"
                  variant="default"
                  onClick={createDemoAccount}
                  disabled={creatingDemo}
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {creatingDemo ? 'Membuat...' : 'Buat Demo'}
                </Button>
              </div>
              <p className="text-xs text-center text-gray-600 mt-2">
                Email: admin@demo.com<br />
                Password: demo123456
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-xs text-amber-800">
                <strong>Cara Menggunakan:</strong><br />
                1. Klik "Buat Demo" untuk membuat akun demo otomatis<br />
                2. Atau klik "Isi Demo" lalu "Masuk" untuk login manual<br />
                3. Atau klik "Buat Akun Baru" di pojok kanan bawah
              </p>
            </div>
            
            {/* Debug Tools */}
            <div className="border-t pt-4">
              <p className="text-xs text-center mb-2 text-gray-500">Debug Tools:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={checkUsers}
                >
                  <Bug className="h-3 w-3 mr-1" />
                  Cek Users
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={deleteDemoUser}
                >
                  Reset Demo
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
