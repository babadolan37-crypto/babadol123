import React, { useState, useEffect } from 'react'
import { getProducts, createTransaction } from './api'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './dialog'
import { Separator } from './separator'
import { Search, Plus, Trash2, ShoppingBag, Printer } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  category: string
  sellingPrice: number
  costPrice: number
  stock: number
}

interface CartItem {
  productId: string
  productName: string
  quantity: number
  price: number
  stock: number
}

export function SalesTransaction() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<any>(null)

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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id)
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error(`Stok tidak mencukupi! Stok tersedia: ${product.stock}`)
        return
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      if (product.stock < 1) {
        toast.error('Stok habis!')
        return
      }
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.sellingPrice,
        stock: product.stock
      }])
    }
    toast.success(`${product.name} ditambahkan ke keranjang`)
  }

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cart.find(i => i.productId === productId)
    if (!item) return

    if (quantity > item.stock) {
      toast.error(`Stok tidak mencukupi! Stok tersedia: ${item.stock}`)
      return
    }

    if (quantity < 1) {
      removeFromCart(productId)
      return
    }

    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity }
        : item
    ))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const total = subtotal - discount

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong!')
      return
    }

    setLoading(true)
    try {
      const transaction = {
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        discount,
        paymentMethod
      }

      const result = await createTransaction(transaction)
      setLastTransaction(result.transaction)
      setShowReceipt(true)
      
      // Clear cart
      setCart([])
      setDiscount(0)
      setPaymentMethod('cash')
      
      // Reload products to update stock
      await loadProducts()
      
      toast.success('Transaksi berhasil!')
    } catch (error: any) {
      console.error('Transaction error:', error)
      toast.error(`Transaksi gagal: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const printReceipt = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl">Transaksi Penjualan</h2>
        <p className="text-gray-600">Tambahkan produk ke keranjang dan proses pembayaran</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pilih Produk</CardTitle>
              <CardDescription>Cari dan tambahkan produk ke keranjang</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari produk..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4>{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.category}</p>
                        <div className="mt-2">
                          {formatCurrency(product.sellingPrice)}
                        </div>
                      </div>
                      <Plus className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className={`text-sm mt-2 ${product.stock < 10 ? 'text-red-600' : 'text-gray-600'}`}>
                      Stok: {product.stock}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart and Checkout */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Keranjang</CardTitle>
              <CardDescription>{cart.length} item</CardDescription>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingBag className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Keranjang kosong</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="text-sm">{item.productName}</div>
                        <div className="text-xs text-gray-600">
                          {formatCurrency(item.price)}
                        </div>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discount">Diskon (Rp)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max={subtotal}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment">Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tunai</SelectItem>
                    <SelectItem value="transfer">Transfer Bank</SelectItem>
                    <SelectItem value="credit_card">Kartu Kredit</SelectItem>
                    <SelectItem value="debit_card">Kartu Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Diskon</span>
                    <span className="text-red-600">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={loading || cart.length === 0}
              >
                {loading ? 'Memproses...' : 'Proses Pembayaran'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Struk Pembayaran</DialogTitle>
            <DialogDescription>Transaksi berhasil diproses</DialogDescription>
          </DialogHeader>
          
          {lastTransaction && (
            <div className="space-y-4 print:text-black">
              <div className="text-center border-b pb-2">
                <h3>SISTEM POS</h3>
                <p className="text-sm text-gray-600">Struk Pembayaran</p>
              </div>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>No. Transaksi:</span>
                  <span>{lastTransaction.id.split(':')[1]}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date(lastTransaction.timestamp).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{lastTransaction.cashierName}</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                {lastTransaction.items.map((item: any, index: number) => (
                  <div key={index} className="text-sm">
                    <div className="flex justify-between">
                      <span>{item.productName}</span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {item.quantity} x {formatCurrency(item.sellingPrice)}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(lastTransaction.subtotal)}</span>
                </div>
                {lastTransaction.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Diskon</span>
                    <span>-{formatCurrency(lastTransaction.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(lastTransaction.total)}</span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600 border-t pt-2">
                <p>Metode: {lastTransaction.paymentMethod === 'cash' ? 'Tunai' : 
                           lastTransaction.paymentMethod === 'transfer' ? 'Transfer Bank' :
                           lastTransaction.paymentMethod === 'credit_card' ? 'Kartu Kredit' : 'Kartu Debit'}</p>
                <p className="mt-2">Terima kasih atas pembelian Anda!</p>
              </div>

              <Button onClick={printReceipt} className="w-full">
                <Printer className="h-4 w-4 mr-2" />
                Cetak Struk
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
