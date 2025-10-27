import React, { useState, useEffect } from 'react'
import { getUpcomingOrders } from './api'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { Badge } from './badge'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Bell, Package, Calendar, Clock, X } from 'lucide-react'
import { format, differenceInDays, differenceInHours, isPast, isToday } from 'date-fns'

interface Order {
  id: string
  customerName: string
  deliveryDate: string
  deliveryTime: string
  items: any[]
  totalAmount: number
}

export function OrderNotifications() {
  const [upcomingOrders, setUpcomingOrders] = useState<Order[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUpcomingOrders()
    
    // Refresh every 5 minutes
    const interval = setInterval(loadUpcomingOrders, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const loadUpcomingOrders = async () => {
    try {
      const data = await getUpcomingOrders()
      setUpcomingOrders(data.orders || [])
    } catch (error: any) {
      console.error('Error loading upcoming orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getUrgency = (deliveryDate: string, deliveryTime: string) => {
    const deliveryDateTime = new Date(`${deliveryDate}T${deliveryTime}`)
    const now = new Date()
    
    if (isPast(deliveryDateTime)) {
      return { level: 'overdue', message: 'TERLAMBAT!', color: 'red' }
    }
    
    if (isToday(new Date(deliveryDate))) {
      return { level: 'today', message: 'HARI INI', color: 'orange' }
    }
    
    const daysUntil = differenceInDays(new Date(deliveryDate), now)
    
    if (daysUntil === 1) {
      return { level: 'tomorrow', message: 'BESOK', color: 'yellow' }
    }
    
    return { level: 'upcoming', message: `${daysUntil} hari lagi`, color: 'blue' }
  }

  const dismissNotification = (orderId: string) => {
    setDismissed([...dismissed, orderId])
  }

  const visibleOrders = upcomingOrders.filter(order => !dismissed.includes(order.id))

  if (loading || visibleOrders.length === 0) {
    return null
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-4">
      {visibleOrders.map(order => {
        const urgency = getUrgency(order.deliveryDate, order.deliveryTime)
        const productNames = order.items.map(item => item.productName).join(', ')
        
        return (
          <Alert 
            key={order.id} 
            className={`
              ${urgency.color === 'red' ? 'border-red-500 bg-red-50' : ''}
              ${urgency.color === 'orange' ? 'border-orange-500 bg-orange-50' : ''}
              ${urgency.color === 'yellow' ? 'border-yellow-500 bg-yellow-50' : ''}
              ${urgency.color === 'blue' ? 'border-blue-500 bg-blue-50' : ''}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Bell className={`h-5 w-5 mt-0.5 ${
                  urgency.color === 'red' ? 'text-red-600' :
                  urgency.color === 'orange' ? 'text-orange-600' :
                  urgency.color === 'yellow' ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <div className="flex-1">
                  <AlertTitle className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline" 
                      className={`
                        ${urgency.color === 'red' ? 'bg-red-100 text-red-700 border-red-300' : ''}
                        ${urgency.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-300' : ''}
                        ${urgency.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : ''}
                        ${urgency.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
                      `}
                    >
                      {urgency.message}
                    </Badge>
                    Pengiriman untuk <strong>{order.customerName}</strong>
                  </AlertTitle>
                  <AlertDescription className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4" />
                      <span>{productNames}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(order.deliveryDate), 'PPP')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{order.deliveryTime}</span>
                      </div>
                    </div>
                    <div className="text-sm">
                      Total: {formatCurrency(order.totalAmount)}
                    </div>
                  </AlertDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => dismissNotification(order.id)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        )
      })}
    </div>
  )
}
