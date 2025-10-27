import React, { useState, useEffect } from 'react'
import { getSalesReport, getProductReport, getTransactions } from './api'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Calendar } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, TrendingUp, DollarSign, Package, CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from './utils'

interface SalesData {
  period: string
  totalSales: number
  totalProfit: number
  totalCogs: number
  transactionCount: number
  itemCount: number
}

interface ProductData {
  productId: string
  productName: string
  quantitySold: number
  totalRevenue: number
  totalCogs: number
  totalProfit: number
}

export function FinancialReports() {
  const [salesReport, setSalesReport] = useState<SalesData[]>([])
  const [productReport, setProductReport] = useState<ProductData[]>([])
  const [loading, setLoading] = useState(false)
  
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [groupBy, setGroupBy] = useState('day')

  useEffect(() => {
    loadReports()
  }, [startDate, endDate, groupBy])

  const loadReports = async () => {
    setLoading(true)
    try {
      const startDateStr = format(startDate, 'yyyy-MM-dd')
      const endDateStr = format(endDate, 'yyyy-MM-dd')
      
      const [salesData, productData] = await Promise.all([
        getSalesReport(startDateStr, endDateStr, groupBy),
        getProductReport(startDateStr, endDateStr)
      ])
      setSalesReport(salesData.report)
      setProductReport(productData.report)
    } catch (error: any) {
      console.error('Error loading reports:', error)
      toast.error(`Gagal memuat laporan: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setStartDate(date)
    }
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      setEndDate(date)
    }
  }

  const setLast7Days = () => {
    setEndDate(new Date())
    setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  }

  const setLast30Days = () => {
    setEndDate(new Date())
    setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  }

  const setThisMonth = () => {
    const now = new Date()
    setEndDate(now)
    setStartDate(new Date(now.getFullYear(), now.getMonth(), 1))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }

    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(',')).join('\n')
    const csv = `${headers}\n${rows}`

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Laporan berhasil diekspor')
  }

  const totals = salesReport.reduce(
    (acc, item) => ({
      sales: acc.sales + item.totalSales,
      profit: acc.profit + item.totalProfit,
      cogs: acc.cogs + item.totalCogs,
      transactions: acc.transactions + item.transactionCount,
      items: acc.items + item.itemCount
    }),
    { sales: 0, profit: 0, cogs: 0, transactions: 0, items: 0 }
  )

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316', '#84cc16']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl">Laporan Keuangan</h2>
          <p className="text-gray-600">Analisis penjualan dan profitabilitas</p>
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Quick Date Filters */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={setLast7Days}>
                7 Hari Terakhir
              </Button>
              <Button variant="outline" size="sm" onClick={setLast30Days}>
                30 Hari Terakhir
              </Button>
              <Button variant="outline" size="sm" onClick={setThisMonth}>
                Bulan Ini
              </Button>
            </div>

            {/* Date Range Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={handleStartDateSelect}
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
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : <span>Pilih tanggal</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={handleEndDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupBy">Kelompokkan Berdasarkan</Label>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger id="groupBy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Harian</SelectItem>
                    <SelectItem value="week">Mingguan</SelectItem>
                    <SelectItem value="month">Bulanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Penjualan</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(totals.sales)}</div>
            <p className="text-xs text-gray-600">
              {totals.transactions} transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">{formatCurrency(totals.profit)}</div>
            <p className="text-xs text-gray-600">
              Margin: {totals.sales > 0 ? ((totals.profit / totals.sales) * 100).toFixed(1) : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total HPP</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{formatCurrency(totals.cogs)}</div>
            <p className="text-xs text-gray-600">
              Harga Pokok Penjualan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Item Terjual</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{totals.items}</div>
            <p className="text-xs text-gray-600">
              Total unit
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Laporan Penjualan</TabsTrigger>
          <TabsTrigger value="products">Laporan Produk</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tren Penjualan & Profit</CardTitle>
                  <CardDescription>Performa penjualan berdasarkan periode</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(salesReport, 'laporan_penjualan')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Ekspor CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesReport}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="totalSales" stroke="#6366f1" name="Penjualan" strokeWidth={2} />
                  <Line type="monotone" dataKey="totalProfit" stroke="#10b981" name="Profit" strokeWidth={2} />
                  <Line type="monotone" dataKey="totalCogs" stroke="#f59e0b" name="HPP" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sales Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detail Penjualan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Periode</TableHead>
                      <TableHead>Transaksi</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Penjualan</TableHead>
                      <TableHead>HPP</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500">
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      salesReport.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.period}</TableCell>
                          <TableCell>{item.transactionCount}</TableCell>
                          <TableCell>{item.itemCount}</TableCell>
                          <TableCell>{formatCurrency(item.totalSales)}</TableCell>
                          <TableCell>{formatCurrency(item.totalCogs)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(item.totalProfit)}</TableCell>
                          <TableCell>
                            {item.totalSales > 0 ? ((item.totalProfit / item.totalSales) * 100).toFixed(1) : 0}%
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          {/* Product Performance Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Produk (Revenue)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productReport.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="totalRevenue" fill="#6366f1" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribusi Profit Produk</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productReport.slice(0, 8)}
                      dataKey="totalProfit"
                      nameKey="productName"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(entry) => entry.productName}
                    >
                      {productReport.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Product Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Detail Produk</CardTitle>
                  <CardDescription>Performa individual produk</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(productReport, 'laporan_produk')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Ekspor CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead>Qty Terjual</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>HPP</TableHead>
                      <TableHead>Profit</TableHead>
                      <TableHead>Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500">
                          Tidak ada data
                        </TableCell>
                      </TableRow>
                    ) : (
                      productReport.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>{item.quantitySold}</TableCell>
                          <TableCell>{formatCurrency(item.totalRevenue)}</TableCell>
                          <TableCell>{formatCurrency(item.totalCogs)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(item.totalProfit)}</TableCell>
                          <TableCell>
                            {item.totalRevenue > 0 ? ((item.totalProfit / item.totalRevenue) * 100).toFixed(1) : 0}%
                          </TableCell>
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
