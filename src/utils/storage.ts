// Storage utility for persisting data to localStorage with JSON file-like structure

export const StorageKeys = {
  ORDERS: 'orders',
  EMPLOYEES: 'employees',
  DRIVERS: 'drivers',
  EQUIPMENT: 'equipment',
} as const

// Generic storage functions
export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Failed to save ${key} to storage:`, error)
  }
}

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored) as T
    }
  } catch (error) {
    console.error(`Failed to load ${key} from storage:`, error)
  }
  return defaultValue
}

// Export data as JSON string
export function exportAsJSON<T>(data: T, filename: string): void {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Import data from JSON file
export function importFromJSON<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as T
        resolve(data)
      } catch (error) {
        reject(new Error('Invalid JSON file'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

// Initialize storage with default data if empty
export function initializeStorage<T>(key: string, defaultData: T): T {
  const existing = loadFromStorage<T>(key, defaultData)
  if (JSON.stringify(existing) === JSON.stringify(defaultData)) {
    saveToStorage(key, defaultData)
  }
  return existing
}

