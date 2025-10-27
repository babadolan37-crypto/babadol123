import * as React from "react";
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { updateUserProfile, changePassword, signOut } from './api';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Alert, AlertDescription } from './alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { 
  User, 
  Mail, 
  Shield, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Lock,
  LogOut,
  Save,
  Chrome
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfilePageProps {
  onClose: () => void;
}

export function UserProfilePage({ onClose }: UserProfilePageProps) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  // Password change form
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name,
        email: user.email
      });
    }
  }, [user]);

  // Password validation
  const passwordValidation = {
    minLength: passwordData.newPassword.length >= 6,
    hasNumber: /\d/.test(passwordData.newPassword),
    hasLetter: /[a-zA-Z]/.test(passwordData.newPassword),
    match: passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword.length > 0
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateUserProfile(profileData.name);
      await refreshUser();
      toast.success('✅ Profil berhasil diperbarui!');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(`❌ Gagal memperbarui profil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!passwordValidation.minLength) {
      toast.error('❌ Password baru minimal 6 karakter');
      return;
    }

    if (!passwordValidation.match) {
      toast.error('❌ Password baru dan konfirmasi tidak cocok');
      return;
    }

    setLoading(true);

    try {
      await changePassword(passwordData.oldPassword, passwordData.newPassword);
      toast.success('✅ Password berhasil diubah!');
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('Change password error:', error);
      toast.error(`❌ Gagal mengubah password: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin keluar?');
    if (!confirmed) return;

    try {
      await signOut();
      toast.success('✅ Berhasil logout');
      onClose();
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(`❌ Gagal logout: ${error.message}`);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'manager':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cashier':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'manager': return 'Manajer';
      case 'admin': return 'Admin';
      case 'cashier': return 'Kasir';
      default: return role;
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profil Pengguna</CardTitle>
              <CardDescription>
                Kelola informasi akun dan keamanan Anda
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* User Info Summary */}
          <Alert className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
            <Shield className="h-4 w-4 text-indigo-600" />
            <AlertDescription>
              <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-full">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{user?.name}</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user?.role || '')}`}>
                  {getRoleLabel(user?.role || '')}
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="security">
                <Lock className="h-4 w-4 mr-2" />
                Keamanan
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    <User className="inline h-3 w-3 mr-1" />
                    Nama Lengkap
                  </Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Nama lengkap Anda"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">
                    <Mail className="inline h-3 w-3 mr-1" />
                    Email
                  </Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profileData.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-600">
                    Email tidak dapat diubah untuk keamanan akun
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>
                    <Shield className="inline h-3 w-3 mr-1" />
                    Role
                  </Label>
                  <div className={`px-4 py-2 rounded-md text-sm font-medium border ${getRoleBadgeColor(user?.role || '')}`}>
                    {getRoleLabel(user?.role || '')}
                  </div>
                  <p className="text-xs text-gray-600">
                    Role ditentukan oleh administrator sistem
                  </p>
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </form>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <Lock className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-800">
                  <strong>Tips Keamanan:</strong> Gunakan password yang kuat dengan kombinasi 
                  huruf, angka, dan simbol. Jangan gunakan password yang sama dengan akun lain.
                </AlertDescription>
              </Alert>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Password Lama</Label>
                  <div className="relative">
                    <Input
                      id="oldPassword"
                      type={showOldPassword ? 'text' : 'password'}
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      placeholder="Masukkan password lama"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Buat password baru"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password strength indicators */}
                  {passwordData.newPassword && (
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
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Ulangi password baru"
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
                  {passwordData.confirmPassword && (
                    <div className={`flex items-center gap-1 text-xs ${passwordValidation.match ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordValidation.match ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      <span>{passwordValidation.match ? 'Password cocok' : 'Password tidak cocok'}</span>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || !passwordValidation.minLength || !passwordValidation.match}
                  className="w-full"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {loading ? 'Mengubah...' : 'Ubah Password'}
                </Button>
              </form>

              <div className="border-t pt-4 mt-6">
                <h3 className="text-sm font-medium mb-2">Metode Login</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Email & Password</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Aktif</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md opacity-50">
                    <div className="flex items-center gap-2">
                      <Chrome className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Google OAuth</span>
                    </div>
                    <span className="text-xs text-gray-500">Hubungi admin</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Logout Button */}
          <div className="border-t mt-6 pt-6">
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

