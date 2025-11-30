import { useState, useRef, useEffect } from 'react'
import type { Order } from '../types/order'
import type { Employee } from '../types/employee'
import { saveToStorage, loadFromStorage, StorageKeys, exportAsJSON, importFromJSON } from '../utils/storage'

export default function OrderManagement() {
  // Load orders from localStorage on mount
  const [orders, setOrders] = useState<Order[]>(() => {
    return loadFromStorage<Order[]>(StorageKeys.ORDERS, [])
  })

  // Save orders to localStorage whenever they change
  useEffect(() => {
    saveToStorage(StorageKeys.ORDERS, orders)
  }, [orders])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [numberOfTestOrders, setNumberOfTestOrders] = useState('10')
  const [columnWidths, setColumnWidths] = useState({
    orderId: 120,
    customer: 150,
    cargo: 200,
    price: 120,
    pickupTime: 180,
    pickupAddress: 200,
    deliverBeforeTime: 180,
    deliverBeforeAddress: 200,
    equipmentType: 150,
    driver: 150,
    employee: 150,
  })
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [isAssignMode, setIsAssignMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unassigned' | 'assigned' | 'finished'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [dateRangeStart, setDateRangeStart] = useState('')
  const [dateRangeEnd, setDateRangeEnd] = useState('')
  const [dateRangeType, setDateRangeType] = useState<'pickup' | 'delivery'>('pickup')
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resizeStartX = useRef<number>(0)
  const resizeStartWidth = useRef<number>(0)

  // Get employees from localStorage (shared with Employees page)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    return loadFromStorage<Employee[]>(StorageKeys.EMPLOYEES, [])
  })
  
  useEffect(() => {
    const loadEmployees = () => {
      const loaded = loadFromStorage<Employee[]>(StorageKeys.EMPLOYEES, [])
      setEmployees(loaded)
    }
    // Listen for storage changes (when employees are added in Employees page)
    window.addEventListener('storage', loadEmployees)
    // Also check periodically (for same-tab updates)
    const interval = setInterval(loadEmployees, 1000)
    return () => {
      window.removeEventListener('storage', loadEmployees)
      clearInterval(interval)
    }
  }, [])

  // Filter employees by Driver role to use as drivers
  const drivers = employees.filter((employee) => employee.role === 'Driver')

  // Get active orders count for a driver
  const getDriverActiveOrders = (driverId: string): number => {
    return orders.filter((order) => order.driverId === driverId).length
  }

  // Assign selected orders to a driver
  const handleAssignToDriver = (driverId: string) => {
    if (isAssignMode && selectedOrders.size > 0) {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          selectedOrders.has(order.id) ? { ...order, driverId } : order
        )
      )
      setSelectedOrders(new Set())
      setIsAssignMode(false)
    }
  }

  // Handle driver click - assign if in assign mode, otherwise filter
  const handleDriverClick = (driverId: string) => {
    if (isAssignMode) {
      handleAssignToDriver(driverId)
    } else {
      setSelectedDriver(selectedDriver === driverId ? null : driverId)
    }
  }

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => {
      // Filter by tab
      let matchesTab = false
      switch (activeTab) {
        case 'all':
          matchesTab = true
          break
        case 'unassigned':
          matchesTab = !order.driverId
          break
        case 'assigned':
          matchesTab = !!order.driverId && order.status !== 'finished'
          break
        case 'finished':
          matchesTab = order.status === 'finished'
          break
      }
      if (!matchesTab) return false

      // Filter by selected driver
      if (selectedDriver && order.driverId !== selectedDriver) return false

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const assignedDriver = drivers.find((d) => d.id === order.driverId)
        const matchesSearch =
          order.id.toLowerCase().includes(query) ||
          order.customer.toLowerCase().includes(query) ||
          order.pickupAddress.toLowerCase().includes(query) ||
          order.deliverBeforeAddress.toLowerCase().includes(query) ||
          (assignedDriver && assignedDriver.name.toLowerCase().includes(query))
        if (!matchesSearch) return false
      }

      // Filter by date range
      if (dateRangeStart || dateRangeEnd) {
        const dateField = dateRangeType === 'pickup' ? order.pickupTime : order.deliverBeforeTime
        const orderDate = new Date(dateField)
        if (dateRangeStart) {
          const startDate = new Date(dateRangeStart)
          if (orderDate < startDate) return false
        }
        if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd)
          endDate.setHours(23, 59, 59, 999) // Include entire end date
          if (orderDate > endDate) return false
        }
      }

      return true
    })
    .sort((a, b) => {
      if (!sortField) return 0

      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'customer':
          aValue = a.customer.toLowerCase()
          bValue = b.customer.toLowerCase()
          break
        case 'price':
          aValue = a.price
          bValue = b.price
          break
        case 'pickupTime':
          aValue = new Date(a.pickupTime).getTime()
          bValue = new Date(b.pickupTime).getTime()
          break
        case 'deliverBeforeTime':
          aValue = new Date(a.deliverBeforeTime).getTime()
          bValue = new Date(b.deliverBeforeTime).getTime()
          break
        case 'status':
          aValue = a.status || 'active'
          bValue = b.status || 'active'
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })


  // Handle column sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Cargo', 'Price', 'Pickup Time', 'Pickup Address', 'Deliver Before Time', 'Deliver Before Address', 'Equipment Type', 'Driver', 'Employee', 'Status']
    const rows = filteredOrders.map((order) => {
      const driver = drivers.find((d) => d.id === order.driverId)
      const employee = employees.find((e) => e.id === order.employeeId)
      return [
        order.id,
        order.customer,
        order.cargoDescription,
        order.price.toString(),
        order.pickupTime,
        order.pickupAddress,
        order.deliverBeforeTime,
        order.deliverBeforeAddress,
        order.equipmentType,
        driver?.name || '',
        employee?.name || '',
        order.status || 'active',
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Handle order details view
  const handleOrderClick = (order: Order) => {
    setSelectedOrderDetails(order)
  }

  const handleImportOrders = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const importedData = await importFromJSON<Order[]>(file)
      if (Array.isArray(importedData)) {
        if (window.confirm(`Import ${importedData.length} order(s)? This will replace your current data.`)) {
          setOrders(importedData)
        }
      } else {
        alert('Invalid file format. Expected an array of orders.')
      }
    } catch (error) {
      alert('Failed to import file: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExportOrdersJSON = () => {
    exportAsJSON(orders, `orders_${new Date().toISOString().split('T')[0]}.json`)
  }

  // Unassign orders from driver
  const handleUnassignOrders = () => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        selectedOrders.has(order.id) ? { ...order, driverId: undefined } : order
      )
    )
    setSelectedOrders(new Set())
  }
  const [formData, setFormData] = useState({
    customer: '',
    cargoDescription: '',
    price: '',
    pickupTime: '',
    pickupAddress: '',
    deliverBeforeTime: '',
    deliverBeforeAddress: '',
    equipmentType: '',
    employeeId: '',
  })

  const handleCreateOrder = () => {
    setEditingOrderId(null)
    setFormData({
      customer: '',
      cargoDescription: '',
      price: '',
      pickupTime: '',
      pickupAddress: '',
      deliverBeforeTime: '',
      deliverBeforeAddress: '',
      equipmentType: '',
      employeeId: '',
    })
    setIsFormOpen(true)
  }

  const handleEditOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (order) {
      setEditingOrderId(orderId)
      setFormData({
        customer: order.customer,
        cargoDescription: order.cargoDescription,
        price: order.price.toString(),
        pickupTime: order.pickupTime,
        pickupAddress: order.pickupAddress,
        deliverBeforeTime: order.deliverBeforeTime,
        deliverBeforeAddress: order.deliverBeforeAddress,
        equipmentType: order.equipmentType,
        employeeId: order.employeeId || '',
      })
      setIsFormOpen(true)
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingOrderId(null)
    setFormData({
      customer: '',
      cargoDescription: '',
      price: '',
      pickupTime: '',
      pickupAddress: '',
      deliverBeforeTime: '',
      deliverBeforeAddress: '',
      equipmentType: '',
      employeeId: '',
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingOrderId) {
      // Update existing order
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === editingOrderId
            ? {
                ...order,
                customer: formData.customer,
                cargoDescription: formData.cargoDescription,
                price: parseFloat(formData.price) || 0,
                pickupTime: formData.pickupTime,
                pickupAddress: formData.pickupAddress,
                deliverBeforeTime: formData.deliverBeforeTime,
                deliverBeforeAddress: formData.deliverBeforeAddress,
                equipmentType: formData.equipmentType,
                employeeId: formData.employeeId || undefined,
              }
            : order
        )
      )
    } else {
      // Create new order
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        customer: formData.customer,
        cargoDescription: formData.cargoDescription,
        price: parseFloat(formData.price) || 0,
        pickupTime: formData.pickupTime,
        pickupAddress: formData.pickupAddress,
        deliverBeforeTime: formData.deliverBeforeTime,
        deliverBeforeAddress: formData.deliverBeforeAddress,
        equipmentType: formData.equipmentType,
        driverId: undefined,
        employeeId: formData.employeeId || undefined,
        status: 'active',
      }
      setOrders([...orders, newOrder])
    }
    handleCloseForm()
  }

  // Checkbox handlers
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (filteredOrders.every((order) => selectedOrders.has(order.id))) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map((order) => order.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedOrders.size === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedOrders.size} order(s)?`)) {
      setOrders(orders.filter((order) => !selectedOrders.has(order.id)))
      setSelectedOrders(new Set())
    }
  }

  const handleMarkAsFinished = () => {
    if (selectedOrders.size === 0) return
    
    if (window.confirm(`Mark ${selectedOrders.size} order(s) as finished?`)) {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          selectedOrders.has(order.id) ? { ...order, status: 'finished' as const } : order
        )
      )
      setSelectedOrders(new Set())
    }
  }

  // Column resizing handlers
  const handleResizeStart = (column: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(column)
    resizeStartX.current = e.clientX
    resizeStartWidth.current = columnWidths[column as keyof typeof columnWidths]
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const diff = e.clientX - resizeStartX.current
      const newWidth = Math.max(80, resizeStartWidth.current + diff)
      setColumnWidths((prev) => ({
        ...prev,
        [column]: newWidth,
      }))
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Generate random test orders
  const generateRandomOrders = (count: number) => {
    const customers = [
      'Acme Corporation', 'Global Logistics Inc', 'Nordic Transport AS',
      'Scandinavian Shipping', 'European Freight Ltd', 'International Cargo',
      'Express Delivery Co', 'Fast Track Logistics', 'Premium Transport',
      'Reliable Shipping', 'City Logistics', 'Metro Freight Services'
    ]

    const pickupAddresses = [
      '123 Main Street, Oslo, Norway',
      '456 Industrial Road, Bergen, Norway',
      '789 Harbor Boulevard, Trondheim, Norway',
      '321 Warehouse District, Stavanger, Norway',
      '555 Port Avenue, Kristiansand, Norway',
      '777 Business Park, Ålesund, Norway',
      '888 Logistics Center, Tromsø, Norway',
      '999 Freight Terminal, Bodø, Norway',
      '111 Distribution Hub, Drammen, Norway',
      '222 Cargo Port, Haugesund, Norway'
    ]

    const deliveryAddresses = [
      '100 Delivery Street, Oslo, Norway',
      '200 Transport Avenue, Bergen, Norway',
      '300 Shipping Lane, Trondheim, Norway',
      '400 Cargo Road, Stavanger, Norway',
      '500 Freight Way, Kristiansand, Norway',
      '600 Logistics Boulevard, Ålesund, Norway',
      '700 Express Drive, Tromsø, Norway',
      '800 Distribution Center, Bodø, Norway',
      '900 Warehouse Road, Drammen, Norway',
      '1000 Terminal Street, Haugesund, Norway'
    ]

    const equipmentTypes = [
      'Van - Small',
      'Truck - 20ft',
      'Truck - 40ft',
      'Refrigerated Truck',
      'Flatbed Truck'
    ]

    const cargoDescriptions = [
      'Electronics and appliances',
      'Furniture and home goods',
      'Food and beverages',
      'Construction materials',
      'Automotive parts',
      'Clothing and textiles',
      'Machinery and equipment',
      'Medical supplies',
      'Office supplies',
      'Raw materials',
      'Packaged goods',
      'Perishable items'
    ]

    const newOrders: Order[] = []
    const now = new Date()

    for (let i = 0; i < count; i++) {
      // Random date within next 30 days
      const daysOffset = Math.floor(Math.random() * 30)
      const pickupDate = new Date(now)
      pickupDate.setDate(now.getDate() + daysOffset)
      
      // Random time between 6 AM and 6 PM
      const pickupHour = 6 + Math.floor(Math.random() * 12)
      const pickupMinute = Math.random() < 0.5 ? 0 : 30
      pickupDate.setHours(pickupHour, pickupMinute, 0)

      // Delivery time 2-8 hours after pickup
      const deliveryDate = new Date(pickupDate)
      const hoursToAdd = 2 + Math.floor(Math.random() * 6)
      deliveryDate.setHours(pickupDate.getHours() + hoursToAdd)

      // Format dates for datetime-local input
      const formatDateTime = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      newOrders.push({
        id: `ORD-${Date.now()}-${i}`,
        customer: customers[Math.floor(Math.random() * customers.length)],
        cargoDescription: cargoDescriptions[Math.floor(Math.random() * cargoDescriptions.length)],
        price: Math.floor(Math.random() * 50000) + 1000, // Random price between 1000-51000
        pickupTime: formatDateTime(pickupDate),
        pickupAddress: pickupAddresses[Math.floor(Math.random() * pickupAddresses.length)],
        deliverBeforeTime: formatDateTime(deliveryDate),
        deliverBeforeAddress: deliveryAddresses[Math.floor(Math.random() * deliveryAddresses.length)],
        equipmentType: equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)],
        driverId: undefined,
        status: 'active',
      })
    }

    setOrders([...orders, ...newOrders])
  }

  const handleGenerateTestOrders = () => {
    const count = parseInt(numberOfTestOrders, 10)
    if (count > 0 && count <= 100) {
      generateRandomOrders(count)
    } else {
      alert('Please enter a number between 1 and 100')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Slide-in Form Panel from Left */}
      <div
        className={`fixed top-0 left-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isFormOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Form Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {editingOrderId ? 'Edit Order' : 'Create New Order'}
            </h3>
            <button
              onClick={handleCloseForm}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {/* Customer */}
              <div>
                <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer
                </label>
                <input
                  type="text"
                  id="customer"
                  name="customer"
                  value={formData.customer}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter customer name"
                />
              </div>

              {/* Cargo Description */}
              <div>
                <label htmlFor="cargoDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo Description
                </label>
                <textarea
                  id="cargoDescription"
                  name="cargoDescription"
                  value={formData.cargoDescription}
                  onChange={handleInputChange}
                  required
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe what you are transporting"
                />
              </div>

              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Price (NOK)
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter price"
                />
              </div>

              {/* Pickup Time */}
              <div>
                <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Time
                </label>
                <input
                  type="datetime-local"
                  id="pickupTime"
                  name="pickupTime"
                  value={formData.pickupTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Pickup Address */}
              <div>
                <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Address
                </label>
                <textarea
                  id="pickupAddress"
                  name="pickupAddress"
                  value={formData.pickupAddress}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter pickup address"
                />
              </div>

              {/* Deliver Before Time */}
              <div>
                <label htmlFor="deliverBeforeTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Deliver Before Time
                </label>
                <input
                  type="datetime-local"
                  id="deliverBeforeTime"
                  name="deliverBeforeTime"
                  value={formData.deliverBeforeTime}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Deliver Before Address */}
              <div>
                <label htmlFor="deliverBeforeAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Deliver Before Address
                </label>
                <textarea
                  id="deliverBeforeAddress"
                  name="deliverBeforeAddress"
                  value={formData.deliverBeforeAddress}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter delivery address"
                />
              </div>

              {/* Equipment Type */}
              <div>
                <label htmlFor="equipmentType" className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Type
                </label>
                <select
                  id="equipmentType"
                  name="equipmentType"
                  value={formData.equipmentType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select equipment type</option>
                  <option value="Van - Small">Van - Small</option>
                  <option value="Truck - 20ft">Truck - 20ft</option>
                  <option value="Truck - 40ft">Truck - 40ft</option>
                  <option value="Refrigerated Truck">Refrigerated Truck</option>
                  <option value="Flatbed Truck">Flatbed Truck</option>
                </select>
              </div>

              {/* Employee */}
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Employee
                </label>
                <select
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No employee assigned</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} {employee.role ? `(${employee.role})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          {/* Form Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              {editingOrderId ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Order Management
            </h2>
            <p className="text-gray-600">
              Manage and track all your transport orders
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Test Orders Input and Button */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={numberOfTestOrders}
                onChange={(e) => setNumberOfTestOrders(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="10"
              />
              <button
                onClick={handleGenerateTestOrders}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Test Data
              </button>
            </div>

            {/* Create Order Button */}
            <button
              onClick={handleCreateOrder}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Order
            </button>

            {/* Import/Export Buttons */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportOrders}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Import orders from JSON"
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </button>
            <button
              onClick={handleExportOrdersJSON}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Export orders to JSON"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>
            {/* Search Orders Button */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Search Orders"
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Export to CSV"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </button>

          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">

          {/* Search and Date Range Filters (Collapsible) */}
          {isSearchOpen && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Orders
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search by Order ID, Customer, Address, or Driver..."
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div>
                    <label htmlFor="dateRangeType" className="block text-sm font-medium text-gray-700 mb-2">
                      Date Type
                    </label>
                    <select
                      id="dateRangeType"
                      value={dateRangeType}
                      onChange={(e) => setDateRangeType(e.target.value as 'pickup' | 'delivery')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pickup">Pickup Date</option>
                      <option value="delivery">Delivery Date</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="dateRangeStart" className="block text-sm font-medium text-gray-700 mb-2">
                      From
                    </label>
                    <input
                      type="date"
                      id="dateRangeStart"
                      value={dateRangeStart}
                      onChange={(e) => setDateRangeStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="dateRangeEnd" className="block text-sm font-medium text-gray-700 mb-2">
                      To
                    </label>
                    <input
                      type="date"
                      id="dateRangeEnd"
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {(dateRangeStart || dateRangeEnd) && (
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setDateRangeStart('')
                          setDateRangeEnd('')
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* View Content */}
        <div className="flex gap-4">
            {/* Drivers Sidebar */}
            <div className={`w-64 rounded-lg shadow-sm border p-4 transition-colors ${
              isAssignMode 
                ? 'bg-yellow-50 border-yellow-300' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Drivers</h3>
                {isAssignMode && (
                  <span className="text-xs font-medium text-yellow-800 bg-yellow-200 px-2 py-1 rounded">
                    Assign Mode
                  </span>
                )}
              </div>
              {isAssignMode && selectedOrders.size > 0 && (
                <div className="mb-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-900">
                  Click a driver to assign {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''}
                </div>
              )}
              <div className="space-y-3">
                {drivers.map((driver) => {
                  const activeOrders = getDriverActiveOrders(driver.id)
                  const isSelected = selectedDriver === driver.id
                  return (
                    <div
                      key={driver.id}
                      onClick={() => handleDriverClick(driver.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isAssignMode
                          ? 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200 hover:border-yellow-500'
                          : isSelected
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900">{driver.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Active orders: {activeOrders}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Orders Table */}
            <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'all'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All orders
                </button>
                <button
                  onClick={() => setActiveTab('unassigned')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'unassigned'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Unassigned orders
                </button>
                <button
                  onClick={() => setActiveTab('assigned')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'assigned'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Assigned orders
                </button>
                <button
                  onClick={() => setActiveTab('finished')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'finished'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Finished orders
                </button>
              </nav>
            </div>
            {/* Bulk Actions Bar */}
            {selectedOrders.size > 0 && (
              <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {selectedOrders.size} order{selectedOrders.size > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAssignMode(!isAssignMode)}
                    className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                      isAssignMode
                        ? 'text-yellow-900 bg-yellow-500 hover:bg-yellow-600'
                        : 'text-white bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isAssignMode ? 'Cancel Assignment' : 'Assign to Driver'}
                  </button>
                  <button
                    onClick={handleUnassignOrders}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Unassign
                  </button>
                  <button
                    onClick={handleMarkAsFinished}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                  >
                    Mark as Finished
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrders(new Set())
                      setIsAssignMode(false)
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="divide-y divide-gray-200" style={{ tableLayout: 'fixed', width: '100%' }}>
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      style={{ width: '50px', minWidth: '50px' }}
                      className="px-4 py-3 text-center"
                    >
                      <input
                        type="checkbox"
                        checked={filteredOrders.length > 0 && filteredOrders.every((order) => selectedOrders.has(order.id))}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th 
                      style={{ width: `${columnWidths.orderId}px`, minWidth: '80px' }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      <div className="flex items-center justify-between">
                        <span>Order ID</span>
                        <div
                          onMouseDown={(e) => handleResizeStart('orderId', e)}
                          className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
                            resizingColumn === 'orderId' ? 'bg-blue-500' : ''
                          }`}
                          style={{ zIndex: 10 }}
                        />
                      </div>
                    </th>
                    <th 
                      style={{ width: `${columnWidths.customer}px`, minWidth: '80px' }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleSort('customer')}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          <span>Customer</span>
                          {sortField === 'customer' && (
                            <span className="text-blue-600">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                        <div
                          onMouseDown={(e) => handleResizeStart('customer', e)}
                          className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
                            resizingColumn === 'customer' ? 'bg-blue-500' : ''
                          }`}
                          style={{ zIndex: 10 }}
                        />
                      </div>
                    </th>
                    <th 
                      style={{ width: `${columnWidths.cargo}px`, minWidth: '80px' }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      <div className="flex items-center justify-between">
                        <span>Cargo</span>
                        <div
                          onMouseDown={(e) => handleResizeStart('cargo', e)}
                          className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
                            resizingColumn === 'cargo' ? 'bg-blue-500' : ''
                          }`}
                          style={{ zIndex: 10 }}
                        />
                      </div>
                    </th>
                    <th 
                      style={{ width: `${columnWidths.price}px`, minWidth: '80px' }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleSort('price')}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          <span>Price</span>
                          {sortField === 'price' && (
                            <span className="text-blue-600">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                        <div
                          onMouseDown={(e) => handleResizeStart('price', e)}
                          className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
                            resizingColumn === 'price' ? 'bg-blue-500' : ''
                          }`}
                          style={{ zIndex: 10 }}
                        />
                      </div>
                    </th>
                    <th 
                      style={{ width: `${columnWidths.pickupTime}px`, minWidth: '80px' }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleSort('pickupTime')}
                          className="flex items-center gap-1 hover:text-gray-700"
                        >
                          <span>Pickup Time</span>
                          {sortField === 'pickupTime' && (
                            <span className="text-blue-600">
                              {sortDirection === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                        <div
                          onMouseDown={(e) => handleResizeStart('pickupTime', e)}
                          className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
                            resizingColumn === 'pickupTime' ? 'bg-blue-500' : ''
                          }`}
                          style={{ zIndex: 10 }}
                        />
                      </div>
                    </th>
                    <th 
                      style={{ width: `${columnWidths.pickupAddress}px`, minWidth: '80px' }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      <div className="flex items-center justify-between">
                        <span>Pickup Address</span>
                        <div
                          onMouseDown={(e) => handleResizeStart('pickupAddress', e)}
                          className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
                            resizingColumn === 'pickupAddress' ? 'bg-blue-500' : ''
                          }`}
                          style={{ zIndex: 10 }}
                        />
                      </div>
                    </th>
                    <th 
                      style={{ width: `${columnWidths.deliverBeforeTime}px`, minWidth: '80px' }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      <div className="flex items-center justify-between">
                        <span>Deliver Before Time</span>
                        <div
                          onMouseDown={(e) => handleResizeStart('deliverBeforeTime', e)}
                          className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
                            resizingColumn === 'deliverBeforeTime' ? 'bg-blue-500' : ''
                          }`}
                          style={{ zIndex: 10 }}
                        />
                      </div>
                    </th>
                    <th 
                      style={{ width: `${columnWidths.deliverBeforeAddress}px`, minWidth: '80px' }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      <div className="flex items-center justify-between">
                        <span>Deliver Before Address</span>
                        <div
                          onMouseDown={(e) => handleResizeStart('deliverBeforeAddress', e)}
                          className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
                            resizingColumn === 'deliverBeforeAddress' ? 'bg-blue-500' : ''
                          }`}
                          style={{ zIndex: 10 }}
                        />
                      </div>
                    </th>
                    <th 
                      style={{ width: `${columnWidths.equipmentType}px`, minWidth: '80px' }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      Equipment Type
                    </th>
                    <th 
                      style={{ width: `${columnWidths.driver}px`, minWidth: '80px' }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      <div className="flex items-center justify-between">
                        <span>Driver</span>
                        <div
                          onMouseDown={(e) => handleResizeStart('driver', e)}
                          className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
                            resizingColumn === 'driver' ? 'bg-blue-500' : ''
                          }`}
                          style={{ zIndex: 10 }}
                        />
                      </div>
                    </th>
                    <th 
                      style={{ width: `${columnWidths.employee}px`, minWidth: '80px' }}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                    >
                      <div className="flex items-center justify-between">
                        <span>Employee</span>
                        <div
                          onMouseDown={(e) => handleResizeStart('employee', e)}
                          className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500 transition-colors ${
                            resizingColumn === 'employee' ? 'bg-blue-500' : ''
                          }`}
                          style={{ zIndex: 10 }}
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-6 py-12 text-center">
                        <p className="text-sm text-gray-500">
                          {orders.length === 0
                            ? 'No orders yet. Create your first order!'
                            : activeTab === 'all'
                            ? selectedDriver
                              ? 'No orders assigned to this driver'
                              : 'No orders found'
                            : activeTab === 'unassigned'
                            ? 'No unassigned orders'
                            : activeTab === 'assigned'
                            ? 'No assigned orders'
                            : activeTab === 'finished'
                            ? 'No finished orders'
                            : 'No orders found'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const assignedDriver = drivers.find((d) => d.id === order.driverId)
                      const assignedEmployee = employees.find((e) => e.id === order.employeeId)
                      return (
                      <tr 
                        key={order.id} 
                        onClick={(e) => {
                          const target = e.target as HTMLElement
                          if (target.tagName === 'INPUT' || target.closest('input')) {
                            return
                          }
                          handleOrderClick(order)
                        }}
                        onDoubleClick={(e) => {
                          const target = e.target as HTMLElement
                          if (target.tagName === 'INPUT' || target.closest('input')) {
                            return
                          }
                          handleEditOrder(order.id)
                        }}
                        className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                          selectedOrders.has(order.id) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td style={{ width: '50px' }} className="px-4 py-4 text-center" onDoubleClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedOrders.has(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        </td>
                        <td style={{ width: `${columnWidths.orderId}px` }} className="px-6 py-4 whitespace-nowrap overflow-hidden">
                          <span className="text-sm font-medium text-gray-900 truncate block">
                            {order.id}
                          </span>
                        </td>
                        <td style={{ width: `${columnWidths.customer}px` }} className="px-6 py-4 whitespace-nowrap overflow-hidden">
                          <span className="text-sm text-gray-700 truncate block">
                            {order.customer}
                          </span>
                        </td>
                        <td style={{ width: `${columnWidths.cargo}px` }} className="px-6 py-4 overflow-hidden">
                          <span className="text-sm text-gray-700 truncate block" title={order.cargoDescription}>
                            {order.cargoDescription}
                          </span>
                        </td>
                        <td style={{ width: `${columnWidths.price}px` }} className="px-6 py-4 whitespace-nowrap overflow-hidden">
                          <span className="text-sm font-medium text-gray-900 truncate block">
                            {order.price.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
                          </span>
                        </td>
                        <td style={{ width: `${columnWidths.pickupTime}px` }} className="px-6 py-4 whitespace-nowrap overflow-hidden">
                          <span className="text-sm text-gray-700 truncate block">
                            {order.pickupTime}
                          </span>
                        </td>
                        <td style={{ width: `${columnWidths.pickupAddress}px` }} className="px-6 py-4 overflow-hidden">
                          <span className="text-sm text-gray-700 truncate block" title={order.pickupAddress}>
                            {order.pickupAddress}
                          </span>
                        </td>
                        <td style={{ width: `${columnWidths.deliverBeforeTime}px` }} className="px-6 py-4 whitespace-nowrap overflow-hidden">
                          <span className="text-sm text-gray-700 truncate block">
                            {order.deliverBeforeTime}
                          </span>
                        </td>
                        <td style={{ width: `${columnWidths.deliverBeforeAddress}px` }} className="px-6 py-4 overflow-hidden">
                          <span className="text-sm text-gray-700 truncate block" title={order.deliverBeforeAddress}>
                            {order.deliverBeforeAddress}
                          </span>
                        </td>
                        <td style={{ width: `${columnWidths.equipmentType}px` }} className="px-6 py-4 whitespace-nowrap overflow-hidden">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate">
                            {order.equipmentType}
                          </span>
                        </td>
                        <td style={{ width: `${columnWidths.driver}px` }} className="px-6 py-4 whitespace-nowrap overflow-hidden">
                          {assignedDriver ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 truncate">
                              {assignedDriver.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td style={{ width: `${columnWidths.employee}px` }} className="px-6 py-4 whitespace-nowrap overflow-hidden">
                          {assignedEmployee ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 truncate">
                              {assignedEmployee.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Order Details</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleEditOrder(selectedOrderDetails.id)
                    setSelectedOrderDetails(null)
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Order ID</label>
                  <p className="text-sm text-gray-900 font-medium">{selectedOrderDetails.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <p className="text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedOrderDetails.status === 'finished' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedOrderDetails.status === 'finished' ? 'Finished' : 'Active'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Customer</label>
                  <p className="text-sm text-gray-900">{selectedOrderDetails.customer}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Price</label>
                  <p className="text-sm text-gray-900 font-medium">
                    {selectedOrderDetails.price.toLocaleString('no-NO', { style: 'currency', currency: 'NOK' })}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Cargo Description</label>
                  <p className="text-sm text-gray-900">{selectedOrderDetails.cargoDescription}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Pickup Time</label>
                  <p className="text-sm text-gray-900">{selectedOrderDetails.pickupTime}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Deliver Before Time</label>
                  <p className="text-sm text-gray-900">{selectedOrderDetails.deliverBeforeTime}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Pickup Address</label>
                  <p className="text-sm text-gray-900">{selectedOrderDetails.pickupAddress}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Delivery Address</label>
                  <p className="text-sm text-gray-900">{selectedOrderDetails.deliverBeforeAddress}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Equipment Type</label>
                  <p className="text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedOrderDetails.equipmentType}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Driver</label>
                  <p className="text-sm">
                    {selectedOrderDetails.driverId ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {drivers.find((d) => d.id === selectedOrderDetails.driverId)?.name || 'Unknown'}
                      </span>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Employee</label>
                  <p className="text-sm">
                    {selectedOrderDetails.employeeId ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {employees.find((e) => e.id === selectedOrderDetails.employeeId)?.name || 'Unknown'}
                      </span>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

