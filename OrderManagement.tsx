import React, { useState, useEffect } from 'react'
import { getOrders, createOrder, updateOrder, deleteOrder, getProducts } from './api'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Textarea } from './textarea'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Badge } from './badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Plus, Edit, Trash2, Package, CalendarIcon, Clock, User, Phone, MapPin, CheckCircle, XCircle, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from './utils'

interface Product {
  id: string
  name: string
  category: string
  sellingPrice: number
  stock: number
}

interface OrderItem {
  productId: string
  productName?: string
  quantity: number
  sellingPrice?: number
  total?: number
}

interface Order {
  id: string
  customerName: string
  customerPhone: string
  customerAddress: string
  items: OrderItem[]
  totalAmount: number
  deliveryDate: string
  deliveryTime: string
  status: 'pending' | 'shipped' | 'delivered'
  stockReduced: boolean
  notes: string
  createdAt: string
  createdByName?: string
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    deliveryDate: new Date(),
    deliveryTime: '10:00',
    notes: ''
  })

  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [ordersData, productsData] = await Promise.all([
        getOrders(),
        getProducts()
      ])
      setOrders(ordersData.orders)
      setProducts(productsData.products)
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error(`Gagal memuat data: ${error.message}`)
    }
  }

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      deliveryDate: new Date(),
      deliveryTime: '10:00',
      notes: ''
    })
    setOrderItems([])
    setSelectedProduct('')
    setQuantity(1)
  }

  const addItemToOrder = () => {
    if (!selectedProduct) {
      toast.error('Pilih produk terlebih dahulu')
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    if (!product) return

    if (quantity > product.stock) {
      toast.error(`Stok tidak mencukupi. Tersedia: ${product.stock}`)
      return
    }

    const existingItemIndex = orderItems.findIndex(item => item.productId === selectedProduct)
    
    if (existingItemIndex >= 0) {
      const newItems = [...orderItems]
      newItems[existingItemIndex].quantity += quantity
      setOrderItems(newItems)
    } else {
      setOrderItems([...orderItems, {
        productId: selectedProduct,
        quantity
      }])
    }

    setSelectedProduct('')
    setQuantity(1)
    toast.success('Produk ditambahkan')
  }

  const removeItem = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.productId !== productId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (orderItems.length === 0) {
      toast.error('Tambahkan minimal 1 produk')
      return
    }

    setLoading(true)

    try {
      await createOrder({
        ...formData,
        deliveryDate: format(formData.deliveryDate, 'yyyy-MM-dd'),
        items: orderItems
      })
      
      toast.success('Pesanan berhasil dibuat!')
      await loadData()
      setShowDialog(false)
      resetForm()
    } catch (error: any) {
      console.error('Error creating order:', error)
      toast.error(`Gagal membuat pesanan: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrder(orderId, { status: newStatus })
      toast.success('Status pesanan berhasil diperbarui!')
      await loadData()
    } catch (error: any) {
      console.error('Error updating order:', error)
      toast.error(`Gagal memperbarui status: ${error.message}`)
    }
  }

  const handleDelete = async (orderId: string, customerName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pesanan dari "${customerName}"?`)) {
      return
    }

    try {
      await deleteOrder(orderId)
      toast.success('Pesanan berhasil dihapus!')
      await loadData()
    } catch (error: any) {
      console.error('Error deleting order:', error)
      toast.error(`Gagal menghapus pesanan: ${error.message}`)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Menunggu Pengiriman</Badge>
      case 'shipped':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Dikirim</Badge>
      case 'delivered':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Diterima</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTotalAmount = () => {
    return orderItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)
      return sum + (product ? product.sellingPrice * item.quantity : 0)
    }, 0)
  }

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl">Manajemen Pesanan</h2>
          <p className="text-gray-600">Kelola jadwal pesanan dan pengiriman</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Buat Pesanan Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Pesanan Baru</DialogTitle>
              <DialogDescription>
                Masukkan detail pesanan dan jadwal pengiriman
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg">Informasi Pembeli</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="customerName">Nama Pembeli *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Nomor Telepon *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryTime">Waktu Kirim *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="deliveryTime"
                        type="time"
                        value={formData.deliveryTime}
                        onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="customerAddress">Alamat *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Textarea
                        id="customerAddress"
                        value={formData.customerAddress}
                        onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                        className="pl-10"
                        rows={2}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>Tanggal Kirim *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left",
                            !formData.deliveryDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.deliveryDate ? format(formData.deliveryDate, 'PPP') : <span>Pilih tanggal</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.deliveryDate}
                          onSelect={(date) => date && setFormData({ ...formData, deliveryDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="space-y-4">
                <h3 className="text-lg">Produk Pesanan</h3>
                
                <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.sellingPrice)} (Stok: {product.stock})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-24"
                    placeholder="Qty"
                  />
                  <Button type="button" onClick={addItemToOrder}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {orderItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Harga</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderItems.map(item => {
                          const product = products.find(p => p.id === item.productId)
                          if (!product) return null
                          const subtotal = product.sellingPrice * item.quantity
                          
                          return (
                            <TableRow key={item.productId}>
                              <TableCell>{product.name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                              <TableCell>{formatCurrency(subtotal)}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item.productId)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        <TableRow>
                          <TableCell colSpan={3} className="font-bold">Total</TableCell>
                          <TableCell className="font-bold">{formatCurrency(getTotalAmount())}</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Catatan tambahan untuk pesanan..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Menyimpan...' : 'Buat Pesanan'}
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Semua ({orders.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Menunggu ({orders.filter(o => o.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="shipped">
            Dikirim ({orders.filter(o => o.status === 'shipped').length})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Diterima ({orders.filter(o => o.status === 'delivered').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pesanan</CardTitle>
              <CardDescription>Total: {filteredOrders.length} pesanan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Tidak ada pesanan
                  </div>
                ) : (
                  filteredOrders.map(order => (
                    <Card key={order.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-600" />
                              <h4>{order.customerName}</h4>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              {order.customerPhone}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              {order.customerAddress}
                            </div>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(order.status)}
                            <div className="mt-2 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {format(new Date(order.deliveryDate), 'PPP')}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {order.deliveryTime}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t pt-4 mb-4">
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.productName} x {item.quantity}</span>
                                <span>{formatCurrency(item.total || 0)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between pt-2 border-t">
                              <span>Total</span>
                              <span>{formatCurrency(order.totalAmount)}</span>
                            </div>
                          </div>
                        </div>

                        {order.notes && (
                          <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded">
                            <strong>Catatan:</strong> {order.notes}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'shipped')}
                              className="flex-1"
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Tandai Dikirim
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'delivered')}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Tandai Diterima
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(order.id, order.customerName)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                          Dibuat oleh: {order.createdByName} • {format(new Date(order.createdAt), 'PPp')}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
