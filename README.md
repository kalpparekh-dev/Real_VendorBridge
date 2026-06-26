# VendorBridge

A production-ready B2B SaaS procurement and vendor management platform that connects internal procurement teams with external vendors across the full lifecycle: RFQ → Quotation → Comparison → Approval → PO → Invoice → Payment.

## Tech Stack

### Backend
- **Node.js + Express.js** - REST API server
- **PostgreSQL** - Primary database
- **Prisma ORM** - Database ORM and migrations
- **JWT** - Authentication (access + refresh tokens)
- **bcrypt** - Password hashing
- **Zod** - Server-side validation
- **Multer** - File uploads for invoice attachments

### Frontend
- **React 18 + TypeScript** - UI framework
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Framer Motion** - Animations
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Dashboard charts
- **React Hook Form + Zod** - Forms and validation
- **Axios** - API client
- **date-fns** - Date formatting
- **Zustand** - State management

## Features

### Role-Based Access Control
- **Admin** - Full system access, user management, reports
- **Procurement Officer** - Create/manage RFQs, view quotations, compare
- **Manager** - Approve/reject quotations
- **Finance** - Manage POs, invoices, payments
- **Vendor** - View RFQs, submit quotations, track POs and invoices

### Core Workflows
1. **RFQ Creation** - Procurement officers create RFQs with multiple items
2. **Quotation Submission** - Vendors submit quotations with pricing and delivery terms
3. **Quotation Comparison** - Compare quotations with automated scoring (price, delivery, rating)
4. **Approval Process** - Managers approve/reject quotations with comments
5. **PO Generation** - Automatic PO creation on approval
6. **Invoice Management** - Vendors upload invoices, finance team processes payments
7. **Payment Tracking** - Record payments with method and reference

### Dashboard Features
- **Admin Dashboard** - KPI cards, spend charts, RFQ volume trends, activity feed
- **Manager Dashboard** - Pending approvals queue with review workflow
- **Finance Dashboard** - PO list, invoice management, payment recording
- **Vendor Dashboard** - Open RFQs, quotation submission, PO tracking
- **Procurement Dashboard** - RFQ creation and management
- **Reports Page** - Spend analytics, vendor performance metrics

## Design System

### Color Palette
- **Background Base**: `#0A0C10` (near-black canvas)
- **Background Surface**: `#111318` (card/panel background)
- **Background Elevated**: `#1A1D24` (modals, dropdowns)
- **Border**: `#1F232D` (subtle dividers)
- **Accent**: `#3B6FFF` (sapphire blue - CTAs, active states)
- **Success**: `#22C55E`
- **Warning**: `#F59E0B`
- **Danger**: `#EF4444`
- **Text Primary**: `#F0F2F7`
- **Text Secondary**: `#8B90A0`
- **Text Muted**: `#4B5060`

### Typography
- **Display/Headings**: Inter - 600-700 weight, tight tracking
- **Body**: Inter - 400, 1.6 line-height
- **Mono/Data**: JetBrains Mono - for IDs, amounts, codes

### UI Components
- Border Radius: 8px cards, 6px inputs, 4px badges
- Shadows: Subtle 0 1px 3px rgba(0,0,0,0.4)
- Spacing: 4px base unit, sections breathe at 40-64px vertical padding

## Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn**

## Installation

### 1. Clone the Repository
```bash
cd vendorbridge
```

### 2. Backend Setup

```bash
cd server
npm install
```

#### Configure Environment Variables
Create a `.env` file in the `server` directory:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vendorbridge?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
PORT=5000
NODE_ENV=development
```

#### Set up PostgreSQL Database
```bash
# Create database
createdb vendorbridge

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Seed demo data
npm run prisma:seed
```

#### Start Backend Server
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd client
npm install
```

#### Start Frontend Dev Server
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Demo Credentials

After running the seed script, use these credentials to test different roles:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vendorbridge.com | demo123 |
| Procurement Officer | procurement@vendorbridge.com | demo123 |
| Manager | manager@vendorbridge.com | demo123 |
| Finance | finance@vendorbridge.com | demo123 |
| Vendor 1 | vendor1@techsupplies.com | demo123 |
| Vendor 2 | vendor2@officeessentials.com | demo123 |
| Vendor 3 | vendor3@industrial.com | demo123 |

## Project Structure

```
vendorbridge/
├── client/
│   ├── src/
│   │   ├── api/           # Axios instance + route functions
│   │   ├── components/    # Shared UI components
│   │   ├── layouts/       # RoleLayout, AuthLayout
│   │   ├── pages/         # One folder per role dashboard
│   │   ├── hooks/         # useAuth, useNotifications
│   │   ├── store/         # Zustand global state
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # Formatters, score calculator
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── routes/        # API route definitions
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/    # Auth, role guard, error handler
│   │   ├── services/      # Additional business logic
│   │   └── prisma/        # Schema + seed script
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Vendors
- `GET /api/vendors` - List all vendors
- `POST /api/vendors` - Create vendor (Admin only)
- `GET /api/vendors/:id` - Get vendor details
- `PUT /api/vendors/:id` - Update vendor (Admin only)
- `DELETE /api/vendors/:id` - Delete vendor (Admin only)

### RFQs
- `GET /api/rfqs` - List all RFQs
- `POST /api/rfqs` - Create RFQ
- `GET /api/rfqs/:id` - Get RFQ details
- `PUT /api/rfqs/:id` - Update RFQ
- `POST /api/rfqs/:id/publish` - Publish RFQ

### Quotations
- `GET /api/quotations` - List all quotations
- `POST /api/quotations` - Submit quotation (Vendor only)
- `GET /api/quotations/:id` - Get quotation details
- `POST /api/quotations/:id/approve` - Approve quotation (Manager)
- `POST /api/quotations/:id/reject` - Reject quotation (Manager)

### Purchase Orders
- `GET /api/purchase-orders` - List all POs
- `GET /api/purchase-orders/:id` - Get PO details

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices/:id/pay` - Record payment (Finance only)

### Reports
- `GET /api/reports/spend` - Spend by category
- `GET /api/reports/rfq-volume` - RFQ volume trend
- `GET /api/reports/vendor-performance` - Vendor performance metrics

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications/:id/read` - Mark as read

### Activities
- `GET /api/activities` - Get activity log

## Validation Rules

- RFQ deadline must be at least 3 days in the future
- Quotation cannot be submitted after deadline
- Quotation unit prices must be > 0
- Invoice amount must match PO total (±5% tolerance)
- Payment reference required if method is "Bank Transfer"
- Vendor email must be unique

## Quotation Scoring Algorithm

When comparing quotations, a composite score is calculated:

```javascript
const score = (
  (1 - normalizedPrice) * 0.5 +     // lower price = better
  (1 - normalizedDelivery) * 0.3 +  // faster delivery = better
  vendorRating / 5 * 0.2            // higher rating = better
) * 100;
```

## Building for Production

### Backend
```bash
cd server
npm run build
npm start
```

### Frontend
```bash
cd client
npm run build
npm run preview
```

## License

MIT

## Support

For issues or questions, please open an issue on the repository.
