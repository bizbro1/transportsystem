import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import OrderManagement from './pages/OrderManagement'
import Employees from './pages/Employees'
import Equipment from './pages/Equipment'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/order-management" element={<OrderManagement />} />
          <Route path="/employees-salary" element={<Employees />} />
          <Route path="/equipment" element={<Equipment />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
