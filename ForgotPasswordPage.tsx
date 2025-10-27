import * as React from "react";
import { useState } from 'react';
import { resetPassword } from './api';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { ShoppingCart, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordPage({ onBackToLogin }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('❌ Email wajib diisi');
      return;
    }
    
    setLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      toast.success('✅ Email reset password telah dikirim!');
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(`❌ Gagal mengirim email reset: ${error.message}`);
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-600 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-center">Email Terkirim!</CardTitle>
            <CardDescription className="text-center">
              Cek inbox email Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 border-green-200">
              <Mail className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                Kami telah mengirim link reset password ke <strong>{email}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Langkah selanjutnya:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Buka email Anda dan cari email dari sistem</li>
                <li>Klik link "Reset Password" di email</li>
                <li>Buat password baru Anda</li>
                <li>Login dengan password baru</li>
              </ol>
            </div>

            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-xs text-amber-800">
                <strong>Tidak menerima email?</strong><br />
                • Cek folder spam/junk<br />
                • Tunggu beberapa menit<br />
                • Pastikan email yang dimasukkan benar<br />
                • Coba kirim ulang dengan tombol di bawah
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setEmail('');
                }}
                variant="outline"
                className="w-full"
              >
                Kirim Ulang
              </Button>
              <Button
                onClick={onBackToLogin}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Kembali ke Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <CardTitle className="text-center">Lupa Password?</CardTitle>
          <CardDescription className="text-center">
            Kami akan mengirim link reset password ke email Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Mail className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800">
              Masukkan email yang terdaftar di sistem. Kami akan mengirim 
              instruksi reset password ke email tersebut.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-3 w-3 mr-1" />
                Email Terdaftar
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                required
                autoFocus
              />
              <p className="text-xs text-gray-600">
                Gunakan email yang sama dengan saat pendaftaran
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600 mb-2">Ingat password Anda?</p>
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Kembali ke halaman login
            </button>
          </div>

          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-xs text-gray-700">
              <strong>Keamanan:</strong> Link reset password hanya berlaku 1 jam 
              dan hanya bisa digunakan sekali. Jika tidak digunakan, Anda perlu 
              request ulang.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

