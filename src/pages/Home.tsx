export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Overview</h2>
          <p className="text-gray-600">
            Welcome to your transport business management system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Order Management Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Order Management
            </h3>
            <p className="text-gray-600 text-sm">
              Manage and track all your transport orders
            </p>
          </div>

          {/* Invoicing Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Invoicing
            </h3>
            <p className="text-gray-600 text-sm">
              Create and manage invoices for your services
            </p>
          </div>

          {/* Equipment Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Equipment
            </h3>
            <p className="text-gray-600 text-sm">
              Track and manage your transport equipment
            </p>
          </div>

          {/* Employees & Salary Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Employees & Salary
            </h3>
            <p className="text-gray-600 text-sm">
              Manage employees and salary information
            </p>
          </div>

          {/* Reports Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Reports
            </h3>
            <p className="text-gray-600 text-sm">
              View business reports and analytics
            </p>
          </div>

          {/* Settings Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Settings
            </h3>
            <p className="text-gray-600 text-sm">
              Configure system settings and preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

