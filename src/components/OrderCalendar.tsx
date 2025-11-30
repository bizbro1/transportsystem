import { useState } from 'react'
import type { Order } from '../types/order'

interface OrderCalendarProps {
  orders: Order[]
}

export default function OrderCalendar({ orders }: OrderCalendarProps) {
  // Get current month and year
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Get orders for a specific date
  const getOrdersForDate = (date: Date): Order[] => {
    const dateStr = date.toISOString().split('T')[0]
    return orders.filter((order) => {
      // Handle different date formats
      let pickupDate: string
      try {
        // Try parsing as ISO string first
        const parsed = new Date(order.pickupTime)
        if (isNaN(parsed.getTime())) {
          // If that fails, try parsing as 'YYYY-MM-DD HH:mm' format
          pickupDate = order.pickupTime.split(' ')[0]
        } else {
          pickupDate = parsed.toISOString().split('T')[0]
        }
      } catch {
        // Fallback to splitting the string
        pickupDate = order.pickupTime.split(' ')[0]
      }
      return pickupDate === dateStr
    })
  }

  // Navigate months
  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Create calendar days
  const calendarDays = []
  
  // Empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h3 className="text-xl font-semibold text-gray-900">
          {monthNames[currentMonth]} {currentYear}
        </h3>
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-24" />
          }

          const date = new Date(currentYear, currentMonth, day)
          const dayOrders = getOrdersForDate(date)
          const isToday =
            date.toDateString() === new Date().toDateString()

          return (
            <div
              key={day}
              className={`min-h-24 border border-gray-200 rounded-md p-2 ${
                isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
              }`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-blue-600' : 'text-gray-900'
                }`}
              >
                {day}
              </div>
              <div className="space-y-1">
                {dayOrders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded truncate"
                    title={`${order.id} - ${order.pickupAddress}`}
                  >
                    {order.id}
                  </div>
                ))}
                {dayOrders.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayOrders.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

