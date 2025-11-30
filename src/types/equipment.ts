export interface Equipment {
  id: string
  name: string
  type: string
  licensePlate?: string
  status?: 'available' | 'in-use' | 'maintenance' | 'retired'
  notes?: string
  createdAt: string
}

