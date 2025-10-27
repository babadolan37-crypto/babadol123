import React, { useState, useEffect } from 'react'
import { getProducts, getTransactionSummary } from './api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Input } from './input'
import { Button } from './button'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { ShoppingCart, Package, TrendingUp, DollarSign, Search, CalendarIcon, FileText, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from './utils'
import { OrderNotifications } from './OrderNotifications'

interface Product {
  id: string
  name: string
  category: string
  sellingPrice: number
  costPrice: number
  stock: number
  description: string
}

interface Summary {
  date: string
  totalSales: number
  totalProfit: number
  totalCogs: number
  totalTransactions: number
  totalItems: number
}

interface CashierDashboardProps {
  onNavigate?: (page: string) => void
}

export function CashierDashboard({ onNavigate }: CashierDashboardProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd')
      const [productsData, summaryData] = await Promise.all([
        getProducts(),
        getTransactionSummary(dateString)
      ])
      setProducts(productsData.products)
      setSummary(summaryData.summary)
    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      toast.error(`Gagal memuat data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const lowStockProducts = products.filter(p => p.stock < 10)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Memuat data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl">Dashboard Kasir</h2>
          <p className="text-gray-600">Ringkasan penjualan</p>
        </div>
        <div className="flex gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : <span>Pilih tanggal</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hari Ini
          </Button>
        </div>
      </div>

      {/* Order Notifications */}
      <OrderNotifications />

      {/* Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg">Ringkasan Penjualan</h3>
          {onNavigate && (
            <Button variant="outline" size="sm" onClick={() => onNavigate('reports')}>
              <FileText className="h-4 w-4 mr-2" />
              Lihat Laporan Lengkap
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          className={onNavigate ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
          onClick={() => onNavigate && onNavigate('reports')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Penjualan</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(summary?.totalSales || 0)}</div>
            <p className="text-xs text-gray-600">
              {summary?.totalTransactions || 0} transaksi
            </p>
            {onNavigate && (
              <p className="text-xs text-indigo-600 mt-1">Klik untuk lihat laporan →</p>
            )}
          </CardContent>
        </Card>

        <Card 
          className={onNavigate ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
          onClick={() => onNavigate && onNavigate('reports')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Profit Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(summary?.totalProfit || 0)}</div>
            <p className="text-xs text-gray-600">
              HPP: {formatCurrency(summary?.totalCogs || 0)}
            </p>
            {onNavigate && (
              <p className="text-xs text-indigo-600 mt-1">Klik untuk lihat laporan →</p>
            )}
          </CardContent>
        </Card>

        <Card 
          className={onNavigate ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
          onClick={() => onNavigate && onNavigate('sales')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Item Terjual</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{summary?.totalItems || 0}</div>
            <p className="text-xs text-gray-600">Item hari ini</p>
            {onNavigate && (
              <p className="text-xs text-indigo-600 mt-1">Klik untuk transaksi →</p>
            )}
          </CardContent>
        </Card>

        <Card 
          className={onNavigate ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
          onClick={() => onNavigate && onNavigate('stock')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Produk</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{products.length}</div>
            <p className="text-xs text-red-600">
              {lowStockProducts.length} stok rendah
            </p>
            {onNavigate && (
              <p className="text-xs text-indigo-600 mt-1">Klik untuk kelola stok →</p>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Quick Actions */}
      {onNavigate && (
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
            <CardDescription>Navigasi cepat ke fitur utama</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => onNavigate('sales')}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm">Transaksi Penjualan</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => onNavigate('orders')}
              >
                <ClipboardList className="h-5 w-5" />
                <span className="text-sm">Pesanan</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => onNavigate('reports')}
              >
                <FileText className="h-5 w-5" />
                <span className="text-sm">Laporan Keuangan</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col items-center justify-center gap-2"
                onClick={() => onNavigate('products')}
              >
                <Package className="h-5 w-5" />
                <span className="text-sm">Kelola Produk</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Peringatan Stok Rendah</CardTitle>
            <CardDescription className="text-orange-700">
              Produk dengan stok kurang dari 10
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex justify-between items-center">
                  <span className="text-orange-900">{product.name}</span>
                  <span className="text-orange-800">
                    Stok: {product.stock}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Search */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
          <CardDescription>Cari dan lihat informasi produk</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari produk berdasarkan nama atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Tidak ada produk ditemukan
              </div>
            ) : (
              filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4>{product.name}</h4>
                    <p className="text-sm text-gray-600">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <div>{formatCurrency(product.sellingPrice)}</div>
                    <div className={`text-sm ${product.stock < 10 ? 'text-red-600' : 'text-gray-600'}`}>
                      Stok: {product.stock}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
