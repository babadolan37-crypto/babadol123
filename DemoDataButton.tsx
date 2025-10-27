import React, { useState } from 'react'
import { addProduct } from './api'
import { Button } from './button'
import { Database } from 'lucide-react'
import { toast } from 'sonner'

export function DemoDataButton() {
  const [loading, setLoading] = useState(false)

  const demoProducts = [
    {
      name: 'Kopi Susu',
      category: 'Minuman',
      sellingPrice: '25000',
      costPrice: '12000',
      stock: '50',
      description: 'Kopi susu segar dengan gula aren'
    },
    {
      name: 'Es Teh Manis',
      category: 'Minuman',
      sellingPrice: '8000',
      costPrice: '3000',
      stock: '100',
      description: 'Teh manis segar'
    },
    {
      name: 'Nasi Goreng',
      category: 'Makanan',
      sellingPrice: '20000',
      costPrice: '10000',
      stock: '30',
      description: 'Nasi goreng spesial dengan telur'
    },
    {
      name: 'Mie Goreng',
      category: 'Makanan',
      sellingPrice: '18000',
      costPrice: '9000',
      stock: '35',
      description: 'Mie goreng pedas'
    },
    {
      name: 'Roti Bakar',
      category: 'Makanan',
      sellingPrice: '15000',
      costPrice: '7000',
      stock: '25',
      description: 'Roti bakar dengan selai dan keju'
    },
    {
      name: 'Jus Jeruk',
      category: 'Minuman',
      sellingPrice: '12000',
      costPrice: '6000',
      stock: '40',
      description: 'Jus jeruk segar tanpa gula'
    },
    {
      name: 'Pisang Goreng',
      category: 'Snack',
      sellingPrice: '10000',
      costPrice: '5000',
      stock: '45',
      description: 'Pisang goreng kriuk'
    },
    {
      name: 'Keripik Singkong',
      category: 'Snack',
      sellingPrice: '15000',
      costPrice: '7500',
      stock: '60',
      description: 'Keripik singkong renyah'
    },
    {
      name: 'Air Mineral',
      category: 'Minuman',
      sellingPrice: '5000',
      costPrice: '2500',
      stock: '120',
      description: 'Air mineral 600ml'
    },
    {
      name: 'Cappuccino',
      category: 'Minuman',
      sellingPrice: '30000',
      costPrice: '15000',
      stock: '40',
      description: 'Cappuccino premium'
    },
    {
      name: 'Sandwich',
      category: 'Makanan',
      sellingPrice: '22000',
      costPrice: '11000',
      stock: '20',
      description: 'Sandwich telur dan sayur'
    },
    {
      name: 'Donat',
      category: 'Snack',
      sellingPrice: '8000',
      costPrice: '4000',
      stock: '50',
      description: 'Donat manis dengan topping'
    }
  ]

  const addDemoData = async () => {
    setLoading(true)
    try {
      let successCount = 0
      for (const product of demoProducts) {
        try {
          await addProduct(product)
          successCount++
        } catch (error) {
          console.error('Error adding product:', product.name, error)
        }
      }
      toast.success(`Berhasil menambahkan ${successCount} produk demo!`)
      // Reload page to show new products
      setTimeout(() => window.location.reload(), 1500)
    } catch (error: any) {
      console.error('Error adding demo data:', error)
      toast.error(`Gagal menambahkan data demo: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={addDemoData}
      disabled={loading}
    >
      <Database className="h-4 w-4 mr-2" />
      {loading ? 'Menambahkan...' : 'Tambah Data Demo'}
    </Button>
  )
}
