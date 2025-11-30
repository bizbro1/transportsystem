import { useState, useRef } from 'react'
import type { Order } from '../types/order'

interface ScheduleCalendarProps {
  orders: Order[]
  onOrderScheduled?: (orderId: string, date: Date, timeSlot: string) => void
  onOrderDelete?: (orderId: string) => void
}

interface ScheduledOrder {
  orderId: string
  date: string
  timeSlot: string
}

export default function ScheduleCalendar({ orders, onOrderScheduled, onOrderDelete }: ScheduleCalendarProps) {
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [scheduledOrders, setScheduledOrders] = useState<ScheduledOrder[]>([])
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null)
  const [draggedScheduledOrder, setDraggedScheduledOrder] = useState<ScheduledOrder | null>(null)
  const [isDragOverSidebar, setIsDragOverSidebar] = useState(false)
  const dragOverTimeSlot = useRef<string | null>(null)

  // Generate time slots (6 AM to 10 PM, every 30 minutes)
  const timeSlots: string[] = []
  for (let hour = 6; hour < 22; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
  }

  // Get week days
  const getWeekDays = (): Date[] => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day
    startOfWeek.setDate(diff)

    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }
    return days
  }

  const weekDays = getWeekDays()
  const displayDays = viewMode === 'week' ? weekDays : [currentDate]

  // Get orders scheduled for a specific date and time
  const getScheduledOrder = (date: Date, timeSlot: string): Order | undefined => {
    const dateStr = date.toISOString().split('T')[0]
    const scheduled = scheduledOrders.find(
      (s) => s.date === dateStr && s.timeSlot === timeSlot
    )
    if (scheduled) {
      return orders.find((o) => o.id === scheduled.orderId)
    }
    return undefined
  }

  // Get unscheduled orders (orders not yet on calendar)
  const unscheduledOrders = orders.filter(
    (order) => !scheduledOrders.some((s) => s.orderId === order.id)
  )

  // Handle drag start from sidebar
  const handleDragStart = (order: Order) => {
    setDraggedOrder(order)
    setDraggedScheduledOrder(null)
  }

  // Handle drag start from scheduled order on calendar
  const handleScheduledOrderDragStart = (scheduledOrder: ScheduledOrder, order: Order) => {
    setDraggedScheduledOrder(scheduledOrder)
    setDraggedOrder(order)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, date: Date, timeSlot: string) => {
    e.preventDefault()
    const dateStr = date.toISOString().split('T')[0]
    dragOverTimeSlot.current = `${dateStr}-${timeSlot}`
  }

  // Handle drop on calendar time slot
  const handleDrop = (e: React.DragEvent, date: Date, timeSlot: string) => {
    e.preventDefault()
    if (draggedOrder) {
      const dateStr = date.toISOString().split('T')[0]
      
      // Remove any existing scheduling for this order
      const updated = scheduledOrders.filter((s) => s.orderId !== draggedOrder.id)
      
      // Check if dropping on the same time slot (no change needed)
      if (draggedScheduledOrder && 
          draggedScheduledOrder.date === dateStr && 
          draggedScheduledOrder.timeSlot === timeSlot) {
        setDraggedOrder(null)
        setDraggedScheduledOrder(null)
        dragOverTimeSlot.current = null
        return
      }
      
      // Add new scheduling
      updated.push({
        orderId: draggedOrder.id,
        date: dateStr,
        timeSlot,
      })
      
      setScheduledOrders(updated)
      setDraggedOrder(null)
      setDraggedScheduledOrder(null)
      dragOverTimeSlot.current = null
      
      if (onOrderScheduled) {
        onOrderScheduled(draggedOrder.id, date, timeSlot)
      }
    }
  }

  // Handle drop on sidebar (unschedule order)
  const handleSidebarDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedOrder && draggedScheduledOrder) {
      // Remove the order from scheduled orders
      const updated = scheduledOrders.filter((s) => s.orderId !== draggedOrder.id)
      setScheduledOrders(updated)
      setDraggedOrder(null)
      setDraggedScheduledOrder(null)
      setIsDragOverSidebar(false)
    }
  }

  // Handle drag over sidebar
  const handleSidebarDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    // Only show drop zone if dragging a scheduled order
    if (draggedScheduledOrder) {
      setIsDragOverSidebar(true)
    }
  }

  // Handle drag leave sidebar
  const handleSidebarDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOverSidebar(false)
  }

  // Navigate dates
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Orders Sidebar */}
      <div
        onDragOver={handleSidebarDragOver}
        onDragLeave={handleSidebarDragLeave}
        onDrop={handleSidebarDrop}
        className={`w-80 bg-white rounded-lg shadow-sm border-2 p-4 overflow-y-auto transition-colors ${
          isDragOverSidebar
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200'
        }`}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {isDragOverSidebar ? 'Drop here to unschedule' : 'Unscheduled Orders'}
        </h3>
        <div className="space-y-2">
          {unscheduledOrders.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              All orders are scheduled
            </p>
          ) : (
            unscheduledOrders.map((order) => (
              <div
                key={order.id}
                draggable
                onDragStart={() => handleDragStart(order)}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-move hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900">{order.id}</div>
                    <div className="text-xs font-medium text-gray-700 mt-1">
                      {order.customer}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {order.cargoDescription}
                    </div>
                    <div className="text-xs font-semibold text-green-700 mt-1">
                      {order.price.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {order.equipmentType}
                    </div>
                  </div>
                  {onOrderDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm(`Delete order ${order.id}?`)) {
                          onOrderDelete(order.id)
                        }
                      }}
                      className="text-red-600 hover:text-red-800 transition-colors flex-shrink-0"
                      title="Delete order"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {viewMode === 'week'
                ? `${formatDate(weekDays[0])} - ${formatDate(weekDays[6])}`
                : formatDate(currentDate)}
            </h3>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'day'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto">
          <div className="flex">
            {/* Time Column */}
            <div className="w-20 border-r border-gray-200">
              <div className="h-12 border-b border-gray-200"></div>
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-16 border-b border-gray-100 text-xs text-gray-500 px-2 py-1"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <div className="flex-1 flex">
              {displayDays.map((date, dayIndex) => {
                const isToday = date.toDateString() === new Date().toDateString()
                return (
                  <div key={dayIndex} className="flex-1 border-r border-gray-200 last:border-r-0">
                    {/* Day Header */}
                    <div
                      className={`h-12 border-b border-gray-200 px-2 py-2 ${
                        isToday ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="text-xs font-medium text-gray-500">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          isToday ? 'text-blue-600' : 'text-gray-900'
                        }`}
                      >
                        {date.getDate()}
                      </div>
                    </div>

                    {/* Time Slots */}
                    {timeSlots.map((timeSlot) => {
                      const scheduledOrder = getScheduledOrder(date, timeSlot)
                      const dateStr = date.toISOString().split('T')[0]
                      const isDragOver =
                        dragOverTimeSlot.current === `${dateStr}-${timeSlot}`
                      const hasOrder = scheduledOrder !== undefined
                      const isDraggingSameOrder = draggedScheduledOrder && 
                        draggedScheduledOrder.date === dateStr && 
                        draggedScheduledOrder.timeSlot === timeSlot

                      return (
                        <div
                          key={timeSlot}
                          onDragOver={(e) => {
                            // Allow drop if slot is empty or if dragging the same order
                            if (!hasOrder || isDraggingSameOrder) {
                              handleDragOver(e, date, timeSlot)
                            }
                          }}
                          onDrop={(e) => {
                            // Only allow drop if slot is empty or if moving the same order
                            if (!hasOrder || isDraggingSameOrder) {
                              handleDrop(e, date, timeSlot)
                            }
                          }}
                          className={`h-16 border-b border-gray-100 px-2 py-1 ${
                            isDragOver && (!hasOrder || isDraggingSameOrder)
                              ? 'bg-blue-100'
                              : hasOrder && !isDraggingSameOrder
                              ? 'bg-red-50'
                              : 'hover:bg-gray-50'
                          } transition-colors`}
                        >
                          {scheduledOrder && (
                            <div
                              draggable
                              onDragStart={(e) => {
                                const scheduled = scheduledOrders.find(
                                  (s) => s.date === dateStr && s.timeSlot === timeSlot
                                )
                                if (scheduled) {
                                  handleScheduledOrderDragStart(scheduled, scheduledOrder)
                                  // Set drag image opacity
                                  if (e.dataTransfer) {
                                    e.dataTransfer.effectAllowed = 'move'
                                  }
                                }
                                e.stopPropagation()
                              }}
                              onDragEnd={() => {
                                setDraggedOrder(null)
                                setDraggedScheduledOrder(null)
                              }}
                              className="bg-blue-500 text-white text-xs p-2 rounded h-full flex flex-col justify-center cursor-move hover:bg-blue-600 active:opacity-50 transition-all"
                            >
                              <div className="font-medium">{scheduledOrder.id}</div>
                              <div className="text-blue-100 text-[10px] font-medium">
                                {scheduledOrder.customer}
                              </div>
                              <div className="text-blue-100 text-[10px] truncate">
                                {scheduledOrder.cargoDescription}
                              </div>
                              <div className="text-blue-200 text-[10px] font-semibold">
                                {scheduledOrder.price.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

