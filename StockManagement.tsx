import React, { useState, useEffect } from 'react'
import { getProducts, adjustStock, getStockHistory } from './api'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Package, TrendingUp, TrendingDown, History } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  category: string
  stock: number
  sellingPrice: number
}

interface StockHistory {
  id: string
  productId: string
  productName: string
  change: number
  type: string
  reason?: string
  oldStock?: number
  newStock?: number
  timestamp: string
  userName: string
}

export function StockManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [history, setHistory] = useState<StockHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  
  const [adjustmentData, setAdjustmentData] = useState({
    change: '',
    type: 'restock',
    reason: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsData, historyData] = await Promise.all([
        getProducts(),
        getStockHistory()
      ])
      setProducts(productsData.products)
      setHistory(historyData.history)
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error(`Gagal memuat data: ${error.message}`)
    }
  }

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    setLoading(true)
    try {
      const change = parseInt(adjustmentData.change)
      if (isNaN(change) || change === 0) {
        toast.error('Masukkan jumlah perubahan yang valid')
        return
      }

      await adjustStock(
        selectedProduct.id,
        change,
        adjustmentData.type,
        adjustmentData.reason
      )

      toast.success('Stok berhasil disesuaikan!')
      await loadData()
      setShowDialog(false)
      setSelectedProduct(null)
      setAdjustmentData({ change: '', type: 'restock', reason: '' })
    } catch (error: any) {
      console.error('Error adjusting stock:', error)
      toast.error(`Gagal menyesuaikan stok: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const lowStockProducts = products.filter(p => p.stock < 10)
  const outOfStockProducts = products.filter(p => p.stock === 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl">Manajemen Stok</h2>
        <p className="text-gray-600">Kelola dan pantau stok produk</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{products.length}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-300 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-orange-800">Stok Rendah</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-orange-900">{lowStockProducts.length}</div>
            <p className="text-xs text-orange-700">Stok kurang dari 10</p>
          </CardContent>
        </Card>

        <Card className="border-red-300 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm text-red-800">Stok Habis</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-red-900">{outOfStockProducts.length}</div>
            <p className="text-xs text-red-700">Perlu restock segera</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Stok Saat Ini</TabsTrigger>
          <TabsTrigger value="history">Riwayat Perubahan</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Stok Produk</CardTitle>
              <CardDescription>Kelola stok produk secara manual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <span className={product.stock === 0 ? 'text-red-600' : product.stock < 10 ? 'text-orange-600' : ''}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          {product.stock === 0 ? (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                              Habis
                            </span>
                          ) : product.stock < 10 ? (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                              Rendah
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                              Normal
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedProduct(product)}
                              >
                                Sesuaikan Stok
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Sesuaikan Stok</DialogTitle>
                                <DialogDescription>
                                  {product.name} - Stok saat ini: {product.stock}
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleAdjust} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="type">Tipe Penyesuaian</Label>
                                  <Select
                                    value={adjustmentData.type}
                                    onValueChange={(value) => setAdjustmentData({ ...adjustmentData, type: value })}
                                  >
                                    <SelectTrigger id="type">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="restock">Penambahan Stok (Restock)</SelectItem>
                                      <SelectItem value="adjustment">Penyesuaian Manual</SelectItem>
                                      <SelectItem value="damage">Barang Rusak/Hilang</SelectItem>
                                      <SelectItem value="return">Retur dari Pelanggan</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="change">
                                    Jumlah Perubahan (gunakan angka negatif untuk mengurangi)
                                  </Label>
                                  <Input
                                    id="change"
                                    type="number"
                                    value={adjustmentData.change}
                                    onChange={(e) => setAdjustmentData({ ...adjustmentData, change: e.target.value })}
                                    placeholder="contoh: 50 atau -10"
                                    required
                                  />
                                  <p className="text-xs text-gray-600">
                                    Stok baru akan menjadi: {product.stock + (parseInt(adjustmentData.change) || 0)}
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="reason">Alasan (opsional)</Label>
                                  <Textarea
                                    id="reason"
                                    value={adjustmentData.reason}
                                    onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                                    rows={3}
                                    placeholder="Jelaskan alasan penyesuaian stok..."
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? 'Menyimpan...' : 'Simpan'}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedProduct(null)
                                      setAdjustmentData({ change: '', type: 'restock', reason: '' })
                                    }}
                                    className="flex-1"
                                  >
                                    Batal
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Perubahan Stok</CardTitle>
              <CardDescription>50 perubahan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Perubahan</TableHead>
                      <TableHead>Stok Lama</TableHead>
                      <TableHead>Stok Baru</TableHead>
                      <TableHead>Pengguna</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500">
                          Belum ada riwayat perubahan
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(item.timestamp).toLocaleDateString('id-ID')}
                            </div>
                            <div className="text-xs text-gray-600">
                              {new Date(item.timestamp).toLocaleTimeString('id-ID')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{item.productName}</div>
                            {item.reason && (
                              <div className="text-xs text-gray-600">{item.reason}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                              {item.type === 'sale' ? 'Penjualan' :
                               item.type === 'restock' ? 'Restock' :
                               item.type === 'adjustment' ? 'Penyesuaian' :
                               item.type === 'damage' ? 'Rusak/Hilang' :
                               item.type === 'return' ? 'Retur' : item.type}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={item.change > 0 ? 'text-green-600' : 'text-red-600'}>
                              {item.change > 0 ? '+' : ''}{item.change}
                            </span>
                          </TableCell>
                          <TableCell>{item.oldStock ?? '-'}</TableCell>
                          <TableCell>{item.newStock ?? '-'}</TableCell>
                          <TableCell>{item.userName}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
