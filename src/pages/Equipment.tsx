import { useState, useEffect, useRef } from 'react'
import type { Equipment } from '../types/equipment'
import { saveToStorage, loadFromStorage, StorageKeys, exportAsJSON, importFromJSON } from '../utils/storage'

export default function Equipment() {
  // Load equipment from localStorage on mount
  const [equipment, setEquipment] = useState<Equipment[]>(() => {
    return loadFromStorage<Equipment[]>(StorageKeys.EQUIPMENT, [])
  })

  // Save equipment to localStorage whenever it changes
  useEffect(() => {
    saveToStorage(StorageKeys.EQUIPMENT, equipment)
  }, [equipment])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    licensePlate: '',
    status: 'available' as Equipment['status'],
    notes: '',
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCreateEquipment = () => {
    setEditingEquipmentId(null)
    setFormData({
      name: '',
      type: '',
      licensePlate: '',
      status: 'available',
      notes: '',
    })
    setIsFormOpen(true)
  }

  const handleEditEquipment = (equipmentId: string) => {
    const item = equipment.find((e) => e.id === equipmentId)
    if (item) {
      setEditingEquipmentId(equipmentId)
      setFormData({
        name: item.name,
        type: item.type,
        licensePlate: item.licensePlate || '',
        status: item.status || 'available',
        notes: item.notes || '',
      })
      setIsFormOpen(true)
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingEquipmentId(null)
    setFormData({
      name: '',
      type: '',
      licensePlate: '',
      status: 'available',
      notes: '',
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
    
    if (editingEquipmentId) {
      // Update existing equipment
      setEquipment((prevEquipment) =>
        prevEquipment.map((item) =>
          item.id === editingEquipmentId
            ? {
                ...item,
                name: formData.name,
                type: formData.type,
                licensePlate: formData.licensePlate || undefined,
                status: formData.status,
                notes: formData.notes || undefined,
              }
            : item
        )
      )
    } else {
      // Create new equipment
      const newEquipment: Equipment = {
        id: `EQ-${Date.now()}`,
        name: formData.name,
        type: formData.type,
        licensePlate: formData.licensePlate || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
        createdAt: new Date().toISOString(),
      }
      setEquipment([...equipment, newEquipment])
    }
    handleCloseForm()
  }

  const handleDeleteEquipment = (equipmentId: string) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      setEquipment(equipment.filter((item) => item.id !== equipmentId))
    }
  }

  const handleExportData = () => {
    exportAsJSON(equipment, `equipment_${new Date().toISOString().split('T')[0]}.json`)
  }

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const importedData = await importFromJSON<Equipment[]>(file)
      if (Array.isArray(importedData)) {
        if (window.confirm(`Import ${importedData.length} equipment item(s)? This will replace your current data.`)) {
          setEquipment(importedData)
        }
      } else {
        alert('Invalid file format. Expected an array of equipment.')
      }
    } catch (error) {
      alert('Failed to import file: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getStatusColor = (status?: Equipment['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'in-use':
        return 'bg-blue-100 text-blue-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      case 'retired':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const equipmentTypes = [
    'Van - Small',
    'Truck - 20ft',
    'Truck - 40ft',
    'Refrigerated Truck',
    'Flatbed Truck',
    'Container Truck',
    'Crane Truck',
    'Other',
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Slide-in Form */}
      <div
        className={`fixed left-0 top-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isFormOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Form Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">
              {editingEquipmentId ? 'Edit Equipment' : 'Add New Equipment'}
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
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Truck-001, Van-A"
                />
              </div>

              {/* Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Equipment Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select equipment type</option>
                  {equipmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* License Plate */}
              <div>
                <label htmlFor="licensePlate" className="block text-sm font-medium text-gray-700 mb-2">
                  License Plate
                </label>
                <input
                  type="text"
                  id="licensePlate"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter license plate number"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="in-use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Additional notes about this equipment..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                {editingEquipmentId ? 'Update Equipment' : 'Add Equipment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Equipment
            </h2>
            <p className="text-gray-600">
              Manage your transport equipment and vehicles
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Import/Export Buttons */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Import equipment from JSON"
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
              onClick={handleExportData}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              title="Export equipment to JSON"
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
            {/* Create Equipment Button */}
            <button
              onClick={handleCreateEquipment}
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
              Add Equipment
            </button>
          </div>
        </div>

        {/* Equipment Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License Plate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipment.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-sm text-gray-500">No equipment yet. Add your first equipment!</p>
                    </td>
                  </tr>
                ) : (
                  equipment.map((item) => (
                    <tr 
                      key={item.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onDoubleClick={() => handleEditEquipment(item.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{item.licensePlate || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status === 'in-use' ? 'In Use' : item.status || 'Available'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditEquipment(item.id)}
                          className="text-blue-600 hover:text-blue-800 transition-colors mr-3"
                          title="Edit equipment"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteEquipment(item.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete equipment"
                        >
                          <svg
                            className="w-5 h-5"
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

