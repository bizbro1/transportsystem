# Technical Documentation

## Architecture Overview

This is a **Single Page Application (SPA)** built with React and TypeScript, using a component-based architecture with client-side routing.

### Technology Stack

- **React 19.2**: UI library with latest features
- **TypeScript 5.9**: Type-safe JavaScript
- **Vite 7.2**: Fast build tool and dev server (using Rolldown)
- **Tailwind CSS 4.1**: Utility-first CSS framework
- **React Router DOM 7.9**: Client-side routing

### Build System

- **Vite**: Modern build tool with HMR (Hot Module Replacement)
- **Rolldown**: Fast Rust-based bundler (via Vite)
- **TypeScript Compiler**: Type checking and compilation
- **ESLint**: Code linting and quality checks

## Project Structure

```
FirstMacProject/
├── src/
│   ├── assets/           # Static assets (images, icons)
│   ├── components/       # Reusable UI components
│   │   ├── Navbar.tsx
│   │   └── ScheduleCalendar.tsx
│   ├── pages/            # Route-level page components
│   │   ├── Home.tsx
│   │   └── OrderManagement.tsx
│   ├── types/            # TypeScript type definitions
│   │   └── order.ts
│   ├── hooks/            # Custom React hooks (future)
│   ├── context/          # React Context providers (future)
│   ├── services/         # API services (future)
│   ├── utils/            # Utility functions (future)
│   ├── styles/           # Global styles (future)
│   ├── App.tsx           # Root component with routing
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global CSS with Tailwind
├── public/               # Public static files
├── dist/                 # Production build output
├── node_modules/         # Dependencies
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── tsconfig.app.json     # App-specific TS config
├── tsconfig.node.json    # Node-specific TS config
├── vite.config.ts        # Vite configuration
├── eslint.config.js      # ESLint configuration
└── README.md             # User-facing documentation
```

## Component Architecture

### Component Hierarchy

```
App
├── Router (BrowserRouter)
│   ├── Navbar (persistent)
│   └── Routes
│       ├── Home
│       └── OrderManagement
│           ├── CreateOrderForm (slide-in panel)
│           ├── OrdersTable (table view)
│           └── ScheduleCalendar (calendar view)
│               ├── OrdersSidebar
│               └── CalendarGrid
│                   └── TimeSlot (multiple)
│                       └── ScheduledOrderBlock
```

### Component Types

1. **Page Components** (`pages/`)
   - Route-level components
   - Manage page-level state
   - Compose multiple feature components

2. **Feature Components** (`components/`)
   - Self-contained features
   - Reusable across pages
   - Manage their own internal state

3. **Layout Components**
   - Navbar: Persistent navigation
   - Form panels: Slide-in modals

## State Management

### Current Implementation

**Local Component State** (useState):
- Order list management in `OrderManagement`
- Form state for creating orders
- View mode (table/calendar) toggle
- Calendar scheduling state in `ScheduleCalendar`

### State Flow

```
OrderManagement (Parent)
├── orders: Order[] (state)
├── viewMode: 'table' | 'calendar' (state)
├── isFormOpen: boolean (state)
└── formData: FormData (state)
    │
    ├── CreateOrderForm
    │   └── Updates orders via handleSubmit
    │
    ├── OrdersTable
    │   └── Reads orders, deletes via handleDeleteOrder
    │
    └── ScheduleCalendar
        ├── Receives orders as props
        ├── Manages scheduledOrders internally
        └── Calls onOrderScheduled callback
```

### Future State Management

Planned approaches:
- **React Context API**: For global state (user, theme, settings)
- **Custom Hooks**: For reusable state logic
- **State Management Library**: Consider Zustand or Redux Toolkit if complexity grows

## Data Models

### Order Interface

```typescript
interface Order {
  id: string                    // Format: "ORD-{timestamp}"
  customer: string              // Customer name
  pickupTime: string            // ISO datetime string
  pickupAddress: string         // Full address
  deliverBeforeTime: string     // ISO datetime string
  deliverBeforeAddress: string  // Full address
  equipmentType: string         // Equipment category
}
```

### Internal State Models

```typescript
// Scheduled Order (calendar-specific)
interface ScheduledOrder {
  orderId: string    // References Order.id
  date: string       // ISO date string (YYYY-MM-DD)
  timeSlot: string   // Time string (HH:mm)
}
```

## Routing

### Route Configuration

```typescript
<Router>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/order-management" element={<OrderManagement />} />
    // Future routes:
    // <Route path="/invoicing" element={<Invoicing />} />
    // <Route path="/equipment" element={<Equipment />} />
    // etc.
  </Routes>
</Router>
```

### Navigation

- **Programmatic**: `useNavigate()` hook
- **Declarative**: `<Link>` components in Navbar
- **Active State**: `useLocation()` to highlight active route

## Styling Architecture

### Tailwind CSS v4

- **Configuration**: `@tailwindcss/vite` plugin
- **Import**: `@import "tailwindcss"` in `index.css`
- **Utility Classes**: Component-level styling
- **Responsive**: Mobile-first breakpoints (sm, md, lg, xl)

### CSS Organization

- **Global Styles**: `src/index.css`
  - Tailwind imports
  - Base resets
  - Global typography

- **Component Styles**: Inline Tailwind classes
- **Future**: Component-specific CSS files in `styles/` if needed

## Drag and Drop Implementation

### HTML5 Drag and Drop API

The calendar uses native browser drag and drop:

```typescript
// Drag Source
<div draggable onDragStart={handleDragStart} />

// Drop Target
<div 
  onDragOver={handleDragOver}  // Prevent default
  onDrop={handleDrop}           // Handle drop
/>
```

### Drag Flow

1. **Drag Start**: Set `draggedOrder` and `draggedScheduledOrder` state
2. **Drag Over**: Update visual feedback (`dragOverTimeSlot`, `isDragOverSidebar`)
3. **Drop**: Update `scheduledOrders` array, clear drag state
4. **Drag End**: Cleanup state

### State Management for Drag

- `draggedOrder`: Current order being dragged
- `draggedScheduledOrder`: Scheduled order context (if rescheduling)
- `dragOverTimeSlot`: Current hover target
- `isDragOverSidebar`: Sidebar drop zone state

## Form Handling

### Create Order Form

- **Controlled Components**: All inputs use `value` and `onChange`
- **Form State**: Single `formData` object
- **Validation**: HTML5 `required` attributes
- **Submission**: Prevents default, creates order, resets form

### Form Fields

- `customer`: Text input
- `pickupTime`: Datetime-local input
- `pickupAddress`: Textarea
- `deliverBeforeTime`: Datetime-local input
- `deliverBeforeAddress`: Textarea
- `equipmentType`: Select dropdown

## Calendar Implementation

### Time Slot Generation

```typescript
// Generates slots from 6 AM to 10 PM, 30-minute intervals
const timeSlots: string[] = []
for (let hour = 6; hour < 22; hour++) {
  timeSlots.push(`${hour}:00`)
  timeSlots.push(`${hour}:30`)
}
```

### Week Calculation

```typescript
// Calculates week start (Sunday) and generates 7 days
const getWeekDays = (): Date[] => {
  const startOfWeek = new Date(currentDate)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day
  startOfWeek.setDate(diff)
  // ... generate 7 days
}
```

### Order Scheduling

- Orders stored in `scheduledOrders` array
- Key: `${date}-${timeSlot}` for lookup
- Filtering: `unscheduledOrders = orders.filter(...)`

## TypeScript Configuration

### Strict Mode

- `verbatimModuleSyntax: true` - Requires type-only imports
- Type checking enabled for all files
- No implicit any

### Import Strategy

```typescript
// Type-only imports
import type { Order } from '../types/order'

// Value imports
import { useState } from 'react'
```

## Performance Considerations

### Current Optimizations

- **Component Splitting**: Separate components for table/calendar
- **Conditional Rendering**: Only render active view
- **Event Handlers**: Inline functions (acceptable for current scale)

### Future Optimizations

- **React.memo**: Memoize expensive components
- **useMemo/useCallback**: Cache calculations and callbacks
- **Code Splitting**: Lazy load routes
- **Virtual Scrolling**: For large order lists

## Error Handling

### Current State

- **Form Validation**: HTML5 required fields
- **User Feedback**: Confirmation dialogs for deletions
- **Empty States**: User-friendly messages

### Future Improvements

- Error boundaries for component errors
- Toast notifications for success/error
- Form validation with error messages
- API error handling

## Testing Strategy (Future)

### Planned Testing

- **Unit Tests**: Jest + React Testing Library
- **Component Tests**: Test user interactions
- **Integration Tests**: Test complete workflows
- **E2E Tests**: Playwright or Cypress

## Database Integration (Planned)

### SQLite Setup

```
server/
├── src/
│   ├── db/
│   │   └── database.ts      # SQLite connection
│   ├── models/
│   │   └── order.ts         # Data access layer
│   ├── routes/
│   │   └── orders.ts        # API routes
│   └── server.ts            # Express server
└── data/
    └── database.db          # SQLite file
```

### API Design (Planned)

```typescript
// RESTful endpoints
GET    /api/orders           // List all orders
GET    /api/orders/:id       // Get single order
POST   /api/orders           // Create order
PUT    /api/orders/:id       // Update order
DELETE /api/orders/:id       // Delete order
```

## Development Guidelines

### Code Style

- **Naming**: PascalCase for components, camelCase for variables
- **File Naming**: PascalCase for components (e.g., `OrderManagement.tsx`)
- **Type Definitions**: Separate files in `types/`
- **Imports**: Group by type (React, third-party, local)

### Component Guidelines

1. **Single Responsibility**: Each component has one purpose
2. **Props Interface**: Define props with TypeScript interfaces
3. **State Location**: Keep state as close to usage as possible
4. **Reusability**: Extract reusable logic to hooks/components

### Git Workflow (Recommended)

- Feature branches for new modules
- Descriptive commit messages
- Code review before merging

## Build and Deployment

### Development

```bash
npm run dev    # Starts Vite dev server on :5173
```

### Production Build

```bash
npm run build  # Creates optimized build in dist/
npm run preview # Preview production build locally
```

### Build Output

- **HTML**: Single `index.html` with script tags
- **JavaScript**: Bundled and minified
- **CSS**: Extracted and minified
- **Assets**: Optimized and hashed

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Features Used**: 
  - ES6+ JavaScript
  - CSS Grid/Flexbox
  - HTML5 Drag and Drop API
  - CSS Custom Properties

## Security Considerations

### Current

- **XSS Protection**: React's built-in escaping
- **Input Validation**: HTML5 validation

### Future

- **Authentication**: JWT tokens
- **Authorization**: Role-based access
- **CSRF Protection**: For API calls
- **Input Sanitization**: Server-side validation

## Known Limitations

1. **No Persistence**: Data lost on page refresh (in-memory state)
2. **No Backend**: All logic client-side
3. **No Authentication**: No user management
4. **No Offline Support**: Requires internet connection
5. **Limited Validation**: Basic HTML5 validation only

## Future Technical Roadmap

### Phase 1: Backend Integration
- [ ] Express.js server setup
- [ ] SQLite database
- [ ] REST API endpoints
- [ ] Data persistence

### Phase 2: Enhanced Features
- [ ] Order editing
- [ ] Advanced filtering/search
- [ ] Export functionality
- [ ] Real-time updates

### Phase 3: Advanced Features
- [ ] User authentication
- [ ] Multi-user support
- [ ] Role-based permissions
- [ ] Email notifications

### Phase 4: Optimization
- [ ] Performance optimization
- [ ] Code splitting
- [ ] Caching strategies
- [ ] Progressive Web App (PWA)

## Dependencies

### Production

- `react`: ^19.2.0
- `react-dom`: ^19.2.0
- `react-router-dom`: ^7.9.6
- `tailwindcss`: ^4.1.17
- `@tailwindcss/vite`: ^4.1.17

### Development

- `typescript`: ~5.9.3
- `vite`: npm:rolldown-vite@7.2.5
- `@vitejs/plugin-react`: ^5.1.1
- `eslint`: ^9.39.1
- `typescript-eslint`: ^8.46.4

## Troubleshooting

### Common Issues

1. **Tailwind styles not applying**
   - Ensure `index.css` is imported in `main.tsx`
   - Check Vite config has Tailwind plugin
   - Restart dev server

2. **Type errors with imports**
   - Use `import type` for type-only imports
   - Check `tsconfig.json` settings

3. **Drag and drop not working**
   - Check browser console for errors
   - Ensure `preventDefault()` in drag handlers
   - Verify state is properly managed

## Contributing Guidelines

1. Follow TypeScript best practices
2. Use functional components with hooks
3. Keep components small and focused
4. Add TypeScript types for all props/state
5. Test manually before committing
6. Update documentation for new features

---

**Last Updated**: Based on current implementation as of Order Management module completion.

