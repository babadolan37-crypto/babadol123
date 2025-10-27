import * as React from "react";
import { useState } from 'react';
import { signUp, signInWithGoogle } from './api';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Alert, AlertDescription } from './alert';
import { 
  ShoppingCart, 
  Eye, 
  EyeOff, 
  Shield, 
  Check, 
  X, 
  Mail, 
  Lock,
  User,
  ArrowLeft,
  Chrome
} from 'lucide-react';
import { toast } from 'sonner';

interface RegisterPageProps {
  onComplete: () => void;
  onBackToLogin: () => void;
}

export function RegisterPage({ onComplete, onBackToLogin }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'cashier'
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Enhanced password validation
  const passwordValidation = {
    minLength: formData.password.length >= 6,
    hasNumber: /\d/.test(formData.password),
    hasLetter: /[a-zA-Z]/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0
  };

  const isPasswordValid = passwordValidation.minLength && passwordValidation.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!isPasswordValid) {
      toast.error('❌ Mohon perbaiki password sesuai ketentuan');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('❌ Nama lengkap wajib diisi');
      return;
    }
    
    setLoading(true);

    try {
      await signUp(formData.email, formData.password, formData.name, formData.role);
      toast.success(
        '✅ Akun berhasil dibuat! Cek email Anda untuk verifikasi.',
        { duration: 5000 }
      );
      
      // Wait before redirecting
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message.includes('already registered')) {
        toast.error('❌ Email sudah terdaftar. Silakan login atau gunakan email lain.');
      } else {
        toast.error(`❌ Gagal membuat akun: ${error.message}`);
      }
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('✅ Berhasil! Anda akan diarahkan ke Google...');
    } catch (error: any) {
      console.error('Google sign up error:', error);
      toast.error(`❌ Gagal login dengan Google: ${error.message}`);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToLogin}
            className="w-fit mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Login
          </Button>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-full">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-center">Daftar Akun Baru</CardTitle>
          <CardDescription className="text-center">
            Buat akun untuk menggunakan Sistem POS
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Sign Up */}
          <div className="space-y-4 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
            >
              <Chrome className="h-4 w-4 mr-2" />
              {googleLoading ? 'Menghubungkan...' : 'Daftar dengan Google'}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Atau daftar dengan email
                </span>
              </div>
            </div>
          </div>

          {/* Security Info */}
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Shield className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800">
              <strong>Keamanan Terjamin:</strong> Password dienkripsi dengan teknologi modern 
              dan akun dilindungi verifikasi email.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                <User className="inline h-3 w-3 mr-1" />
                Nama Lengkap *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-3 w-3 mr-1" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="nama@perusahaan.com"
                required
              />
              <p className="text-xs text-gray-600">
                Email akan digunakan untuk login dan verifikasi akun
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                <Lock className="inline h-3 w-3 mr-1" />
                Password *
              </Label>
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
                <div className="space-y-1 text-xs mt-2 p-2 bg-gray-50 rounded">
                  <div className={`flex items-center gap-1 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.minLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>Minimal 6 karakter</span>
                  </div>
                  <div className={`flex items-center gap-1 ${passwordValidation.hasLetter ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.hasLetter ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>Mengandung huruf</span>
                  </div>
                  <div className={`flex items-center gap-1 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordValidation.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    <span>Mengandung angka (direkomendasikan)</span>
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
                  <SelectItem value="cashier">Kasir - Transaksi & Stok</SelectItem>
                  <SelectItem value="admin">Admin - Kelola Produk & Laporan</SelectItem>
                  <SelectItem value="manager">Manajer - Akses Penuh</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                Pilih role sesuai dengan tugas Anda
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isPasswordValid}
            >
              {loading ? 'Membuat Akun...' : 'Daftar Sekarang'}
            </Button>
          </form>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs text-amber-800">
              <strong>Catatan Penting:</strong><br />
              • Setelah mendaftar, cek email Anda untuk link verifikasi<br />
              • Klik link verifikasi untuk mengaktifkan akun<br />
              • Setelah verifikasi, Anda bisa login ke sistem
            </p>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">Sudah punya akun? </span>
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Login di sini
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

