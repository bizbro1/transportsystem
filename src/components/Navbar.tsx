import { Link, useLocation } from 'react-router-dom'

const modules = [
  { name: 'Order Management', path: '/order-management' },
  { name: 'Invoicing', path: '/invoicing' },
  { name: 'Equipment', path: '/equipment' },
  { name: 'Employees & Salary', path: '/employees-salary' },
  { name: 'Reports', path: '/reports' },
  { name: 'Settings', path: '/settings' },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-0 sm:h-16 gap-4 sm:gap-0">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
              Transport Business System
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {modules.map((module) => {
              const isActive = location.pathname === module.path
              return (
                <Link
                  key={module.path}
                  to={module.path}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 bg-gray-50'
                  }`}
                >
                  {module.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

