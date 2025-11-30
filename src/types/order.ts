export interface Order {
  id: string
  customer: string
  cargoDescription: string
  price: number
  pickupTime: string
  pickupAddress: string
  deliverBeforeTime: string
  deliverBeforeAddress: string
  equipmentType: string
  driverId?: string
  employeeId?: string
  status?: 'active' | 'finished'
}

