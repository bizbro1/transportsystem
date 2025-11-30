# Transport Business Management System

A comprehensive web application for transport businesses to manage their operations, including order management, invoicing, equipment tracking, employee management, and reporting.

## 🚀 Tech Stack

- **Frontend Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM v7
- **Language**: TypeScript

## 📁 Project Structure

```
src/
  assets/        # Images, icons, fonts
  components/    # Reusable UI components
    - Navbar.tsx
    - ScheduleCalendar.tsx
  features/      # Feature modules (auth, users, products, etc.)
  pages/         # Page-level components (routes)
    - Home.tsx
    - OrderManagement.tsx
  hooks/         # Custom React hooks
  context/       # Context providers
  services/      # API calls, client wrappers
  utils/         # Helper functions
  types/         # TypeScript type definitions
    - order.ts
  styles/        # Global CSS, Tailwind utilities, theme files
  App.tsx
  main.tsx
```

## ✨ Features

### Order Management Module (Implemented)

The Order Management module provides comprehensive order tracking and scheduling capabilities:

#### 📋 Table View
- View all orders in a detailed table format
- Columns: Order ID, Customer, Pickup Time, Pickup Address, Deliver Before Time, Deliver Before Address, Equipment Type
- Delete orders with confirmation
- Empty state when no orders exist

#### 📅 Calendar View
- **Weekly/Daily View**: Toggle between week and day views
- **Time-based Scheduling**: Time slots from 6 AM to 10 PM (30-minute intervals)
- **Drag and Drop**:
  - Drag orders from sidebar to calendar to schedule them
  - Drag scheduled orders to different time slots to reschedule
  - Drag scheduled orders back to sidebar to unschedule
- **Visual Feedback**:
  - Blue highlight for valid drop zones
  - Red highlight for occupied slots
  - Today's date highlighted
- **Order Sidebar**: Shows unscheduled orders with customer information

#### ➕ Create Orders
- Slide-in form panel from the left
- Form fields:
  - Customer name
  - Pickup time (datetime)
  - Pickup address
  - Deliver before time (datetime)
  - Deliver before address
  - Equipment type (dropdown)
- Automatic order ID generation
- Form validation

#### 🗑️ Delete Orders
- Delete from table view
- Delete from calendar sidebar
- Confirmation dialog before deletion

## 🎯 Planned Modules

1. **Order Management** ✅ (Implemented)
2. **Invoicing** - Create and manage invoices
3. **Equipment** - Track and manage transport equipment
4. **Employees & Salary** - Manage employees and salary information
5. **Reports** - View business reports and analytics
6. **Settings** - Configure system settings and preferences

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FirstMacProject
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🚀 Deployment

### Deploy to Vercel

This project is configured for easy deployment on Vercel:

1. **Push your code to GitHub** (if not already done)

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

3. **Deploy**:
   - Vercel will automatically build and deploy
   - Your app will be live at `https://your-project.vercel.app`

The `vercel.json` configuration file is included for optimal routing and build settings.

**Note**: Since this app uses `localStorage` for data persistence, data will be stored locally in each user's browser and won't persist across devices.

## 📝 Order Data Structure

```typescript
interface Order {
  id: string                    // Auto-generated (e.g., "ORD-1234567890")
  customer: string              // Customer name
  pickupTime: string            // DateTime string
  pickupAddress: string         // Full pickup address
  deliverBeforeTime: string     // DateTime string
  deliverBeforeAddress: string  // Full delivery address
  equipmentType: string         // Equipment type (Van, Truck, etc.)
}
```

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface with Tailwind CSS
- **Smooth Animations**: Slide-in forms, drag and drop transitions
- **Visual Feedback**: Hover states, active states, drag indicators
- **Accessibility**: Keyboard navigation, proper ARIA labels

## 🔄 Navigation

- **Navbar**: Access all modules from the top navigation
- **Home Page**: Overview dashboard with module cards
- **Order Management**: Full-featured order management interface

## 📦 Future Enhancements

- [ ] Database integration (SQLite)
- [ ] API backend for data persistence
- [ ] User authentication
- [ ] Order editing functionality
- [ ] Export orders to PDF/Excel
- [ ] Advanced filtering and search
- [ ] Order status tracking
- [ ] Email notifications
- [ ] Multi-user support

## 🤝 Contributing

This is a practice project for learning and development.

## 📄 License

Private project - All rights reserved

---

**Note**: This is a practice project. Current implementation uses in-memory state management. Database integration is planned for future development.
