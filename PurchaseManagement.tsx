import React, { useState, useEffect } from 'react'
import { getPurchases, createPurchase, deletePurchase } from './api'
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
import { Plus, Trash2, CalendarIcon, TrendingDown, Package, User, DollarSign, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from './utils'

interface PurchaseItem {
  itemName: string
  quantity: number
  unit: string
  purchasePrice: number
  total?: number
}

interface Purchase {
  id: string
  purchaseDate: string
  supplier: string
  fundingSource: string
  fundingOwner: string
  items: PurchaseItem[]
  totalAmount: number
  notes: string
  createdByName: string
  createdAt: string
}

export function PurchaseManagement() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  
  const [formData, setFormData] = useState({
    purchaseDate: new Date(),
    supplier: '',
    fundingSource: 'company',
    fundingOwner: '',
    notes: ''
  })

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([])
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState('pcs')
  const [purchasePrice, setPurchasePrice] = useState(0)

  const [filterStartDate, setFilterStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [filterEndDate, setFilterEndDate] = useState<Date>(new Date())

  useEffect(() => {
    loadData()
  }, [filterStartDate, filterEndDate])

  const loadData = async () => {
    try {
      const startDateStr = format(filterStartDate, 'yyyy-MM-dd')
      const endDateStr = format(filterEndDate, 'yyyy-MM-dd')
      
      const purchasesData = await getPurchases(startDateStr, endDateStr)
      setPurchases(purchasesData.purchases)
    } catch (error: any) {
      console.error('Error loading data:', error)
      toast.error(`Gagal memuat data: ${error.message}`)
    }
  }

  const resetForm = () => {
    setFormData({
      purchaseDate: new Date(),
      supplier: '',
      fundingSource: 'company',
      fundingOwner: '',
      notes: ''
    })
    setPurchaseItems([])
    setItemName('')
    setQuantity(1)
    setUnit('pcs')
    setPurchasePrice(0)
  }

  const addItemToPurchase = () => {
    if (!itemName.trim()) {
      toast.error('Masukkan nama barang terlebih dahulu')
      return
    }

    if (purchasePrice <= 0) {
      toast.error('Masukkan harga beli yang valid')
      return
    }

    if (quantity <= 0) {
      toast.error('Masukkan jumlah yang valid')
      return
    }

    setPurchaseItems([...purchaseItems, {
      itemName: itemName.trim(),
      quantity,
      unit,
      purchasePrice
    }])

    setItemName('')
    setQuantity(1)
    setUnit('pcs')
    setPurchasePrice(0)
    toast.success('Barang ditambahkan')
  }

  const removeItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (purchaseItems.length === 0) {
      toast.error('Tambahkan minimal 1 produk')
      return
    }

    if (formData.fundingSource === 'personal' && !formData.fundingOwner) {
      toast.error('Masukkan nama pemilik dana pribadi')
      return
    }

    setLoading(true)

    try {
      await createPurchase({
        ...formData,
        purchaseDate: format(formData.purchaseDate, 'yyyy-MM-dd'),
        items: purchaseItems
      })
      
      toast.success('Pembelian berhasil dicatat!')
      await loadData()
      setShowDialog(false)
      resetForm()
    } catch (error: any) {
      console.error('Error creating purchase:', error)
      toast.error(`Gagal mencatat pembelian: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (purchaseId: string, supplier: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pembelian dari "${supplier}"?`)) {
      return
    }

    try {
      await deletePurchase(purchaseId)
      toast.success('Pembelian berhasil dihapus!')
      await loadData()
    } catch (error: any) {
      console.error('Error deleting purchase:', error)
      toast.error(`Gagal menghapus pembelian: ${error.message}`)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const getTotalAmount = () => {
    return purchaseItems.reduce((sum, item) => {
      return sum + (item.purchasePrice * item.quantity)
    }, 0)
  }

  const getFundingSourceLabel = (source: string) => {
    switch (source) {
      case 'company':
        return 'Kas Perusahaan'
      case 'personal':
        return 'Uang Pribadi'
      case 'owner':
        return 'Pemilik Usaha'
      case 'loan':
        return 'Pinjaman'
      default:
        return source
    }
  }

  const getFundingSourceBadge = (source: string) => {
    switch (source) {
      case 'company':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Kas Perusahaan</Badge>
      case 'personal':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">Uang Pribadi</Badge>
      case 'owner':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Pemilik Usaha</Badge>
      case 'loan':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">Pinjaman</Badge>
      default:
        return <Badge variant="outline">{source}</Badge>
    }
  }

  const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl">Pembelian Barang</h2>
          <p className="text-gray-600">Catat pembelian dan kelola stok masuk</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pembelian
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Catat Pembelian Baru</DialogTitle>
              <DialogDescription>
                Masukkan detail pembelian barang
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Purchase Information */}
              <div className="space-y-4">
                <h3 className="text-lg">Informasi Pembelian</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Tanggal Pembelian *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left",
                            !formData.purchaseDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.purchaseDate ? format(formData.purchaseDate, 'PPP') : <span>Pilih tanggal</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.purchaseDate}
                          onSelect={(date) => date && setFormData({ ...formData, purchaseDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="supplier">Supplier / Toko *</Label>
                    <div className="relative">
                      <ShoppingBag className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        className="pl-10"
                        placeholder="Nama supplier atau toko"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fundingSource">Sumber Dana *</Label>
                    <Select 
                      value={formData.fundingSource} 
                      onValueChange={(value) => setFormData({ ...formData, fundingSource: value })}
                    >
                      <SelectTrigger id="fundingSource">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Kas Perusahaan</SelectItem>
                        <SelectItem value="personal">Uang Pribadi</SelectItem>
                        <SelectItem value="owner">Pemilik Usaha</SelectItem>
                        <SelectItem value="loan">Pinjaman</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.fundingSource === 'personal' && (
                    <div className="space-y-2">
                      <Label htmlFor="fundingOwner">Nama Pemilik Dana *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="fundingOwner"
                          value={formData.fundingOwner}
                          onChange={(e) => setFormData({ ...formData, fundingOwner: e.target.value })}
                          className="pl-10"
                          placeholder="Nama orang"
                          required={formData.fundingSource === 'personal'}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Products */}
              <div className="space-y-4">
                <h3 className="text-lg">Barang yang Dibeli</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="Nama barang..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addItemToPurchase()
                        }
                      }}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        placeholder="Qty"
                      />
                      <Select value={unit} onValueChange={setUnit}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pcs">Pcs</SelectItem>
                          <SelectItem value="box">Box</SelectItem>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="gram">Gram</SelectItem>
                          <SelectItem value="liter">Liter</SelectItem>
                          <SelectItem value="ml">Ml</SelectItem>
                          <SelectItem value="pack">Pack</SelectItem>
                          <SelectItem value="unit">Unit</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(parseInt(e.target.value) || 0)}
                        placeholder="Harga"
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={addItemToPurchase} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Barang
                  </Button>
                </div>

                {purchaseItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Barang</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Satuan</TableHead>
                          <TableHead>Harga</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseItems.map((item, index) => {
                          const subtotal = item.purchasePrice * item.quantity
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>{item.itemName}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell>{formatCurrency(item.purchasePrice)}</TableCell>
                              <TableCell>{formatCurrency(subtotal)}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        <TableRow>
                          <TableCell colSpan={4} className="font-bold">Total Pembelian</TableCell>
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
                  placeholder="Catatan tambahan untuk pembelian..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Menyimpan...' : 'Simpan Pembelian'}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Pembelian</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(totalPurchases)}</div>
            <p className="text-xs text-gray-600">
              Periode yang dipilih
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Jumlah Transaksi</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{purchases.length}</div>
            <p className="text-xs text-gray-600">Pembelian tercatat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Rata-rata per Transaksi</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">
              {formatCurrency(purchases.length > 0 ? totalPurchases / purchases.length : 0)}
            </div>
            <p className="text-xs text-gray-600">Nilai rata-rata</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left",
                      !filterStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterStartDate ? format(filterStartDate, 'PPP') : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterStartDate}
                    onSelect={(date) => date && setFilterStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left",
                      !filterEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filterEndDate ? format(filterEndDate, 'PPP') : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filterEndDate}
                    onSelect={(date) => date && setFilterEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase List */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pembelian</CardTitle>
          <CardDescription>Total: {purchases.length} pembelian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {purchases.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Tidak ada pembelian pada periode ini
              </div>
            ) : (
              purchases.map(purchase => (
                <Card key={purchase.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-3">
                          <h4>{purchase.supplier}</h4>
                          {getFundingSourceBadge(purchase.fundingSource)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4" />
                          {format(new Date(purchase.purchaseDate), 'PPP')}
                        </div>
                        {purchase.fundingSource === 'personal' && purchase.fundingOwner && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            Dana: {purchase.fundingOwner}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl text-red-600">{formatCurrency(purchase.totalAmount)}</div>
                        <p className="text-xs text-gray-600 mt-1">
                          {purchase.items.reduce((sum, item) => sum + item.quantity, 0)} item
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4 mb-4">
                      <div className="space-y-2">
                        {purchase.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span>{item.itemName} - {item.quantity} {item.unit}</span>
                            <span>{formatCurrency(item.total || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {purchase.notes && (
                      <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded">
                        <strong>Catatan:</strong> {purchase.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-xs text-gray-500">
                        Oleh: {purchase.createdByName} • {format(new Date(purchase.createdAt), 'PPp')}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(purchase.id, purchase.supplier)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
