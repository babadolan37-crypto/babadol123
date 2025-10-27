import React, { useState, useEffect } from 'react'
import { getProducts, addProduct, updateProduct, deleteProduct } from './api'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { DemoDataButton } from './DemoDataButton'

interface Product {
  id: string
  name: string
  category: string
  sellingPrice: number
  costPrice: number
  stock: number
  description: string
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    sellingPrice: '',
    costPrice: '',
    stock: '',
    description: ''
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      setProducts(data.products)
    } catch (error: any) {
      console.error('Error loading products:', error)
      toast.error(`Gagal memuat produk: ${error.message}`)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      sellingPrice: '',
      costPrice: '',
      stock: '',
      description: ''
    })
    setEditingProduct(null)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      sellingPrice: product.sellingPrice.toString(),
      costPrice: product.costPrice.toString(),
      stock: product.stock.toString(),
      description: product.description
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData)
        toast.success('Produk berhasil diperbarui!')
      } else {
        await addProduct(formData)
        toast.success('Produk berhasil ditambahkan!')
      }
      
      await loadProducts()
      setShowDialog(false)
      resetForm()
    } catch (error: any) {
      console.error('Error saving product:', error)
      toast.error(`Gagal menyimpan produk: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${productName}"?`)) {
      return
    }

    try {
      await deleteProduct(productId)
      toast.success('Produk berhasil dihapus!')
      await loadProducts()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast.error(`Gagal menghapus produk: ${error.message}`)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl">Manajemen Produk</h2>
          <p className="text-gray-600">Kelola produk yang dijual</p>
        </div>
        <div className="flex gap-2">
          {products.length === 0 && <DemoDataButton />}
          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Perbarui informasi produk' : 'Masukkan informasi produk baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sellingPrice">Harga Jual (Rp) *</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costPrice">HPP (Rp) *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    min="0"
                    step="100"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stok Awal *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  disabled={!!editingProduct}
                />
                {editingProduct && (
                  <p className="text-xs text-gray-600">
                    Gunakan menu Manajemen Stok untuk mengubah stok
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Menyimpan...' : editingProduct ? 'Perbarui' : 'Tambah'}
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
          <CardDescription>Total: {products.length} produk</CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead>HPP</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      Tidak ada produk ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const margin = product.sellingPrice - product.costPrice
                    const marginPercent = (margin / product.costPrice * 100).toFixed(1)
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div>{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-gray-600">{product.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                        <TableCell>{formatCurrency(product.costPrice)}</TableCell>
                        <TableCell>
                          <div className="text-green-600">
                            {formatCurrency(margin)} ({marginPercent}%)
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={product.stock < 10 ? 'text-red-600' : ''}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product.id, product.name)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
