import React, { useState, useEffect } from 'react'
import { getUsers, updateUser, signUp } from './api'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Badge } from './badge'
import { Users, Plus, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
  role: 'cashier' | 'admin' | 'manager'
  createdAt: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'cashier' as 'cashier' | 'admin' | 'manager'
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await getUsers()
      setUsers(data.users)
    } catch (error: any) {
      console.error('Error loading users:', error)
      toast.error(`Gagal memuat pengguna: ${error.message}`)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      role: 'cashier'
    })
    setEditingUser(null)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingUser) {
        // Update existing user
        await updateUser(editingUser.id, {
          name: formData.name,
          role: formData.role
        })
        toast.success('Pengguna berhasil diperbarui!')
      } else {
        // Create new user
        if (!formData.password) {
          toast.error('Password diperlukan untuk pengguna baru')
          setLoading(false)
          return
        }
        await signUp(formData.email, formData.password, formData.name, formData.role)
        toast.success('Pengguna berhasil ditambahkan!')
      }
      
      await loadUsers()
      setShowDialog(false)
      resetForm()
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast.error(`Gagal menyimpan pengguna: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", text: string }> = {
      cashier: { variant: 'default', text: 'Kasir' },
      admin: { variant: 'secondary', text: 'Admin' },
      manager: { variant: 'destructive', text: 'Manajer' }
    }
    const config = variants[role] || { variant: 'outline', text: role }
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const roleStats = {
    cashier: users.filter(u => u.role === 'cashier').length,
    admin: users.filter(u => u.role === 'admin').length,
    manager: users.filter(u => u.role === 'manager').length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl">Manajemen Pengguna</h2>
          <p className="text-gray-600">Kelola hak akses pengguna sistem</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Perbarui informasi pengguna' : 'Buat akun pengguna baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  required
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-gray-600">Email tidak dapat diubah</p>
                )}
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    minLength={6}
                  />
                  <p className="text-xs text-gray-600">Minimal 6 karakter</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Kasir</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manajer</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Kasir:</strong> Transaksi penjualan, lihat stok</p>
                  <p><strong>Admin:</strong> Kelola produk, stok, lihat laporan</p>
                  <p><strong>Manajer:</strong> Akses penuh termasuk kelola pengguna</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Menyimpan...' : editingUser ? 'Perbarui' : 'Tambah'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Pengguna</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Kasir</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{roleStats.cashier}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Admin</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{roleStats.admin}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Manajer</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{roleStats.manager}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
          <CardDescription>Kelola hak akses dan informasi pengguna</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      Tidak ada pengguna
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Info */}
      <Card>
        <CardHeader>
          <CardTitle>Hak Akses Role</CardTitle>
          <CardDescription>Izin yang dimiliki setiap role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="flex items-center gap-2 mb-2">
                {getRoleBadge('cashier')} Kasir
              </h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Melakukan transaksi penjualan</li>
                <li>Melihat daftar produk dan stok</li>
                <li>Melihat dashboard kasir</li>
              </ul>
            </div>

            <div>
              <h4 className="flex items-center gap-2 mb-2">
                {getRoleBadge('admin')} Admin
              </h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Semua hak akses Kasir</li>
                <li>Menambah, mengedit, dan menghapus produk</li>
                <li>Mengelola stok produk</li>
                <li>Melihat laporan keuangan dan penjualan</li>
              </ul>
            </div>

            <div>
              <h4 className="flex items-center gap-2 mb-2">
                {getRoleBadge('manager')} Manajer
              </h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Semua hak akses Admin</li>
                <li>Mengelola pengguna dan hak akses</li>
                <li>Melihat seluruh laporan sistem</li>
                <li>Akses penuh ke semua fitur</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
